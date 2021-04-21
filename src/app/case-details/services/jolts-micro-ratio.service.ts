import { Injectable } from '@angular/core';
import { CollectionsJoltsMicroDataDto, CollectionsJoltsMicroData, ReferencePeriod } from 'src/app/shared/models/collections-microdata.model';
import bankersRounding from 'bankers-rounding';
import { JoltsScreeningParametersDto } from 'src/app/shared/models/screening-parameters-dto.model';
import { QuiData } from 'src/app/shared/models/quidata.model';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { EnvironmentVariable } from 'src/app/shared/models/environment-variable.model';
import { DropLetterComponent } from 'src/app/drop-letter/drop-letter.component';
import { LookupAddress } from 'dns';
import { LookupService } from 'src/app/core/services/lookup.service';



// Author: Prasad 05/20/2020
// Service for JOLTS collections calucation of Ratios and LDB checks
@Injectable({
  providedIn: 'root'
})
export class JoltsMicroRatioService {

  currentEnvironmentVariables: EnvironmentDetails = null;
  refPeriod: ReferencePeriod = null;
  minValueForHires: number;
  minValueForQuits: number;
  minValueForLayoffsAndDischarge: number;
  minValueForTotalSeperataion: number;
  minValueForOtherSeperation: number;
  minValueForJobOpenings: number;
  currentMonthlyMicrodataViewModel: CollectionsJoltsMicroData = null;
  prevMonthlyMicrodataViewModel: CollectionsJoltsMicroData = null;


