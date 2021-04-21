import { Injectable } from '@angular/core';
import bankersRounding from 'bankers-rounding';
import { map, tap, take, catchError } from 'rxjs/operators';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { Store } from '@ngrx/store';
import { CollectionsCesMicroData, MicroRatioCellContextError, MicroRatioOtmScreeningContextError } from 'src/app/shared/models/collections-microdata.model';
import { ScreeningParametersDto } from 'src/app/shared/models/screening-parameters-dto.model';
import { QuiData } from 'src/app/shared/models/quidata.model';
import { CaseDetailsService } from './case-details.service';
import { LookupService } from 'src/app/core/services/lookup.service';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';

@Injectable({
  providedIn: 'root'
})
export class MicroRatioService {

  isCES: boolean;
  currentEnvironmentVariables: EnvironmentDetails = null;
  minimumAEChangeEnvVariable: number;
  minimumChangeAOTEnvVariable: number;



  constructor(private lookupService: LookupService, private store: Store<fromApp.AppState>,) {
    this.lookupService.IsCES$.subscribe(value => {
      this.isCES = value;
    });


    // get all environment variables
    this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
      this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
    });

    // get env variables
    this.minimumAEChangeEnvVariable = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'MINIMUM_CHANGE_VALUE').envValue;
    this.minimumChangeAOTEnvVariable = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'AOT_DIFF').envValue;

  }

  calculateMicroRatios(monthlyMicrodataViewModel: CollectionsCesMicroData): void {
    if ((monthlyMicrodataViewModel.PayFrequency.code == null) || (monthlyMicrodataViewModel.CommisionPayFrequncy.code == null)) {
      return;
    }

    monthlyMicrodataViewModel.RatioPrLp = this.computeLpFactor(+monthlyMicrodataViewModel.RefMM, +monthlyMicrodataViewModel.RefYY, +monthlyMicrodataViewModel.PayFrequency.code);
    monthlyMicrodataViewModel.RatioCmLp = this.computeLpFactor(+monthlyMicrodataViewModel.RefMM, +monthlyMicrodataViewModel.RefYY, +monthlyMicrodataViewModel.CommisionPayFrequncy.code);

    // WW Ratio
    // Change of PW/AE and WW/AE ratios to become whole numbers on v2017.p3.7.0 request
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers)  && this.isReportedAndValid(monthlyMicrodataViewModel.TotalWomenWorkers)) {
        const result = +monthlyMicrodataViewModel.TotalWomenWorkers / +monthlyMicrodataViewModel.TotalWorkers;
        monthlyMicrodataViewModel.WWAE =  (Math.round(result * 100 + Number.EPSILON ) / 100);
      } else {
        monthlyMicrodataViewModel.WWAE = null;
    }

    // PW Ratio
    // Change of PW/AE and WW/AE ratios to become whole numbers on v2017.p3.7.0 request
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) && this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
      const result = +monthlyMicrodataViewModel.TotalNonSupervisoryWokers / +monthlyMicrodataViewModel.TotalWorkers;
      monthlyMicrodataViewModel.PWAE = (Math.round(result * 100 + Number.EPSILON ) / 100);
    } else {
      monthlyMicrodataViewModel.PWAE = null;
    }

    // Average Hourly Earnings for PW
    // Addition to spec: [(PR x Plp Factor) + (Comm x Clp Factor)] / (HR x Plp Factor).
    let sum = 0;
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) && +monthlyMicrodataViewModel.RatioPrLp > 0) {
        sum = +monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls *  monthlyMicrodataViewModel.RatioPrLp;
        if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) &&  monthlyMicrodataViewModel.RatioCmLp > 0 && sum >= 0) {
            // sum = (sum + (currentMicro.PW_CM * currentRatio.CM_LP)).toFixed(2);
            sum = (sum + (+monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions *  monthlyMicrodataViewModel.RatioCmLp));
        }
        const result = sum / (+monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours *  monthlyMicrodataViewModel.RatioPrLp);
        monthlyMicrodataViewModel.PWAHE = (Math.round(result * 100 + Number.EPSILON ) / 100);
      } else {
        monthlyMicrodataViewModel.PWAHE = null;
    }

    sum = 0;
    // Average Hourly Earnings for AE
    // Addition to spec: [(PR x Plp Factor) + (Comm x Clp Factor)] / (HR x Plp Factor).
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkerHours) && monthlyMicrodataViewModel.RatioPrLp  > 0) {
        sum = +monthlyMicrodataViewModel.TotalWorkerPayrolls * monthlyMicrodataViewModel.RatioPrLp ;
        if (this.isValuePositive(monthlyMicrodataViewModel.TotalCommisions) && monthlyMicrodataViewModel.RatioCmLp  > 0 && sum >= 0) {
            sum = (sum + (+monthlyMicrodataViewModel.TotalCommisions * monthlyMicrodataViewModel.RatioCmLp));
        }
        const result = sum / (+monthlyMicrodataViewModel.TotalWorkerHours * monthlyMicrodataViewModel.RatioPrLp);
        monthlyMicrodataViewModel.AHE = (Math.round(result * 100) / 100);
      } else {
        monthlyMicrodataViewModel.AHE = null;
    }


    // Average Weekly Hours for PW
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) && monthlyMicrodataViewModel.RatioPrLp > 0) {
      const result = (+monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours / +monthlyMicrodataViewModel.TotalNonSupervisoryWokers) *  monthlyMicrodataViewModel.RatioPrLp;
      monthlyMicrodataViewModel.PWAWH = (Math.round(result * 100) / 100);
    } else {
      monthlyMicrodataViewModel.PWAWH = null;
    }


    // Average Weekly Hours for AE

    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours) && monthlyMicrodataViewModel.RatioPrLp > 0) {
      const result = (+monthlyMicrodataViewModel.TotalWorkerHours / +monthlyMicrodataViewModel.TotalWorkers) *  monthlyMicrodataViewModel.RatioPrLp;
      monthlyMicrodataViewModel.AWH =  (Math.round(result * 100) / 100);
    } else {
      monthlyMicrodataViewModel.AWH = null;
    }


    // Average Overtime for PW
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) &&  monthlyMicrodataViewModel.RatioPrLp > 0) {
          const result = (+monthlyMicrodataViewModel.TotalNonSupervisoryOvertime / +monthlyMicrodataViewModel.TotalNonSupervisoryWokers) *  monthlyMicrodataViewModel.RatioPrLp;
          monthlyMicrodataViewModel.PWAOT = (Math.round(result * 100 + Number.EPSILON) / 100);
        } else {
          monthlyMicrodataViewModel.PWAOT = null;
    }



    // Average Overtime for AE
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
          this.isReportedAndValid(monthlyMicrodataViewModel.TotalOvertime) &&  monthlyMicrodataViewModel.RatioPrLp > 0) {
        const result = (+monthlyMicrodataViewModel.TotalOvertime / +monthlyMicrodataViewModel.TotalWorkers) *  monthlyMicrodataViewModel.RatioPrLp;
        monthlyMicrodataViewModel.AOT = (Math.round(result * 100 + Number.EPSILON) / 100);
      } else {
        monthlyMicrodataViewModel.AOT = null;
    }

    // Average Weekly Earnings for PW
    if (monthlyMicrodataViewModel.PWAWH != null && monthlyMicrodataViewModel.PWAHE != null) {
        const result = (+monthlyMicrodataViewModel.PWAWH * +monthlyMicrodataViewModel.PWAHE);
        monthlyMicrodataViewModel.PWAWE = (Math.round(result * 100 + Number.EPSILON) / 100);
      } else {
        monthlyMicrodataViewModel.PWAWE = null;
    }



    // Average Weekly Earnings for AE
    if (monthlyMicrodataViewModel.AWH != null && monthlyMicrodataViewModel.AHE != null) {
        const result = (+monthlyMicrodataViewModel.AWH * +monthlyMicrodataViewModel.AHE);
        monthlyMicrodataViewModel.AWE = (Math.round(result * 100 + Number.EPSILON) / 100);
      } else {
        monthlyMicrodataViewModel.AWE = null;
    }



    // AE_AWH to be <= 168 hours/week
    if (monthlyMicrodataViewModel.AWH > 168) {
        monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
        monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
        // make the cell red highlight - not blue
        monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgWeeklyHrsRatioError = true;
        monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E46');
        monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E46');
        monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AWH', 'E46');
    }

    // PW_AWH to be <= 168 hours/week
    if (monthlyMicrodataViewModel.PWAWH > 168) {
      monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
      monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
      // make the cell red highlight - not blue
      monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionWorkerAvgWeeklyHrsRatioError = true;
      monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PWAWH', 'E47');
      monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E47');
      monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E47');
    }





    // set flag that ratio calculations have been run
    monthlyMicrodataViewModel.areRatiosAvailable = true;
  }

  performRatioMinMaxScreening(monthlyMicrodataViewModel: CollectionsCesMicroData, screeningParams: ScreeningParametersDto): void {
      // WWRatio check - WWAE
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWomenWorkers) &&
          this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkers) &&
          this.isValuePositiveOrZero(monthlyMicrodataViewModel.WWAE)) {
              if (monthlyMicrodataViewModel.WWAE < screeningParams.WwAeMin) {
                monthlyMicrodataViewModel.MicroDataRatioContextError.isWomenToTotalWokerRatioError = true;
                monthlyMicrodataViewModel.CesScreeningErrorScripts.set('WWAE', 'S23');
                monthlyMicrodataViewModel.CesScreeningErrorScripts.set('WWAE-ScreenValue', `( < ${screeningParams.WwAeMin})`);
              }
              if (monthlyMicrodataViewModel.WWAE > screeningParams.WwAeMax) {
                monthlyMicrodataViewModel.MicroDataRatioContextError.isWomenToTotalWokerRatioError = true;
                monthlyMicrodataViewModel.CesScreeningErrorScripts.set('WWAE', 'S24');
                monthlyMicrodataViewModel.CesScreeningErrorScripts.set('WWAE-ScreenValue', `( > ${screeningParams.WwAeMax})`);
              }
      }

       // PWAE check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkers) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.PWAE)) {
           if (monthlyMicrodataViewModel.PWAE < screeningParams.PwAeMin) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionToTotalWorkerRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAE', 'S01');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAE-ScreenValue', `( < ${screeningParams.PwAeMin})`);
           }
           if (monthlyMicrodataViewModel.PWAE > screeningParams.PwAeMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionToTotalWorkerRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAE', 'S02');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAE-ScreenValue', `( > ${screeningParams.PwAeMax})`);
           }
      }

       // PWAHE check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
       this.isValuePositive(monthlyMicrodataViewModel.PWAHE)) {
           if (monthlyMicrodataViewModel.PWAHE < screeningParams.AhePwMin) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionWorkerAvgHrsEarningsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAHE', 'S05');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAHE-ScreenValue', `( < ${screeningParams.AhePwMin})`);
           }
           if (monthlyMicrodataViewModel.PWAHE > screeningParams.AhePwMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionWorkerAvgHrsEarningsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAHE', 'S06');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAHE-ScreenValue', `( > ${screeningParams.AhePwMax})`);
           }
      }

       // AHE check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkerPayrolls) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkerHours) &&
       this.isValuePositive(monthlyMicrodataViewModel.AHE)) {
           if (monthlyMicrodataViewModel.AHE < screeningParams.AheAeMin) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgHrsEarningsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AHE', 'S03');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AHE-ScreenValue', `( < ${screeningParams.AheAeMin})`);
           }
           if (monthlyMicrodataViewModel.AHE > screeningParams.AheAeMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgHrsEarningsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AHE', 'S04');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AHE-ScreenValue', `( > ${screeningParams.AheAeMax})`);
           }
      }

       // PWAWH check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
       this.isValuePositive(monthlyMicrodataViewModel.PWAWH)) {
           if (monthlyMicrodataViewModel.PWAWH < screeningParams.AwhPwMin) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionWorkerAvgWeeklyHrsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAWH', 'S09');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAWH-ScreenValue', `( < ${screeningParams.AwhPwMin})`);
           }
           if (monthlyMicrodataViewModel.PWAWH > screeningParams.AwhPwMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isProductionWorkerAvgWeeklyHrsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAWH', 'S10');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('PWAWH-ScreenValue', `( > ${screeningParams.AwhPwMax})`);
           }
      }


       // AWH check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkers) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkerHours) &&
       this.isValuePositive(monthlyMicrodataViewModel.AWH)) {
           if (monthlyMicrodataViewModel.AWH < screeningParams.AwhAeMin) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgWeeklyHrsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AWH', 'S07');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AWH-ScreenValue', `( < ${screeningParams.AwhAeMin})`);
           }
           if (monthlyMicrodataViewModel.AWH > screeningParams.AwhAeMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgWeeklyHrsRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AWH', 'S08');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AWH-ScreenValue', `( > ${screeningParams.AwhAeMax})`);
           }
      }


       // AOT check
      if (this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalWorkers) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.TotalOvertime) &&
       this.isValuePositiveOrZero(monthlyMicrodataViewModel.AOT)) {
           if (monthlyMicrodataViewModel.AOT > screeningParams.AotAeMax) {
             monthlyMicrodataViewModel.MicroDataRatioContextError.isTotalWorkerAvgOvertimeRatioError = true;
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AOT', 'S11');
             monthlyMicrodataViewModel.CesScreeningErrorScripts.set('AOT-ScreenValue', `( > ${screeningParams.AotAeMax})`);
           }
      }

    }

  performRatioOtmScreening(currentMonthMicrodataViewModel: CollectionsCesMicroData,
                           prevMonthMicrodataViewModel: CollectionsCesMicroData,
                           screeningParams: ScreeningParametersDto,
                           scheduledType: string) {


        if (currentMonthMicrodataViewModel != null &&
            prevMonthMicrodataViewModel != null &&
            !currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios()) {

            // check the delta value for AE current vs prev for error
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
                this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkers)) {
              if (+prevMonthMicrodataViewModel.TotalWorkers !== 0) {
                const deltaAE = Math.abs(+prevMonthMicrodataViewModel.TotalWorkers - +currentMonthMicrodataViewModel.TotalWorkers);
                if (deltaAE > 0 && deltaAE > this.minimumAEChangeEnvVariable && +prevMonthMicrodataViewModel.TotalWorkers !== 0) { // we do check first change is > 0 in case envvariable-change becomes -ve in DB ?? possible ??
                  if (deltaAE / +prevMonthMicrodataViewModel.TotalWorkers >= screeningParams.AeChange) {
                    currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmTotalWorkerError = true;
                    currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AE', 'S12');
                  }
                }
              }
            }


            // check for WWRatio Otm error
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWomenWorkers) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWomenWorkers) &&
               this.isValuePositive(prevMonthMicrodataViewModel.WWAE)) {
                 // calcualte the delta of Women workers
                  const deltaWW = Math.abs(+prevMonthMicrodataViewModel.TotalWomenWorkers - +currentMonthMicrodataViewModel.TotalWomenWorkers);
                  // if change positive and greater than minimum env change needed
                  if (deltaWW > 0 && deltaWW > this.minimumAEChangeEnvVariable) {
                    // calculate delta of WWAE ratio
                    const deltaAEWW  = Math.abs(prevMonthMicrodataViewModel.WWAE - currentMonthMicrodataViewModel.WWAE);
                    // if delta/WWAE ratio is greater or equal ot screening params - its error
                    if (deltaAEWW / prevMonthMicrodataViewModel.WWAE >= screeningParams.WwAeChange) {
                      currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmWomenWorkerRatioError = true;
                      currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('WWAE', 'S25');
                      currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('WWAE-PrevValue', prevMonthMicrodataViewModel.WWAE.toString());
                    }
                  }

               }



               // check PW/AE change
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
               this.isValuePositive(prevMonthMicrodataViewModel.PWAE)) {
                 // calcualte the chagen of Women workers
                  const deltaPW = Math.abs(+prevMonthMicrodataViewModel.TotalNonSupervisoryWokers - +currentMonthMicrodataViewModel.TotalNonSupervisoryWokers);
                  // if change positive and greater than minimum env change needed
                  if (deltaPW > 0 && deltaPW > this.minimumAEChangeEnvVariable) {
                    // calculate change of WWAE ratio
                    const deltaPWAE = Math.abs(prevMonthMicrodataViewModel.PWAE - currentMonthMicrodataViewModel.PWAE);
                    // if delta/WWAE ratio is greater or equal ot screening params - its error
                    if (deltaPWAE / prevMonthMicrodataViewModel.PWAE >= screeningParams.PwAEChange) {
                      currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmProductionWorkerError = true;
                      currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PW', 'S13');
                      currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmProductionWorkerRatioError = true;
                      currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAE', 'S13');
                    }
                  }

               }

               // AEAWH check
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkerHours) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkers) &&
               this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkerHours) &&
               this.isValuePositive(prevMonthMicrodataViewModel.AWH)) {
                    // calculate change ofa avg Weekly Hours ratio ratio
                    const deltaAWH = Math.abs(prevMonthMicrodataViewModel.AWH - currentMonthMicrodataViewModel.AWH);
                    if (deltaAWH > 0) {
                      if (deltaAWH / prevMonthMicrodataViewModel.AWH >= screeningParams.AwhAeChange) {
                        currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmTotalWorkerAvgWeeklyHrsRatioError = true;
                        currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AWH', 'S14');
                        currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AWH-PrevValue', prevMonthMicrodataViewModel.AWH.toString());
                      }
                  }
                }

                 // PWAWH check
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
            this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
            this.isValuePositive(prevMonthMicrodataViewModel.PWAWH)) {
                 // calculate change of non-sup Avg Weekly Hours ratio
                 const deltaPWAWH = Math.abs(prevMonthMicrodataViewModel.PWAWH - currentMonthMicrodataViewModel.PWAWH);
                 if (deltaPWAWH > 0) {
                   if (deltaPWAWH / prevMonthMicrodataViewModel.PWAWH >= screeningParams.AwhPeChange) {
                     currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmProductionWorkerAvgWeeklyHrsRatioError = true;
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAWH', 'S15');
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAWH-PrevValue', prevMonthMicrodataViewModel.PWAWH.toString());

                   }
               }
             }


               // AHE check
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkerHours) &&
            this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkerPayrolls) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkerHours) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkerPayrolls) &&
            this.isValuePositive(prevMonthMicrodataViewModel.AHE)) {
                 // calculate change of Avg Hourly earnings ratio
                 const deltaAHE = Math.abs(prevMonthMicrodataViewModel.AHE - currentMonthMicrodataViewModel.AHE);
                 if (deltaAHE > 0) {
                   if (deltaAHE / prevMonthMicrodataViewModel.AHE >= screeningParams.AheAeChange) {
                     currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmTotalWorkerAvgHrsEarningsRatioError = true;
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AHE', 'S16');
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AHE-PrevValue', prevMonthMicrodataViewModel.AHE.toString());
                   }
               }
             }


                // PWAHE Check
            if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
            this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
            this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
            this.isValuePositive(prevMonthMicrodataViewModel.PWAHE)) {
              // calculate change of non-supervisory Avg Hourly earnings ratio
                 const deltaPWAHE = Math.abs(prevMonthMicrodataViewModel.PWAHE - currentMonthMicrodataViewModel.PWAHE);
                 if (deltaPWAHE > 0) {
                   if (deltaPWAHE / prevMonthMicrodataViewModel.PWAHE >= screeningParams.AhePwChange) {
                     currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmProductionWorkerAvgHrsEarningsRatioError = true;
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAHE', 'S17');
                     currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAHE-PrevValue', prevMonthMicrodataViewModel.PWAHE.toString());
                   }
               }
             }

            if (scheduledType === 'C') {
                // AE_AOT Check(only for certain SICs)
                // Check if Change in AE_AOT is too high (for manufacturing only)
                // Don't perform test 6.2.2.7 if  |AE_OTc - AE_OTc-1| < AOT_DIFF

                if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalOvertime) &&
                this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
                this.isReportedAndValid(prevMonthMicrodataViewModel.TotalOvertime) &&
                this.isReportedAndValid(prevMonthMicrodataViewModel.TotalWorkers) &&
                this.isValuePositive(prevMonthMicrodataViewModel.AOT)) {
                     // calculate change of avg overtime ratio
                     const deltaAOT = Math.abs(prevMonthMicrodataViewModel.AOT - currentMonthMicrodataViewModel.AOT);
                     const deltaOT = Math.abs(+prevMonthMicrodataViewModel.TotalOvertime - +currentMonthMicrodataViewModel.TotalOvertime);
                     if (deltaOT > 0 && deltaOT >= this.minimumChangeAOTEnvVariable) {
                       if (deltaAOT / prevMonthMicrodataViewModel.AOT >= screeningParams.AotAeChange) {
                         currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isTotalWorkerAvgOvertimeRatioError = true;
                         currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AOT', 'S18');
                         currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('AOT-PrevValue', prevMonthMicrodataViewModel.AOT.toString());
                       }
                   }
                }

                if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryOvertime) &&
                 this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
                 this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryOvertime) &&
                 this.isReportedAndValid(prevMonthMicrodataViewModel.TotalNonSupervisoryWokers) &&
                 this.isValuePositive(prevMonthMicrodataViewModel.PWAOT)) {
                      // calculate change of avg overtime ratio
                      const deltaPWAOT = Math.abs(prevMonthMicrodataViewModel.PWAOT - currentMonthMicrodataViewModel.PWAOT);
                      const deltaPWOT = Math.abs(+prevMonthMicrodataViewModel.TotalNonSupervisoryOvertime - +currentMonthMicrodataViewModel.TotalNonSupervisoryOvertime);
                      if (deltaPWOT > 0 && deltaPWOT >= this.minimumChangeAOTEnvVariable) {
                        if (deltaPWAOT / prevMonthMicrodataViewModel.PWAOT >= screeningParams.AotPwChange) {
                          currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isOtmProductionWorkerAvgOvertimeRatioError = true;
                          currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAOT', 'S19');
                          currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.set('PWAOT-PrevValue', prevMonthMicrodataViewModel.PWAOT.toString());
                        }
                    }
                }
              }
          }
  }





  // compute LP factors for each PLp options
  computeLpFactor(refMM: number, refYY: number, plopp: number): number | null {
    let lpFactor = 0;
    try {
        switch (plopp) {
            case 1:
              lpFactor = 1;
              break;
            case 2:
              lpFactor = 0.5;
              break;
            //Case 3 & 4 round LP up to 4 decimal places
            case 3:
              lpFactor = bankersRounding((5 / this.getNumberOfWeekDays(refYY, refMM, 1, 15)), 2);
              break;
            case 4:
                const lLastDateOfMonth = new Date(refYY, refMM, 0);
                lpFactor = bankersRounding((5 / this.getNumberOfWeekDays(refYY, refMM, 1, lLastDateOfMonth.getDate())), 2);
                break;
            default:
              lpFactor = null;
              break;
            }
        } catch (e) {
        return null;
    }
    return lpFactor;
  }

  // get the number of weekdays given the start date and end date for the month and year
  getNumberOfWeekDays(year: number, month: number, startDate: number, endDate: number) {
      let weekDays = 0;
      let lDate = null;
      try {
          for (let day = startDate; day <= endDate; day++) {
              lDate = new Date(year, month - 1, day);
              if (lDate.getDay() !== 6 && lDate.getDay() !== 0) {
                weekDays++;
              }
          }
        } catch (e) {
      return null;
      }
      return weekDays;
  }




  isNumber(value: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
  }


  isValuePositiveOrZero(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue >= 0;
    }
  }

  isValuePositive(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue > 0;
    }
  }

  isValuePositiveNumber(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue > 0;
    }
  }


  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '';
  }

}