  constructor(private store: Store<fromApp.AppState>,
              private lookupService: LookupService) {

      // get all environment variables
      this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
        this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
      });

      if (!this.lookupService.isCES) {
        this.minValueForHires = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_H').envValue;
        this.minValueForQuits =  +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_Q').envValue;
        this.minValueForLayoffsAndDischarge = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_LD').envValue;
        this.minValueForTotalSeperataion = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_TS').envValue;
        this.minValueForOtherSeperation = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_OS').envValue;
        this.minValueForJobOpenings = +this.currentEnvironmentVariables.environmentVariables.find(a => a.envGroup === 'DATACOLLECTION_CONTROLS' && a.envName === 'MIN_JO').envValue;
      }
  }

  // calucaltes JOLTS micro ratios
  calculateJoltsMicroRatios(monthlyMicrodataViewModel: CollectionsJoltsMicroData): void {

    // JOR - Job opening Rate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
      this.isReportedAndValid(monthlyMicrodataViewModel.JobOpenings)) {
        const total = +monthlyMicrodataViewModel.TotalWorkers + +monthlyMicrodataViewModel.JobOpenings;
        if (total !== 0) {
          monthlyMicrodataViewModel.JobOpeningsRate = bankersRounding(((+monthlyMicrodataViewModel.JobOpenings) / total) * 100, 2);
        }
    } else {
      // remove calculations if calcualted pervious step (this is a case where user entered something and then undoing one of the 2 values TE and JO)
      monthlyMicrodataViewModel.JobOpeningsRate = null;
    }

    // LDR - LayoffsAndDischarges Rate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
      this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges)) {
          monthlyMicrodataViewModel.LayoffsAndDischargesRate = bankersRounding((+monthlyMicrodataViewModel.LayoffsAndDischarges / +monthlyMicrodataViewModel.TotalWorkers) * 100, 2);
    } else {
      // remove calculations if calcualted pervious step (this is a case where user entered something and then undoing one of the 2 values TE and LD)
      monthlyMicrodataViewModel.LayoffsAndDischargesRate = null;
    }

     // HR - NewHires Rate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
     this.isReportedAndValid(monthlyMicrodataViewModel.NewHires)) {
         monthlyMicrodataViewModel.NewHiresRate = bankersRounding((+monthlyMicrodataViewModel.NewHires / +monthlyMicrodataViewModel.TotalWorkers) * 100, 2);
    } else {
      // remove calculations if calcualted pervious step
      monthlyMicrodataViewModel.NewHiresRate = null;
    }


    // QR - QuitsRate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
      this.isReportedAndValid(monthlyMicrodataViewModel.Quits)) {
          monthlyMicrodataViewModel.QuitsRate = bankersRounding((+monthlyMicrodataViewModel.Quits / +monthlyMicrodataViewModel.TotalWorkers) * 100, 2);
    } else {
      // remove calculations if calcualted pervious step
      monthlyMicrodataViewModel.QuitsRate = null;
    }

    // OSR - Other sep Rate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
      this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation)) {
          monthlyMicrodataViewModel.OtherSeperationRate = bankersRounding((+monthlyMicrodataViewModel.OtherSeperation / +monthlyMicrodataViewModel.TotalWorkers) * 100, 2);
    } else {
      // remove calculations if calcualted pervious step
      monthlyMicrodataViewModel.OtherSeperationRate = null;
    }

    // TSR - Job opening Rate
    if (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers) &&
      this.isReportedAndValid(monthlyMicrodataViewModel.TotalSeperation)) {
          monthlyMicrodataViewModel.TotalSeperationRate = bankersRounding((+monthlyMicrodataViewModel.TotalSeperation / +monthlyMicrodataViewModel.TotalWorkers) * 100, 2);
    } else {
      // remove calculations if calcualted pervious step
      monthlyMicrodataViewModel.TotalSeperationRate = null;
    }

    this.recalculateDerivedIndicators(monthlyMicrodataViewModel, true);

    // set flag that ratio calculations have been run
    monthlyMicrodataViewModel.areRatiosAvailable = true;
  }



  recalculateDerivedIndicators(currentMonthlyMicrodataViewModel: CollectionsJoltsMicroData, updateCummDiff: boolean) {
    // reset all deriavatives
    // currentMonthlyMicrodataViewModel.TotalEmployeeChange = null;
    // currentMonthlyMicrodataViewModel.NetTurn = null;
    // currentMonthlyMicrodataViewModel.Difference = null;
    // currentMonthlyMicrodataViewModel.CummulativeDifference = null;

    if (currentMonthlyMicrodataViewModel != null) {

      if (this.prevMonthlyMicrodataViewModel != null) {
        // TeChg
        if (this.isNumber(currentMonthlyMicrodataViewModel.TotalWorkers) && this.isNumber(this.prevMonthlyMicrodataViewModel.TotalWorkers)) {
          currentMonthlyMicrodataViewModel.TotalEmployeeChange = +currentMonthlyMicrodataViewModel.TotalWorkers - +this.prevMonthlyMicrodataViewModel.TotalWorkers;
        } else {
          currentMonthlyMicrodataViewModel.TotalEmployeeChange = null;
        }
      }

       // netturn
      if (this.isNumber(currentMonthlyMicrodataViewModel.NewHires) && this.isNumber(currentMonthlyMicrodataViewModel.TotalSeperation)) {
        currentMonthlyMicrodataViewModel.NetTurn = +currentMonthlyMicrodataViewModel.NewHires - +currentMonthlyMicrodataViewModel.TotalSeperation;
      } else {
        currentMonthlyMicrodataViewModel.NetTurn = null;
      }

       // Diff
      if (this.isNumber(currentMonthlyMicrodataViewModel.TotalEmployeeChange) && (this.isNumber(currentMonthlyMicrodataViewModel.NetTurn))) {
        currentMonthlyMicrodataViewModel.Difference = +currentMonthlyMicrodataViewModel.NetTurn - +currentMonthlyMicrodataViewModel.TotalEmployeeChange;
      } else {
        currentMonthlyMicrodataViewModel.Difference = null;
      }

      if (updateCummDiff) {
        // CumulativeDifference
        let tempCummulativeDifference: number | string = currentMonthlyMicrodataViewModel.Difference != null ? +currentMonthlyMicrodataViewModel.Difference : null;
        //  if (currentMonthlyMicrodataViewModel.ResetCummulativeDifference) {
        if (this.prevMonthlyMicrodataViewModel != null && this.prevMonthlyMicrodataViewModel.CummulativeDifference != null) {
          tempCummulativeDifference = +tempCummulativeDifference + +this.prevMonthlyMicrodataViewModel.CummulativeDifference;
          // if (tempCummulativeDifference == null && this.prevMonthlyMicrodataViewModel.CummulativeDifference != null) {
          //   tempCummulativeDifference = +this.prevMonthlyMicrodataViewModel.CummulativeDifference;
          // } else if (tempCummulativeDifference != null && this.prevMonthlyMicrodataViewModel.CummulativeDifference == null) {
          //   tempCummulativeDifference = +this.prevMonthlyMicrodataViewModel.CummulativeDifference;
          // }
        }

        // also check if this micro row has any value
        if (!this.IsCurrentMonthlyMicroDataReported(currentMonthlyMicrodataViewModel)) {
          currentMonthlyMicrodataViewModel.CummulativeDifference = null;
        } else {
          currentMonthlyMicrodataViewModel.CummulativeDifference = tempCummulativeDifference == null ? null : tempCummulativeDifference;
        }

        //  }
      }


    } else {
      currentMonthlyMicrodataViewModel.TotalEmployeeChange = null;
      currentMonthlyMicrodataViewModel.NetTurn = null;
      currentMonthlyMicrodataViewModel.Difference = null;
      currentMonthlyMicrodataViewModel.CummulativeDifference = null;
     }
  }

  // LDB: Logitudinal Database -  Source from which CES and JOLTS sample members are drawn. Created
  // and maintained from State Unemployment Insurance files provided to BLS each quarter
  // Performs tests for First month TotalEmployees LDB chcks for JOLTS
  // The maximum allowable percentage that the first-time reported
  // AE is over or under the corresponding value on the Longitudinal
  // Database
  joltsLdbChecks(currentMonthlyMicrodataViewModel: CollectionsJoltsMicroData,
                 joltsScreeningParameters: JoltsScreeningParametersDto,
                 quiData: QuiData, caseStartDate: string, unitAeLdbRC: string) {
        // get environment reference period
        //  this.refPeriod = { refMM: +this.getEnvironemntValue('CURRENT_MONTH'),
        //                     refYY: +this.getEnvironemntValue('CURRENT_YEAR'),
        //                     AeLdbMonth: +this.getEnvironemntValue('AE_LDB_CHECK_MONTH')
        //                   };


        // let x = this.isValuePositive(5);
        // x = this.isValuePositive('5');
        // x = this.isValuePositive(null);
        // x = this.isValuePositive(0);
        // x = this.isValuePositive('0');

        // x = this.isNumber(5);
        // x = this.isNumber('5');
        // x = this.isNumber(null);
        // x = this.isNumber('dhfh');

        // x = this.isValuePositiveOrZero(5);
        // x = this.isValuePositiveOrZero('5');
        // x = this.isValuePositiveOrZero(0);
        // x = this.isValuePositiveOrZero('0');
        // x = this.isValuePositiveOrZero(null);



        // get latest ldb for AE
       const mostRecentLdbAe = this.getMostRecentLdbAe(quiData);

        // check if ldb checks can be done
       if (this.canDoLdbChecks(currentMonthlyMicrodataViewModel.TotalWorkers, caseStartDate, unitAeLdbRC, mostRecentLdbAe, quiData, joltsScreeningParameters)) {
          // run ld check test and return values
          const [hasTestPassed, calculatedAeLdbValue] = this.testJoltsAeLdb(mostRecentLdbAe, currentMonthlyMicrodataViewModel, joltsScreeningParameters, quiData);

          // if test passed return the
          if (hasTestPassed) {
            // nothing to set since isAELdbTestError is false by default
            console.log('AELdb check test passed');
          } else {
            currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isAeLdbTestError = true;
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE', 'L0');
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE-ScreenValue', '');
            currentMonthlyMicrodataViewModel.AeLdbYearAgo = calculatedAeLdbValue != null ? calculatedAeLdbValue.toString() : null;
          }
        }
       return currentMonthlyMicrodataViewModel;

  }



  testJoltsAeLdb(mostRecentLdbAe: number, currentMonthlyMicrodataViewModel: CollectionsJoltsMicroData, joltsScreeningParameters: JoltsScreeningParametersDto, quiData: QuiData) {

      let hasTestPassed = false;
      const calculatedAeLdbValue = this.getLdbAeForMonthYear(+currentMonthlyMicrodataViewModel.RefMM, +currentMonthlyMicrodataViewModel.RefYY - 1, quiData);

      // test 01
      if (this.isValuePositiveOrZero(joltsScreeningParameters.TotalUnemploymentInsuranceDeviation)) {
        if (this.isValuePositive(mostRecentLdbAe)) {
            if (Math.abs((+currentMonthlyMicrodataViewModel.TotalWorkers / mostRecentLdbAe) - 1) < joltsScreeningParameters.TotalUnemploymentInsuranceDeviation) {
              hasTestPassed = true;
              return [hasTestPassed, mostRecentLdbAe];
            }
        }
      }

      // test 02

      if (this.isNumber(joltsScreeningParameters.TotalUnemploymentInsuranceDeviation)) {
        if (this.isValuePositive(calculatedAeLdbValue)) {
            if (Math.abs((+currentMonthlyMicrodataViewModel.TotalWorkers / calculatedAeLdbValue) - 1) < joltsScreeningParameters.TotalUnemploymentInsuranceDeviation) {
              hasTestPassed = true;
              return [hasTestPassed, calculatedAeLdbValue];
            }
        }
      }

      // test 03

      if (this.isNumber(joltsScreeningParameters.TotalUnemploymentInsuranceAbsolute)) {
        if (this.isValuePositive(mostRecentLdbAe)) {
            if (Math.abs(mostRecentLdbAe - +currentMonthlyMicrodataViewModel.TotalWorkers) < joltsScreeningParameters.TotalUnemploymentInsuranceAbsolute) {
              hasTestPassed = true;
              return [hasTestPassed, mostRecentLdbAe];
            }
        }
      }

      // test 04
      if (this.isNumber(joltsScreeningParameters.TotalUnemploymentInsuranceAbsolute)) {
        if (this.isValuePositive(calculatedAeLdbValue)) {
            if (Math.abs(calculatedAeLdbValue - +currentMonthlyMicrodataViewModel.TotalWorkers) < +joltsScreeningParameters.TotalUnemploymentInsuranceAbsolute) {
              hasTestPassed = true;
              return [hasTestPassed, calculatedAeLdbValue];
            }
        }
      }



       // test 05
      const aeMin = this.getMinOrMaxLdbForMonthYear(+currentMonthlyMicrodataViewModel.RefMM, +currentMonthlyMicrodataViewModel.RefYY, quiData, true, false);
      const aeMax = this.getMinOrMaxLdbForMonthYear(+currentMonthlyMicrodataViewModel.RefMM, +currentMonthlyMicrodataViewModel.RefYY, quiData, false, true);
      if (this.isValuePositiveOrZero(joltsScreeningParameters.TotalUnemploymentInsuranceHistorical) && this.isValuePositiveOrZero(aeMin) && this.isValuePositiveOrZero(aeMax)) {
           if ((Math.abs(aeMin - joltsScreeningParameters.TotalUnemploymentInsuranceHistorical) < +currentMonthlyMicrodataViewModel.TotalWorkers) &&
                +currentMonthlyMicrodataViewModel.TotalWorkers < Math.abs(aeMax + joltsScreeningParameters.TotalUnemploymentInsuranceHistorical)) {
                  hasTestPassed = true;
                  return [hasTestPassed, mostRecentLdbAe];
           }
       }

      return [false, null];
    }


  screenJoltsRatiosForErrors(joltsScreeningParameters: JoltsScreeningParametersDto, sizeCode: string) {
    if (this.needScreening(this.currentMonthlyMicrodataViewModel, this.prevMonthlyMicrodataViewModel, joltsScreeningParameters)) {
      if (this.IsPrevMonthlyMicroDataReported() && this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.TotalWorkers)) {
        // set screening errors for non ratios
        this.setScreeningErrorsForNonRatio('TE', this.currentMonthlyMicrodataViewModel.TotalWorkers, this.prevMonthlyMicrodataViewModel.TotalWorkers);
        this.setScreeningErrorsForNonRatio('JO', this.currentMonthlyMicrodataViewModel.JobOpenings, this.prevMonthlyMicrodataViewModel.JobOpenings);
        this.setScreeningErrorsForNonRatio('NH', this.currentMonthlyMicrodataViewModel.NewHires, this.prevMonthlyMicrodataViewModel.NewHires);
        this.setScreeningErrorsForNonRatio('Q', this.currentMonthlyMicrodataViewModel.Quits, this.prevMonthlyMicrodataViewModel.Quits);
        this.setScreeningErrorsForNonRatio('LD', this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges, this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges);
        this.setScreeningErrorsForNonRatio('OS', this.currentMonthlyMicrodataViewModel.OtherSeperation, this.prevMonthlyMicrodataViewModel.OtherSeperation);
        this.setScreeningErrorsForNonRatio('TS', this.currentMonthlyMicrodataViewModel.TotalSeperation, this.prevMonthlyMicrodataViewModel.TotalSeperation);
      }

      // set ratio screenign errors
      this.setScreeningErrorsForRatios(joltsScreeningParameters, sizeCode);
    }
  }

  setScreeningErrorsForNonRatio(microCellName: string, currentMicroValue: string | number, prevMicroValue: string | number) {
    // JOTLS microdata reporting status changed
    const currentMicroCheck = this.isValuePositiveOrZero(currentMicroValue) && !this.isValuePositiveOrZero(prevMicroValue);
    const prevMicroCheck = !this.isValuePositiveOrZero(currentMicroValue) && this.isValuePositiveOrZero(prevMicroValue);


    if (currentMicroCheck || prevMicroCheck) {
      switch (microCellName) {
        case 'TE': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalWorkersScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE', 'S1');
          // we just need to copmly with the screening error text format - though we don't deal with screening values here.
          // so wejust need to add an empty text for that.
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE-ScreenValue', '');

          break;
        }
        case 'JO': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isJobOpeningScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO', 'S2');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO-ScreenValue', '');
          break;
        }
        case 'NH': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isHiresScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH', 'S3');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH-ScreenValue', '');
          break;
        }
        case 'Q': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isQuitsScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q', 'S4');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q-ScreenValue', '');
          break;
        }
        case 'LD': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isLayoffAndDiscahrgesScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD', 'S5');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD-ScreenValue', '');
          break;
        }
        case 'OS': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isOtherSeperationScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS', 'S6');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS-ScreenValue', '');
          break;
        }
        case 'TS': {
          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalSeperationScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS', 'S7');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS-ScreenValue', '');
          break;
        }
      }
    }
  }

  setScreeningErrorsForRatios(joltsScreeningParameters: JoltsScreeningParametersDto, sizeCode: string) {
    if (sizeCode !== '1') {
      // TE CHG OTM exceeds tolerance
      if (this.isValuePositiveOrZero(joltsScreeningParameters.TotalEmployeesOTM) &&
         this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.TotalWorkers) &&
         this.isReportedAndValid(joltsScreeningParameters.TotalEmployeesChange) &&
         this.isValuePositive(this.prevMonthlyMicrodataViewModel.TotalWorkers)) {
           const delta = +this.currentMonthlyMicrodataViewModel.TotalWorkers - +this.prevMonthlyMicrodataViewModel.TotalWorkers;
           if (((Math.abs(delta) / +this.prevMonthlyMicrodataViewModel.TotalWorkers)  * 100) > joltsScreeningParameters.TotalEmployeesChange) {

            this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isTotalWorkersRatioScreeningError = true;
            this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TEChg', 'S8');
            this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TEChg-ScreenValue', `( > ${joltsScreeningParameters.TotalEmployeesChange})`);

            this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalWorkersScreeningError = true;
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE', 'S8');
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TE-ScreenValue', `( > ${joltsScreeningParameters.TotalEmployeesChange})`);
           }
         }

      // JOR percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.JobOpenings) &&
         this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.JobOpeningsRate) &&
         this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.JobOpenings) &&
         this.isReportedAndValid(joltsScreeningParameters.JobOpeningRateOTM) &&
         this.isReportedAndValid(joltsScreeningParameters.JobOpeningChange) &&
         this.isValuePositive(this.prevMonthlyMicrodataViewModel.JobOpeningsRate)) {
           const deltaJO = Math.abs(+this.currentMonthlyMicrodataViewModel.JobOpenings - +this.prevMonthlyMicrodataViewModel.JobOpenings);
           if (deltaJO > joltsScreeningParameters.JobOpeningChange) {
             const deltaJOR = Math.abs(+this.currentMonthlyMicrodataViewModel.JobOpeningsRate - +this.prevMonthlyMicrodataViewModel.JobOpeningsRate);
             if (((deltaJOR / +this.prevMonthlyMicrodataViewModel.JobOpeningsRate) * 100) > joltsScreeningParameters.JobOpeningRateOTM) {
              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isJobOpeningRatioScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR', 'S10');
              this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR-ScreenValue', `( > ${joltsScreeningParameters.JobOpeningRateOTM})`);

              // uncomment this if they ask for edit cells also highlighted in blue

              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isJobOpeningScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO', 'S10');
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO-ScreenValue', `( > ${joltsScreeningParameters.JobOpeningRateOTM})`);

             }
           }
         }

      // JO percentage OTM exceeds tolerance
      if (this.isValuePositive(this.prevMonthlyMicrodataViewModel.JobOpenings) &&
          this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.JobOpenings) &&
          this.isReportedAndValid(joltsScreeningParameters.JobOpeningOtm) &&
          this.isReportedAndValid(joltsScreeningParameters.JobOpeningChange)) {

           const deltaJO = Math.abs(+this.currentMonthlyMicrodataViewModel.JobOpenings - +this.prevMonthlyMicrodataViewModel.JobOpenings);

           if (deltaJO > joltsScreeningParameters.JobOpeningChange) {
             if (((deltaJO / +this.prevMonthlyMicrodataViewModel.JobOpenings) * 100) > joltsScreeningParameters.JobOpeningOtm) {
              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isJobOpeningRatioScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR', 'S11');
              this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR-ScreenValue', `( > ${joltsScreeningParameters.JobOpeningOtm})`);

              // uncomment this if they ask for edit cells also highlighted in blue

              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isJobOpeningScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO', 'S11');
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO-ScreenValue', `( > ${joltsScreeningParameters.JobOpeningOtm})`);
             }
           }
         }

       // JOR exceeds tolerance
      if (this.currentMonthlyMicrodataViewModel.JobOpenings > this.minValueForJobOpenings &&
          this.isReportedAndValid(joltsScreeningParameters.JobOpeningRateMin) &&
          this.isReportedAndValid(joltsScreeningParameters.JobOpeningRateMax)) {
            if (+this.currentMonthlyMicrodataViewModel.JobOpeningsRate < joltsScreeningParameters.JobOpeningRateMin ||
              +this.currentMonthlyMicrodataViewModel.JobOpeningsRate > joltsScreeningParameters.JobOpeningRateMax) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isJobOpeningRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR', 'S12');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('JOR-ScreenValue', `( < ${joltsScreeningParameters.JobOpeningRateMin} or above  ${joltsScreeningParameters.JobOpeningRateMax})`);

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isJobOpeningScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO', 'S12');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO-ScreenValue', `( < ${joltsScreeningParameters.JobOpeningRateMin} or above  ${joltsScreeningParameters.JobOpeningRateMax})`);
              }
        }



        // JO and H are equal and reported as non-zero
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.JobOpenings) &&
          this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.NewHires) &&
          this.isReportedAndValid(this.minValueForJobOpenings) &&
          (this.currentMonthlyMicrodataViewModel.CodeComment1 != null && this.currentMonthlyMicrodataViewModel.CodeComment1.code !== '83')) {
            if (this.currentMonthlyMicrodataViewModel.JobOpenings > this.minValueForJobOpenings &&
              this.currentMonthlyMicrodataViewModel.JobOpenings === this.currentMonthlyMicrodataViewModel.NewHires) {
                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isJobOpeningScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO', 'S13');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('JO-ScreenValue', ``); // empty screen values

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isHiresScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH', 'S13');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH-ScreenValue', ``); // no screen values
              }
        }

        // NH Rate percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.NewHiresRate) &&
          this.isValuePositive(this.prevMonthlyMicrodataViewModel.NewHiresRate) &&
          this.isReportedAndValid(this.currentMonthlyMicrodataViewModel.NewHires) &&
          this.isReportedAndValid(this.prevMonthlyMicrodataViewModel.NewHires) &&
          this.isReportedAndValid(joltsScreeningParameters.NewHiresRateOTM)) {
            const deltaNewHires = Math.abs(+this.currentMonthlyMicrodataViewModel.NewHires - +this.prevMonthlyMicrodataViewModel.NewHires);
            if (deltaNewHires > joltsScreeningParameters.NewHiresChange) {
              const deltaNewHiresRate = Math.abs(+this.currentMonthlyMicrodataViewModel.NewHiresRate - +this.prevMonthlyMicrodataViewModel.NewHiresRate);
              if (((deltaNewHiresRate / +this.prevMonthlyMicrodataViewModel.NewHiresRate) * 100) > joltsScreeningParameters.NewHiresRateOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isHiresRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('HR', 'S14');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('HR-ScreenValue', `( > ${joltsScreeningParameters.NewHiresRateOTM})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isHiresScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH', 'S14');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH-ScreenValue', `( > ${joltsScreeningParameters.NewHiresRateOTM})`);
              }
            }
          }


        // H percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.NewHires) &&
            this.isValuePositive(this.prevMonthlyMicrodataViewModel.NewHires) &&
            this.isReportedAndValid(joltsScreeningParameters.NewHiresOTM) &&
            this.isReportedAndValid(joltsScreeningParameters.NewHiresChange)) {
              const delta = Math.abs(+this.currentMonthlyMicrodataViewModel.NewHires - +this.prevMonthlyMicrodataViewModel.NewHires);
              if (delta > joltsScreeningParameters.NewHiresChange) {
                if (((delta / +this.prevMonthlyMicrodataViewModel.NewHires) * 100) > joltsScreeningParameters.NewHiresOTM) {
                  this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isHiresScreeningError = true;
                  this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH', 'S15');
                  this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH-ScreenValue', `( > ${joltsScreeningParameters.NewHiresOTM})`);

                }
              }
            }


      // QR percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.QuitsRate) &&
            this.isValuePositive(this.prevMonthlyMicrodataViewModel.QuitsRate) &&
            this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.Quits) &&
            this.isReportedAndValid(this.currentMonthlyMicrodataViewModel.Quits) &&
            this.isReportedAndValid(joltsScreeningParameters.QuitsRateOTM) &&
            this.isReportedAndValid(joltsScreeningParameters.QuitsChange)) {
              const deltaQuits = Math.abs(+this.currentMonthlyMicrodataViewModel.Quits - +this.prevMonthlyMicrodataViewModel.Quits);
              const deltaQuitsRate = Math.abs(+this.currentMonthlyMicrodataViewModel.QuitsRate - +this.prevMonthlyMicrodataViewModel.QuitsRate);
              if (deltaQuits > joltsScreeningParameters.QuitsChange) {
                if (((deltaQuitsRate / +this.prevMonthlyMicrodataViewModel.QuitsRate) * 100) > joltsScreeningParameters.QuitsRateOTM) {
                  this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isQuitsRatioScreeningError = true;
                  this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('QR', 'S17');
                  this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('QR-ScreenValue', `( > ${joltsScreeningParameters.QuitsRateOTM})`);


                  this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isQuitsScreeningError = true;
                  this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q', 'S17');
                  this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q-ScreenValue', `( > ${joltsScreeningParameters.QuitsRateOTM})`);

                }
              }
            }



      // LDR percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.LayoffsAndDischargesRate) &&
          this.isValuePositive(this.prevMonthlyMicrodataViewModel.LayoffsAndDischargesRate) &&
          this.isReportedAndValid(this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isReportedAndValid(joltsScreeningParameters.LayoffAndDischargeRateOTM)) {
            const deltaLD = Math.abs(+this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges - +this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges);
            if (deltaLD > joltsScreeningParameters.LayoffAndDischargeChange) {
              const deltaLDR = Math.abs(+this.currentMonthlyMicrodataViewModel.LayoffsAndDischargesRate - +this.prevMonthlyMicrodataViewModel.LayoffsAndDischargesRate);
              if (((deltaLDR / +this.prevMonthlyMicrodataViewModel.LayoffsAndDischargesRate) * 100) > joltsScreeningParameters.LayoffAndDischargeRateOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isLayoffAndDiscahrgesRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('LDR', 'S20');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('LDR-ScreenValue', `( > ${joltsScreeningParameters.LayoffAndDischargeRateOTM})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isLayoffAndDiscahrgesScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD', 'S20');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD-ScreenValue', `( > ${joltsScreeningParameters.LayoffAndDischargeRateOTM})`);

              }
            }
      }

      // LD percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isValuePositive(this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isReportedAndValid(joltsScreeningParameters.LayoffAndDischargeOTM) &&
          this.isReportedAndValid(joltsScreeningParameters.LayoffAndDischargeChange)) {

            const deltaQ = Math.abs(+this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges - +this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges);
            if (deltaQ > joltsScreeningParameters.LayoffAndDischargeChange) {
              if (((deltaQ / +this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges) * 100) > joltsScreeningParameters.LayoffAndDischargeOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isLayoffAndDiscahrgesScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD', 'S21');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD-ScreenValue', `( > ${joltsScreeningParameters.LayoffAndDischargeOTM})`);

              }
            }
      }

      // OSR percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.OtherSeperationRate) &&
          this.isValuePositive(this.prevMonthlyMicrodataViewModel.OtherSeperationRate) &&
          this.isReportedAndValid(this.currentMonthlyMicrodataViewModel.OtherSeperation) &&
          this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.OtherSeperation) &&
          this.isReportedAndValid(joltsScreeningParameters.OtherSeperationRateOTM)) {
            const deltaLD = Math.abs(+this.currentMonthlyMicrodataViewModel.OtherSeperation - +this.prevMonthlyMicrodataViewModel.OtherSeperation);
            if (deltaLD > joltsScreeningParameters.OtherSeperationChange) {
              const deltaLDR = Math.abs(+this.currentMonthlyMicrodataViewModel.OtherSeperationRate - +this.prevMonthlyMicrodataViewModel.OtherSeperationRate);
              if (((deltaLDR / +this.prevMonthlyMicrodataViewModel.OtherSeperationRate) * 100) > joltsScreeningParameters.OtherSeperationRateOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isOtherSeperationRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('OSR', 'S23');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('OSR-ScreenValue', `( > ${joltsScreeningParameters.OtherSeperationRateOTM})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isOtherSeperationScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS', 'S23');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS-ScreenValue', `( > ${joltsScreeningParameters.OtherSeperationRateOTM})`);

              }
            }
      }

      // OS percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.OtherSeperation) &&
          this.isValuePositive(this.currentMonthlyMicrodataViewModel.OtherSeperation) &&
          this.isReportedAndValid(joltsScreeningParameters.OtherSeperationOTM) &&
          this.isReportedAndValid(joltsScreeningParameters.OtherSeperationChange)) {

            const deltaQ = Math.abs(+this.currentMonthlyMicrodataViewModel.OtherSeperation - +this.prevMonthlyMicrodataViewModel.OtherSeperation);
            if (deltaQ > joltsScreeningParameters.OtherSeperationChange) {
              if (((deltaQ / +this.prevMonthlyMicrodataViewModel.OtherSeperation) * 100) > joltsScreeningParameters.OtherSeperationOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isOtherSeperationScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS', 'S24');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS-ScreenValue', `( > ${joltsScreeningParameters.OtherSeperationOTM})`);

              }
            }
      }

      // TSR percentage OTM exceeds tolerance
      if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.TotalSeperationRate) &&
          this.isValuePositive(this.prevMonthlyMicrodataViewModel.TotalSeperationRate) &&
          this.isReportedAndValid(this.currentMonthlyMicrodataViewModel.TotalSeperation) &&
          this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.TotalSeperation) &&
          this.isReportedAndValid(joltsScreeningParameters.TotalSeperationRateOTM)) {
            const deltaTS = Math.abs(+this.currentMonthlyMicrodataViewModel.TotalSeperation - +this.prevMonthlyMicrodataViewModel.TotalSeperation);
            if (deltaTS > joltsScreeningParameters.TotalSeperationChange) {
              const deltaTSR = Math.abs(+this.currentMonthlyMicrodataViewModel.TotalSeperationRate - +this.prevMonthlyMicrodataViewModel.TotalSeperationRate);
              if (((deltaTSR / +this.prevMonthlyMicrodataViewModel.TotalSeperationRate) * 100) > joltsScreeningParameters.TotalSeperationRateOTM) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isTotalSeperationRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TSR', 'S26');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TSR-ScreenValue', `( > ${joltsScreeningParameters.TotalSeperationRateOTM})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalSeperationScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS', 'S26');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS-ScreenValue', `( > ${joltsScreeningParameters.TotalSeperationRateOTM})`);


              }
            }
      }
    }

     // Q percentage OTM exceeds tolerance
    if (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.Quits) &&
        this.isValuePositive(this.currentMonthlyMicrodataViewModel.Quits) &&
        this.isReportedAndValid(joltsScreeningParameters.QuitsOTM) &&
        this.isReportedAndValid(joltsScreeningParameters.QuitsChange)) {

          const deltaQ = Math.abs(+this.currentMonthlyMicrodataViewModel.Quits - +this.prevMonthlyMicrodataViewModel.Quits);
          if (deltaQ > joltsScreeningParameters.QuitsChange) {
            if (((deltaQ / +this.prevMonthlyMicrodataViewModel.Quits) * 100) > joltsScreeningParameters.QuitsOTM) {

              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isQuitsScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q', 'S18');
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q-ScreenValue', `( > ${joltsScreeningParameters.QuitsOTM})`);


            }
          }
     }

    // QR exceeds tolerance
    if (this.currentMonthlyMicrodataViewModel.Quits > this.minValueForQuits &&
            this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.QuitsRate) &&
            this.isReportedAndValid(joltsScreeningParameters.QuitsRateMin) &&
            this.isReportedAndValid(joltsScreeningParameters.QuitsRateMax)) {
            if (+this.currentMonthlyMicrodataViewModel.QuitsRate < joltsScreeningParameters.QuitsRateMin ||
              +this.currentMonthlyMicrodataViewModel.QuitsRate > joltsScreeningParameters.QuitsRateMax) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isQuitsRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('QR', 'S19');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('QR-ScreenValue', `( < ${joltsScreeningParameters.QuitsRateMin} or above  ${joltsScreeningParameters.QuitsRateMax})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isQuitsScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q', 'S19');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('Q-ScreenValue', `( < ${joltsScreeningParameters.QuitsRateMin}  or above  ${joltsScreeningParameters.QuitsRateMax})`);

              }
    }

    // HR exceeds tolerance
    if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.NewHiresRate) &&
            this.isReportedAndValid(joltsScreeningParameters.NewHiresRateMin) &&
            this.isReportedAndValid(joltsScreeningParameters.NewHiresRateMax) &&
            (this.currentMonthlyMicrodataViewModel.NewHires > this.minValueForHires)) {
              if (+this.currentMonthlyMicrodataViewModel.NewHiresRate < joltsScreeningParameters.NewHiresRateMin ||
                  +this.currentMonthlyMicrodataViewModel.NewHiresRate > joltsScreeningParameters.NewHiresRateMax) {

                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isHiresRatioScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('HR', 'S16');
                this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('HR-ScreenValue', `( < ${joltsScreeningParameters.NewHiresRateMin} or above  ${joltsScreeningParameters.NewHiresRateMax})`);


                this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isHiresScreeningError = true;
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH', 'S16');
                this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('NH-ScreenValue', `( < ${joltsScreeningParameters.NewHiresRateMin}  or above  ${joltsScreeningParameters.NewHiresRateMax})`);

              }
    }



     // LDR exceeds tolerance
    if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.LayoffsAndDischargesRate) &&
        this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.LayoffsAndDischargesRate) &&
        this.isReportedAndValid(joltsScreeningParameters.LayoffAndDischargeRateMin) &&
        this.isReportedAndValid(joltsScreeningParameters.LayoffAndDischargeRateMax) &&
        (this.currentMonthlyMicrodataViewModel.LayoffsAndDischarges > this.minValueForLayoffsAndDischarge)) {
       if (+this.currentMonthlyMicrodataViewModel.LayoffsAndDischargesRate < joltsScreeningParameters.LayoffAndDischargeRateMin  ||
           +this.currentMonthlyMicrodataViewModel.LayoffsAndDischargesRate > joltsScreeningParameters.LayoffAndDischargeRateMax) {

         this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isLayoffAndDiscahrgesRatioScreeningError = true;
         this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('LDR', 'S22');
         this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('LDR-ScreenValue', `( < ${joltsScreeningParameters.LayoffAndDischargeRateMin} or above  ${joltsScreeningParameters.LayoffAndDischargeRateMax})`);


         this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isLayoffAndDiscahrgesScreeningError = true;
         this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD', 'S22');
         this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('LD-ScreenValue', `( < ${joltsScreeningParameters.LayoffAndDischargeRateMin} or above  ${joltsScreeningParameters.LayoffAndDischargeRateMax})`);

       }
    }

     // OSR exceeds tolerance
    if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.OtherSeperationRate) &&
        this.isReportedAndValid(joltsScreeningParameters.OtherSeperationRateMin) &&
        this.isReportedAndValid(joltsScreeningParameters.OtherSeperationRateMax) &&
        (this.currentMonthlyMicrodataViewModel.OtherSeperation > this.minValueForOtherSeperation)) {
        if (+this.currentMonthlyMicrodataViewModel.OtherSeperationRate < joltsScreeningParameters.OtherSeperationRateMin  ||
            +this.currentMonthlyMicrodataViewModel.OtherSeperationRate > joltsScreeningParameters.OtherSeperationRateMax) {

          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isOtherSeperationRatioScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('OSR', 'S25');
          this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('OSR-ScreenValue', `( < ${joltsScreeningParameters.OtherSeperationRateMin} or above  ${joltsScreeningParameters.OtherSeperationRateMax})`);


          this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isOtherSeperationScreeningError = true;
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS', 'S25');
          this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('OS-ScreenValue', `( < ${joltsScreeningParameters.OtherSeperationRateMin} or above  ${joltsScreeningParameters.OtherSeperationRateMax})`);

        }
    }

    // TS percentage OTM exceeds tolerance
    if (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.TotalSeperation) &&
        this.isValuePositive(this.currentMonthlyMicrodataViewModel.TotalSeperation) &&
        this.isReportedAndValid(joltsScreeningParameters.TotalSeperationOTM) &&
        this.isReportedAndValid(joltsScreeningParameters.TotalSeperationChange)) {

          const deltaQ = Math.abs(+this.currentMonthlyMicrodataViewModel.TotalSeperation - +this.prevMonthlyMicrodataViewModel.TotalSeperation);
          if (deltaQ > joltsScreeningParameters.TotalSeperationChange) {
            if (((deltaQ / +this.prevMonthlyMicrodataViewModel.TotalSeperation) * 100) > joltsScreeningParameters.TotalSeperationOTM) {

              this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalSeperationScreeningError = true;
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS', 'S27');
              this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS-ScreenValue', `( > ${joltsScreeningParameters.TotalSeperationOTM})`);

            }
          }
    }

    // TSR exceeds tolerance
    if (this.isValuePositiveOrZero(this.currentMonthlyMicrodataViewModel.TotalSeperationRate) &&
        this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.TotalSeperationRate) &&
        this.isReportedAndValid(joltsScreeningParameters.TotalSeperationRateMin) &&
        this.isReportedAndValid(joltsScreeningParameters.TotalSeperationRateMax) &&
        (this.currentMonthlyMicrodataViewModel.TotalSeperation > this.minValueForTotalSeperataion)) {
          if (+this.currentMonthlyMicrodataViewModel.TotalSeperationRate < joltsScreeningParameters.TotalSeperationRateMin  ||
              +this.currentMonthlyMicrodataViewModel.TotalSeperationRate > joltsScreeningParameters.TotalSeperationRateMax) {

            this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.isTotalSeperationRatioScreeningError = true;
            this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TSR', 'S28');
            this.currentMonthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts.set('TSR-ScreenValue', `( < ${joltsScreeningParameters.TotalSeperationRateMin} or above  ${joltsScreeningParameters.TotalSeperationRateMax})`);


            this.currentMonthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isTotalSeperationScreeningError = true;
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS', 'S28');
            this.currentMonthlyMicrodataViewModel.JoltsEditScreeningErrorScripts.set('TS-ScreenValue', `( < ${joltsScreeningParameters.TotalSeperationRateMin} or above  ${joltsScreeningParameters.TotalSeperationRateMax})`);

          }
    }
  }



  IsCurrentMonthlyMicroDataReported(currentMonthlyMicrodataViewModel: CollectionsJoltsMicroData) {
    if ((this.isReportedAndValid(currentMonthlyMicrodataViewModel.TotalWorkers)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.JobOpenings)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.Quits)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.NewHires)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.LayoffsAndDischarges)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.OtherSeperation)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.TotalSeperation)) ||
        (this.isReportedAndValid(currentMonthlyMicrodataViewModel.JobOpenings))) {
          return true;
        } else {
          return false;
        }
  }


  IsPrevMonthlyMicroDataReported() {
    if ((this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.TotalWorkers)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.JobOpenings)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.Quits)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.NewHires)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.LayoffsAndDischarges)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.OtherSeperation)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.TotalSeperation)) ||
        (this.isValuePositiveOrZero(this.prevMonthlyMicrodataViewModel.JobOpenings))) {
          return true;
        } else {
          return false;
        }
  }


  needScreening(currentMicro: CollectionsJoltsMicroData, prevMicro: CollectionsJoltsMicroData, screenParams) {
    let needScreening = true;
    if (screenParams == null || prevMicro == null) {
      needScreening = false;
      return needScreening;
    }
    if (currentMicro.CodeComment1 != null && currentMicro.CodeComment1.code != null) {
      if (currentMicro.CodeComment1.code !== '83') {
        needScreening = false;
      }
    }
    return needScreening;
  }


  // getEnvironemntValue(envName: string): string {
  //   const environmentVariableObj = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === envName);

  //   //  check for both null and undefined
  //   if (environmentVariableObj == null) {
  //     return environmentVariableObj.envValue;
  //   }
  // }

  getMinOrMaxLdbForMonthYear(refMM: number, refYY: number, quiData: QuiData, findMin: boolean, findMax: boolean): number {
    let aeLdbMinOrMax = null;
    for (let i = 1; i < 7; i++) {
      refMM = refMM - 1;
      if (refMM <= 0) {
          refMM = refMM + 12;
          refYY = refYY - 1;
      }
      const aeLdb = this.getLdbAeForMonthYear(refMM, refYY, quiData);

      if (aeLdbMinOrMax == null) {
          aeLdbMinOrMax = aeLdb;
      } else if (aeLdb != null) {
        if (findMin) {
          if (aeLdb < aeLdbMinOrMax) {
            aeLdbMinOrMax = aeLdb;
            }
        }
        if (findMax) {
          if (aeLdb > aeLdbMinOrMax) {
            aeLdbMinOrMax = aeLdb;
          }
        }
      }
    }
    return aeLdbMinOrMax;
  }








  getLdbAeForMonthYear(refMM: number, refYY: number, quiData: QuiData) {
    let aeLdbValue = null;
    if (quiData != null) {
      // calculate lldb position
      const currMonthLdbPosition = (refMM + (refYY * 12)) - (+quiData.RefQtr * 3) + (+quiData.RefQYear * 12);
      if (currMonthLdbPosition > 0 || currMonthLdbPosition < -11) {
        return null;
      } else {
        switch (refMM) {
          // return month's rsepective quidata
          case 1:
            aeLdbValue = quiData.AllEmp1;
            break;
          case 2:
            aeLdbValue = quiData.AllEmp2;
            break;

          case 3:
            aeLdbValue = quiData.AllEmp3;
            break;

          case 4:
            aeLdbValue = quiData.AllEmp4;
            break;

          case 5:
            aeLdbValue = quiData.AllEmp5;
            break;

          case 6:
            aeLdbValue = quiData.AllEmp6;
            break;

          case 7:
            aeLdbValue = quiData.AllEmp7;
            break;

          case 8:
            aeLdbValue = quiData.AllEmp8;
            break;

          case 9:
            aeLdbValue = quiData.AllEmp9;
            break;

          case 10:
            aeLdbValue = quiData.AllEmp10;
            break;

          case 11:
            aeLdbValue = quiData.AllEmp11;
            break;

          case 12:
            aeLdbValue = quiData.AllEmp12;
            break;

        }
      }

    }
    return aeLdbValue;
  }


  canDoLdbChecks(totalWorkers: string | number, startDate: string, unitAeLdbRC: string, mostRecentLdb: number | null,
                 quiData: QuiData, joltsScreeningParameters: JoltsScreeningParametersDto): boolean {
      // check
      if (startDate == null && !this.isNumber(unitAeLdbRC) && quiData != null && this.isNumber(quiData.RefQYear) && joltsScreeningParameters != null &&
          this.isNumber(quiData.RefQtr) && mostRecentLdb !== null && totalWorkers != null) {
          return true;
        } else {
          return false;
        }
  }


  // this will return the most recent months' value if it is >= 0
  getMostRecentLdbAe(quiData: QuiData): number | null {
    const quiDataValues: number[] = [];

    // start inserting AE values from most recent to old
    quiDataValues.push(quiData.AllEmp12);
    quiDataValues.push(quiData.AllEmp11);
    quiDataValues.push(quiData.AllEmp10);
    quiDataValues.push(quiData.AllEmp9);
    quiDataValues.push(quiData.AllEmp8);
    quiDataValues.push(quiData.AllEmp7);
    quiDataValues.push(quiData.AllEmp6);
    quiDataValues.push(quiData.AllEmp5);
    quiDataValues.push(quiData.AllEmp4);
    quiDataValues.push(quiData.AllEmp3);
    quiDataValues.push(quiData.AllEmp2);
    quiDataValues.push(quiData.AllEmp1);

    // get the first AE that is not null
    return quiDataValues.find(a => a != null);
  }

  isNumber(value: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
  }


  isValuePositiveOrZero(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue >= 0;
    } else {
      return false;
    }
  }

  isValuePositive(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue > 0;
    } else {
      return false;
    }
  }

  isValuePositiveNumber(microRatioValue: string | number): boolean  {
    if (this.isNumber(microRatioValue)) {
      return +microRatioValue > 0;
    } else {
      return false;
    }
  }


  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '';
  }
}
