import { Injectable } from '@angular/core';
import { LookupService } from 'src/app/core/services/lookup.service';
import { Unit } from 'src/app/shared/models/unit.model';
import * as moment from 'moment';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { CollectionsService } from './collections.service';
import * as _ from 'lodash';
import { CollectionsCesMicroDataDto, CollectionsCesMicroData, CollectionsJoltsMicroDataDto, CollectionsJoltsMicroData } from 'src/app/shared/models/collections-microdata.model';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { CesMultiPay } from 'src/app/shared/models/ces-multipay.model';
import { CollectionsUnit } from '../collection/models/collection-unit.model';
import { JoltsCollectionsService } from './jolts-collections.service';
import { UnitService } from './unit.service';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CollectionsSaveService {

  collectionsService: CollectionsService | JoltsCollectionsService;
  surveyId: string;
  currentLoggedInUser: string;
  collectionUnitListVm: CollectionsUnit[] = [];
  caseStartDate: string; // format - 092020 (mmyyyyy)

  constructor( private lookupService: LookupService,
               private unitService: UnitService,
               private tcwHttpService: TcwHttpService,
               private store: Store<fromApp.AppState>,
               private cesCollectionsService: CollectionsService,
               private joltsCollectionsService: JoltsCollectionsService) {


                // this.store.select(fromAuth.getUserEnvironment).pipe(take(1)).subscribe(userEnv => {
                //   this.surveyId = userEnv.environmentDetails.survey;
                // });

                this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.currentLoggedInUser = authState.userEnvironment.currentUser.userId;
                });

                this.lookupService.IsCES$.subscribe(isCes => {
                  if (isCes) {
                    this.collectionsService = this.cesCollectionsService as CollectionsService;
                  } else {
                    this.collectionsService = this.joltsCollectionsService as JoltsCollectionsService;
                  }
                });

                this.collectionUnitListVm = this.collectionsService.collectionUnitListVm;
                if (this.collectionsService.currentSeletectedCase != null) {
                  this.caseStartDate = this.collectionsService.currentSeletectedCase.START_DATE;
                }

    }


    isDifferent = (originalValue, newValue) => {
      const originalValueStr: string = originalValue + '';
      const newValueStr: string = newValue + '';
      console.log('comparing 2 numbers as strings ' + originalValueStr + 'and ' + newValueStr);
      if(originalValueStr === newValueStr) {
        console.log('they are same');
        return false;
      } else {
        return true;
      }
    }

    CollectJoltsMicroData(unit: Unit) {
      // this service is heavily dependent on collections service
      if (this.collectionsService == null) {
        throw new Error('Cannot save Microdata. Collection Service could not be found.');
      }

      this.collectionUnitListVm = this.collectionsService.collectionUnitListVm;

      let collectionMonthRc: string = null;
      let joltsMicroDataDtoList: Array<CollectionsJoltsMicroDataDto> = null;
      let latestGoodDate: Date = null;
      let leastPrLopp: string = null;

      try
      {
        if (unit != null) {
          // for the unit passed - create an array of microdata DTO first
          joltsMicroDataDtoList = new Array<CollectionsJoltsMicroDataDto>();
          const matchingCollectionUnit = this.collectionUnitListVm.find(a => a.UnitId === unit.unitIdCES);
          if (matchingCollectionUnit != null) {
            // extract the microdata with user changes from collections and map to DTO and push it to the main unitlist in
            // of Address Enrollment so we don't loose any unit data changes from AE.
            if (matchingCollectionUnit.JoltsMicroData != null && matchingCollectionUnit.JoltsMicroData.length > 0) {
              // get the RC for the collection month microdata - this becomes the unit's RC (if no RC then 00)
              const collectionMonthMicroRow =  matchingCollectionUnit.JoltsMicroData.find(a => a.RefMM === this.joltsCollectionsService.collectionMonth && a.RefYY === this.joltsCollectionsService.collectionYear);
              collectionMonthRc = collectionMonthMicroRow.ResponseCode.code;

              // for each microrow map to dto
              matchingCollectionUnit.JoltsMicroData.forEach(eachMicroRow => {
                // determine start date for case (also set good date for each micro)
                if ((eachMicroRow.ResponseCode.code === '90' || eachMicroRow.ResponseCode.code === '91') && eachMicroRow.ValidatedDateTime == null) {
                  const now = new Date();
                  eachMicroRow.ValidatedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                  // also set teh start date for the case - will be the MMYYYY of the first microrow whose successful data collection
                  if (!this.joltsCollectionsService.isReportedAndValid(this.caseStartDate)) {
                    this.caseStartDate = `${eachMicroRow.RefMM}${eachMicroRow.RefYY}`;
                  }
                }

                // map all user entered collection data (inlcuding good date)
                const joltsMicroDataDto = this.mapJoltsMicroDataVmToDTO(eachMicroRow);

                // add to teh DTO list
                joltsMicroDataDtoList.push(joltsMicroDataDto);
              });

              // set the current units response code
              const firstRowResponseCode = joltsMicroDataDtoList[0] ? joltsMicroDataDtoList[0].ResponseCode : '';
              this.setUnitResponseCode(unit, firstRowResponseCode);
          }
        }
        }
      } catch(e) {
        console.log('No micro data to save or error saving micro data.');
      }
      return { joltsMicroData: joltsMicroDataDtoList, collectionUnitRc: collectionMonthRc, caseStartDate: this.caseStartDate, lastGoodDate: latestGoodDate, lastPrLopp: leastPrLopp };
    }




    // called from case-detail service when sending mcirodata list with units to server for save
    CollectCesMicroData(unit: Unit) {
      // this service is heavily dependent on collections service
      if (this.collectionsService == null) {
        throw new Error('Cannot save Microdata. Collection Service could not be found.');
      }

      this.collectionUnitListVm = this.collectionsService.collectionUnitListVm;

      let collectionMonthRc: string = null;
      let cesMicroDataDtoList: Array<CollectionsCesMicroDataDto> = null;
      let latestGoodDate: Date = null;
      let leastPrLopp: string = null;
      let isCurrentSelectedUnit: boolean = false;

      try {
        if (unit != null) {
          // for the unit passed - create an array of microdata DTO first
          cesMicroDataDtoList = new Array<CollectionsCesMicroDataDto>();

          const matchingCollectionUnit = this.collectionUnitListVm.find(a => a.UnitId === unit.unitIdCES);
          if (matchingCollectionUnit != null) {
            // extract the microdata with user changes from collections and map to DTO and push it to the main unitlist in
            // of Address Enrollment so we don't loose any unit data changes from AE.
            if (matchingCollectionUnit.CesMicroData != null && matchingCollectionUnit.CesMicroData.length > 0) {
               // get the RC for the collection month microdata - this becomes the unit's RC (if no RC then 00)
              const collectionMonthMicroRow =  matchingCollectionUnit.CesMicroData.find(a => a.RefMM === this.cesCollectionsService.collectionMonth && a.RefYY === this.cesCollectionsService.collectionYear);
              collectionMonthRc = collectionMonthMicroRow.ResponseCode.code;

              // for each microrow map to dto
              matchingCollectionUnit.CesMicroData.forEach(eachMicroRow => {
                  // determine start date for case (also set good date for each micro)
                  if (eachMicroRow.ResponseCode.code === '90' && eachMicroRow.GoodDate == null) {
                    // also set teh start date for the case - will be the MMYYYY of the first microrow whose successful data collection
                    if (!this.cesCollectionsService.isReportedAndValid(this.caseStartDate)) {
                      this.caseStartDate = `${eachMicroRow.RefMM}${eachMicroRow.RefYY}`;
                    }
                  }
                  // map all user entered collection data (inlcuding good date)
                  const cesMicroDataDto = this.mapCesMicroDataVmToDTO(eachMicroRow);

                  // add mapped mutlipay rows - TODO:// fix this for all microrows
                  if (this.cesCollectionsService.isMultiPayRow(eachMicroRow.RefMM, eachMicroRow.RefYY)) {
                    // check and add the mutlipay row user data ONLY into the microdatarow that is for current collection month
                    cesMicroDataDto.CesMultiPay = this.mapMultiPayToDto();
                  }

                  // check if the users changed the cell values - and set the flag
                  this.hasDataEntryValuesChanged(cesMicroDataDto, unit);



                  cesMicroDataDtoList.push(cesMicroDataDto);
              });

               // determine the lastestGood Date
              latestGoodDate = this.getLatestGoodDate(cesMicroDataDtoList);
              // detmine teh least prLopp
              leastPrLopp = this.getLeastPrLopp(cesMicroDataDtoList);

              // set Pr1Lopp and Pr2Lopp
              if (collectionMonthMicroRow != null) {
                unit.PRLopp = collectionMonthMicroRow.PayFrequency.code;
                unit.PR1Lopp = collectionMonthMicroRow.Pr1Lopp;
                unit.PR2Lopp = collectionMonthMicroRow.Pr2Lopp;
              }

              if (this.collectionsService.currentSelectedUnit != null && this.collectionsService.currentSelectedUnit.UnitId === unit.unitPK) {
                isCurrentSelectedUnit = true;
              }

              // set aeldbRC
              unit.AeLdbRc = matchingCollectionUnit.AeLdbRC;

              // set mpay stat for multipay
              unit.MPayStat = matchingCollectionUnit.MPayStat;

              // set the current units response code
              const firstRowResponseCode = cesMicroDataDtoList[0] ? cesMicroDataDtoList[0].ResponseCode : '';
              this.setUnitResponseCode(unit, firstRowResponseCode);
            }
          }
        }
      } catch(e) {
        console.log('No micro data to save or error saving micro data.');
      }

      return { cesMicroData: cesMicroDataDtoList, collectionUnitRc: collectionMonthRc, caseStartDate: this.caseStartDate, lastGoodDate: latestGoodDate, lastPrLopp: leastPrLopp, isCurrentSelectedUnit: isCurrentSelectedUnit };
    }


    getLeastPrLopp(cesMicroDataDtoList: CollectionsCesMicroDataDto[]): string {
      let leastPrLopp: string = null;
      const validCesMicroData = cesMicroDataDtoList.find(a => a.PayFrequency != null && a.PayFrequency !== '0');
      if (validCesMicroData) {
        leastPrLopp = validCesMicroData.PayFrequency;
        if (leastPrLopp != null) {
          cesMicroDataDtoList.every(currentRow => {
            if (+currentRow.PayFrequency < +leastPrLopp) {
              leastPrLopp = currentRow.PayFrequency;
            }
          });
        }
      }
      return leastPrLopp;
    }



    getLatestGoodDate(cesMicroDataDtoList: CollectionsCesMicroDataDto[]): Date {
       let latestGoodDate: Date;
       let goodDate: Date;
       // start with first micro row with RC 90 as our latest good date - we will use this to start comparing to other microrow good dates
       const successfulMicroDataRow = cesMicroDataDtoList.find(a => a.ResponseCode === '90');
       if (successfulMicroDataRow != null) {
        goodDate = new Date(cesMicroDataDtoList.find(a => a.ResponseCode === '90').GoodDate);
       }


       if (cesMicroDataDtoList != null && goodDate != null) {
        latestGoodDate = new Date(goodDate.getFullYear(), goodDate.getMonth(), goodDate.getDate());

        cesMicroDataDtoList.every(microRow => {
          const thisgoodDate = new Date(microRow.GoodDate);
          const thisGoodDate: Date = new Date(thisgoodDate.getFullYear(), thisgoodDate.getMonth(), thisgoodDate.getDate());
          // find the goodDates
          if (moment(thisGoodDate).isAfter(latestGoodDate, 'day')) {
            latestGoodDate = thisGoodDate;
          }
        });
       }


       return latestGoodDate;
    }

    setUnitResponseCode(unit: Unit, firstMicroRowResponseCode: string) {
      if (this.lookupService.isDispCodeFinal(unit.DispositionCode) || unit.DispositionCode === '00') {
        unit.RespCode = unit.DispositionCode;
      } else {
        unit.RespCode = firstMicroRowResponseCode;
      }
    }

    mapCesMicroDataVmToDTO(currentMicroRow: CollectionsCesMicroData) {
      const cesMicroDataDto = new CollectionsCesMicroDataDto();
      if (currentMicroRow != null) {
        // mirodata values
        cesMicroDataDto.RefYY = currentMicroRow.RefYY;
        cesMicroDataDto.RefMM = currentMicroRow.RefMM;
        cesMicroDataDto.PayFrequency = currentMicroRow.PayFrequency.code;
        cesMicroDataDto.CommisionPayFrequncy = currentMicroRow.CommisionPayFrequncy.code;

        cesMicroDataDto.TotalWorkers = currentMicroRow.TotalWorkers != null ? (currentMicroRow.TotalWorkers === "" ? null : +currentMicroRow.TotalWorkers) : null;
        cesMicroDataDto.TotalWomenWorkers = currentMicroRow.TotalWomenWorkers != null ? (currentMicroRow.TotalWomenWorkers === "" ? null : +currentMicroRow.TotalWomenWorkers) : null;
        cesMicroDataDto.TotalWorkerPayrolls = currentMicroRow.TotalWorkerPayrolls != null ? (currentMicroRow.TotalWorkerPayrolls === "" ? null : +currentMicroRow.TotalWorkerPayrolls) : null;
        cesMicroDataDto.TotalWorkerHours = currentMicroRow.TotalWorkerHours != null ? (currentMicroRow.TotalWorkerHours === "" ? null : +currentMicroRow.TotalWorkerHours) : null;
        cesMicroDataDto.TotalOvertime =  currentMicroRow.TotalOvertime != null ? (currentMicroRow.TotalOvertime === "" ? null : +currentMicroRow.TotalOvertime) : null;
        cesMicroDataDto.TotalCommisions = currentMicroRow.TotalCommisions != null ? (currentMicroRow.TotalCommisions === "" ? null : +currentMicroRow.TotalCommisions) : null;

        cesMicroDataDto.TotalNonSupervisoryWokers = currentMicroRow.TotalNonSupervisoryWokers != null ? (currentMicroRow.TotalNonSupervisoryWokers === "" ? null : +currentMicroRow.TotalNonSupervisoryWokers) : null;
        cesMicroDataDto.TotalNonSupervisoryWorkerPayrolls = currentMicroRow.TotalNonSupervisoryWorkerPayrolls != null ? (currentMicroRow.TotalNonSupervisoryWorkerPayrolls === "" ? null : +currentMicroRow.TotalNonSupervisoryWorkerPayrolls) : null;
        cesMicroDataDto.TotalNonSupervisoryWorkerHours = currentMicroRow.TotalNonSupervisoryWorkerHours != null ? (currentMicroRow.TotalNonSupervisoryWorkerHours === "" ? null : +currentMicroRow.TotalNonSupervisoryWorkerHours) : null;
        cesMicroDataDto.TotalNonSupervisoryOvertime = currentMicroRow.TotalNonSupervisoryOvertime != null ? (currentMicroRow.TotalNonSupervisoryOvertime === "" ? null : +currentMicroRow.TotalNonSupervisoryOvertime) : null;
        cesMicroDataDto.TotalNonSUpervisoryCommisions = currentMicroRow.TotalNonSUpervisoryCommisions != null ? (currentMicroRow.TotalNonSUpervisoryCommisions === "" ? null : +currentMicroRow.TotalNonSUpervisoryCommisions) : null;
        cesMicroDataDto.GME = currentMicroRow.GME;
        cesMicroDataDto.GMECc = currentMicroRow.GMECc;
        // cesMicroDataDto.UpdateDateTime = currentMicroRow.UpdateDateTime, - is set on the server

        /* server MicroDataDTO object properties */
        cesMicroDataDto.InterviewerUserId =  this.currentLoggedInUser; // apply INT value from AE unit
        cesMicroDataDto.Pr1Lopp =  currentMicroRow.Pr1Lopp;
        cesMicroDataDto.Pr2Lopp =  currentMicroRow.Pr2Lopp;
        cesMicroDataDto.PrLp =  currentMicroRow.PrLp;
        cesMicroDataDto.CmLp =  currentMicroRow.CmLp;
        cesMicroDataDto.ResponseCode =  currentMicroRow.ResponseCode.code;
        // CC1
        cesMicroDataDto.EmploymentShift1 =  currentMicroRow.EmployementShift1.code;
        // CC2
        cesMicroDataDto.EmployementShift2 =  currentMicroRow.EmployementShift2.code;
        cesMicroDataDto.EmployementShift3 =  currentMicroRow.EmployementShift3,
        cesMicroDataDto.Closing =  currentMicroRow.Closing;
        cesMicroDataDto.ExportDateTime =  currentMicroRow.ExportDateTime;
        cesMicroDataDto.TransactionCode =  currentMicroRow.TransactionCode;

        // set the following before save -
        // cesMicroDataDto.ExportFlag =  currentMicroRow.ExportFlag ? 'T' : 'F';
        cesMicroDataDto.EDSC =  currentMicroRow.EDSC;
        cesMicroDataDto.PRO_FACTOR =  currentMicroRow.PRO_FACTOR;

        // cesMicroDataDto.GoodDate = currentMicroRow.GoodDate;
      }
      return cesMicroDataDto;

    }


    mapJoltsMicroDataVmToDTO(currentMicroRow: CollectionsJoltsMicroData) {
        const joltsMicroDataDto = new CollectionsJoltsMicroDataDto();
        if (currentMicroRow != null) {
          // mirodata values
          joltsMicroDataDto.RefMM = currentMicroRow.RefMM;
          joltsMicroDataDto.RefYY = currentMicroRow.RefYY;


          // mapping micro entries
          // AE values
          // cesMicroDataDto.TotalWorkers = currentMicroRow.TotalWorkers ? +currentMicroRow.TotalWorkers : null;
          joltsMicroDataDto.TotalEmployees = this.isReportedAndValid(currentMicroRow.TotalWorkers) ? +currentMicroRow.TotalWorkers : null;
          joltsMicroDataDto.JobOpenings = this.isReportedAndValid(currentMicroRow.JobOpenings) ? +currentMicroRow.JobOpenings : null;
          joltsMicroDataDto.LayoffsAndDischarges = this.isReportedAndValid(currentMicroRow.LayoffsAndDischarges) ? +currentMicroRow.LayoffsAndDischarges : null;
          joltsMicroDataDto.NewHires = this.isReportedAndValid(currentMicroRow.NewHires) ? +currentMicroRow.NewHires : null;
          joltsMicroDataDto.OtherSeperation = this.isReportedAndValid(currentMicroRow.OtherSeperation) ? +currentMicroRow.OtherSeperation : null;
          joltsMicroDataDto.Quits = this.isReportedAndValid(currentMicroRow.Quits) ? +currentMicroRow.Quits : null;
          joltsMicroDataDto.TotalSeperation = this.isReportedAndValid(currentMicroRow.TotalSeperation) ? +currentMicroRow.TotalSeperation : null;

           // map derivatives
          joltsMicroDataDto.NetTurn = this.isReportedAndValid(currentMicroRow.NetTurn) ? +currentMicroRow.NetTurn : null;
          joltsMicroDataDto.CummulativeDifference = this.isReportedAndValid(currentMicroRow.CummulativeDifference) ? +currentMicroRow.CummulativeDifference : null;
          joltsMicroDataDto.Difference = this.isReportedAndValid(currentMicroRow.Difference) ? +currentMicroRow.Difference : null;
          joltsMicroDataDto.TotalEmployeeChange = this.isReportedAndValid(currentMicroRow.TotalEmployeeChange) ? +currentMicroRow.TotalEmployeeChange : null;

          joltsMicroDataDto.ReEditCode = currentMicroRow.ReEditCode.code;
          joltsMicroDataDto.ReportNum = currentMicroRow.ReportNum;

          joltsMicroDataDto.ResponseCode = currentMicroRow.ResponseCode.code;
          joltsMicroDataDto.UpdateDateTime = currentMicroRow.UpdateDateTime;
          joltsMicroDataDto.ExportFlag = currentMicroRow.ExportFlag === 'T' ? true : false;
          joltsMicroDataDto.ExportDateTime = currentMicroRow.ExportDateTime;
          joltsMicroDataDto.InterviewerUserId = currentMicroRow.InterviewerUserId;
          joltsMicroDataDto.Notes = currentMicroRow.Notes;
          joltsMicroDataDto.StateCode = currentMicroRow.StateCode;
          joltsMicroDataDto.Status = currentMicroRow.Status;
          joltsMicroDataDto.ValidatedDateTime = currentMicroRow.ValidatedDateTime;

          joltsMicroDataDto.ResetCummulativeDifference = currentMicroRow.ResetCummulativeDifference;
          joltsMicroDataDto.AP = currentMicroRow.AP != null ? currentMicroRow.AP.code : null;
          joltsMicroDataDto.CodeComment1 = currentMicroRow.CodeComment1.code;
          joltsMicroDataDto.CodeComment2 = currentMicroRow.CodeComment2.code;


          joltsMicroDataDto.TransactionCode = currentMicroRow.TransactionCode;
          // when the RC 90, then EDSC should be no errors - 90 is good data
          if (joltsMicroDataDto.ResponseCode === '90') {
            joltsMicroDataDto.EDSC = null;
          } else {
            joltsMicroDataDto.EDSC = currentMicroRow.EDSC;
          }

          joltsMicroDataDto.ExportDateTime = currentMicroRow.ExportDateTime;
        }
        return joltsMicroDataDto;

      }




    hasDataEntryValuesChanged(currentMicroRowDto: CollectionsCesMicroDataDto, unit: Unit) {
      console.log('has data entry ' + JSON.stringify(this.unitService.pristineClonedUnit));
      // get the right micro row to compare
      let pristineMicroRow: CollectionsCesMicroDataDto;
      const currentPristineUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === unit.unitPK);
      if(currentPristineUnit != null) {
        if(currentPristineUnit.CesMicroDataList == null) {
          console.clear();
          console.log('missing unit microrows ' + unit.unitPK);
          const params = new HttpParams().set('stateCode', unit.StateCode).set('reptNum', unit.ReportNum);
          this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params)
          .subscribe((result: CollectionsCesMicroDataDto[]) => {
                // add to the cloned unit list from unitService - Important
                currentPristineUnit.CesMicroDataList = _.cloneDeep(result);
                pristineMicroRow = currentPristineUnit.CesMicroDataList
                    .find(a => a.RefMM === currentMicroRowDto.RefMM && a.RefYY === currentMicroRowDto.RefYY);
                console.log('filled it back up unit microrows ' + JSON.stringify(this.unitService.pristineClonedUnit));

                this.setMicroDataChangedFlag(pristineMicroRow, currentMicroRowDto);

                // console.log('hasChangedFlag ' + cesMicroDataDto.HasDataChanged);

                // set good date for each microrow and exportflag
                this.setGoodDateAndExportFlag(currentMicroRowDto, pristineMicroRow);
              }
            );
        } else {
          pristineMicroRow = currentPristineUnit.CesMicroDataList
                    .find(a => a.RefMM === currentMicroRowDto.RefMM && a.RefYY === currentMicroRowDto.RefYY);
          this.setMicroDataChangedFlag(pristineMicroRow, currentMicroRowDto);

          // console.log('hasChangedFlag ' + cesMicroDataDto.HasDataChanged);

                // set good date for each microrow and exportflag
          this.setGoodDateAndExportFlag(currentMicroRowDto, pristineMicroRow);
        }


        // console.log('comparing microrow - prisetine microrow ' + JSON.stringify(pristineMicroRow));
        // console.log('comparing microrow - current  microrow ' + JSON.stringify(currentMicroRowDto));
        // console.log('------------------------------------------------------------------------------');


        // if (pristineMicroRow != null) {
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRowDto.TotalWorkers)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalWorkers changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRowDto.TotalWomenWorkers)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalWomenWorkers changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRowDto.TotalWorkerPayrolls)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalWorkerPayrolls changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRowDto.TotalWorkerHours)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalWorkerHours changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRowDto.TotalCommisions)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalCommisions changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRowDto.TotalOvertime)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalOvertime changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRowDto.TotalNonSUpervisoryCommisions)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalNonSUpervisoryCommisions changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRowDto.TotalNonSupervisoryOvertime)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalNonSupervisoryOvertime changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRowDto.TotalNonSupervisoryWokers)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalNonSupervisoryWokers changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRowDto.TotalNonSupervisoryWorkerHours)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalNonSupervisoryWorkerHours changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRowDto.TotalNonSupervisoryWorkerPayrolls)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('TotalNonSupervisoryWorkerPayrolls changed ');
        //     return;
        //   }

        //    // compare each cell value
        //    if (pristineMicroRow.EmployementShift2 !== currentMicroRowDto.EmployementShift2) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('EmployementShift2 changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (pristineMicroRow.EmploymentShift1 !== currentMicroRowDto.EmploymentShift1) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('EmploymentShift1 changed ');
        //    return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRowDto.PrLp)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('PrLp changed ');
        //     return;
        //   }
        //   // compare each cell value
        //   if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRowDto.CmLp)) {
        //     currentMicroRowDto.HasDataChanged = true;
        //     console.log('CmLp changed ');
        //     return;
        //   }
        // }
      }
    }


    setMicroDataChangedFlag(pristineMicroRow: CollectionsCesMicroDataDto, currentMicroRowDto: CollectionsCesMicroDataDto) {
      console.log('comparing microrow - prisetine microrow ' + JSON.stringify(pristineMicroRow));
        console.log('comparing microrow - current  microrow ' + JSON.stringify(currentMicroRowDto));
        console.log('------------------------------------------------------------------------------');


        if (pristineMicroRow != null) {
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRowDto.TotalWorkers)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalWorkers changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRowDto.TotalWomenWorkers)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalWomenWorkers changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRowDto.TotalWorkerPayrolls)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalWorkerPayrolls changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRowDto.TotalWorkerHours)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalWorkerHours changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRowDto.TotalCommisions)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalCommisions changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRowDto.TotalOvertime)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalOvertime changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRowDto.TotalNonSUpervisoryCommisions)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalNonSUpervisoryCommisions changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRowDto.TotalNonSupervisoryOvertime)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalNonSupervisoryOvertime changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRowDto.TotalNonSupervisoryWokers)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalNonSupervisoryWokers changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRowDto.TotalNonSupervisoryWorkerHours)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalNonSupervisoryWorkerHours changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRowDto.TotalNonSupervisoryWorkerPayrolls)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('TotalNonSupervisoryWorkerPayrolls changed ');
            return;
          }

           // compare each cell value
           if (pristineMicroRow.EmployementShift2 !== currentMicroRowDto.EmployementShift2) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('EmployementShift2 changed ');
            return;
          }
          // compare each cell value
          if (pristineMicroRow.EmploymentShift1 !== currentMicroRowDto.EmploymentShift1) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('EmploymentShift1 changed ');
           return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRowDto.PrLp)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('PrLp changed ');
            return;
          }
          // compare each cell value
          if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRowDto.CmLp)) {
            currentMicroRowDto.HasDataChanged = true;
            console.log('CmLp changed ');
            return;
          }
        }
    }




    // set good date and export flag
    setGoodDateAndExportFlag = (currentMicroRowDto: CollectionsCesMicroDataDto, pristineMicroRow: CollectionsCesMicroDataDto) => {
      // let pristineMicroRow: CollectionsCesMicroDataDto = null;
      // const currentPristineUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === unit.unitPK);
      // if(currentPristineUnit != null) {
      //     pristineMicroRow = currentPristineUnit.CesMicroDataList
      //                 .find(a => a.RefMM === currentMicroRowDto.RefMM && a.RefYY === currentMicroRowDto.RefYY);
      // }

      // start setting good date

      try {
        if (currentMicroRowDto.HasDataChanged && currentMicroRowDto.ResponseCode === '90') {


          const now: Date = new Date();
          currentMicroRowDto.GoodDate= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
          console.log('setting good date as today now date for ' + currentMicroRowDto.RefMM + '/' + currentMicroRowDto.RefYY);
        }
        if (!currentMicroRowDto.HasDataChanged && currentMicroRowDto.ResponseCode === '90') {
               // no change ? - set it to the its oirignal good dates
              currentMicroRowDto.GoodDate = pristineMicroRow.GoodDate;
              console.log('setting good date as old ' + currentMicroRowDto.GoodDate + ' today now date for ' + currentMicroRowDto.RefMM + '/' + currentMicroRowDto.RefYY);

        }
        if (currentMicroRowDto.HasDataChanged && currentMicroRowDto.ResponseCode !== '90') {
             // set null
            currentMicroRowDto.GoodDate = null;
            console.log('setting good date as null - ' + currentMicroRowDto.GoodDate + ' today now date for ' + currentMicroRowDto.RefMM + '/' + currentMicroRowDto.RefYY);

        }
        if (currentMicroRowDto.HasDataChanged) {
          currentMicroRowDto.ExportFlag = 'T';
          console.log('setting true export flag as ' + currentMicroRowDto.ExportFlag + ' today now date for ' + currentMicroRowDto.RefMM + '/' + currentMicroRowDto.RefYY);

        } else {
           currentMicroRowDto.ExportFlag = pristineMicroRow.ExportFlag;
           console.log('setting old export flag as ' + currentMicroRowDto.ExportFlag + ' today now date for ' + currentMicroRowDto.RefMM + '/' + currentMicroRowDto.RefYY);

        }
      }
      catch(e) {
        console.log('Set good date error.');
      }

    }



  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '' && microDataValue !== ' ';
  }


    mapMultiPayToDto() {
      const cesMultiPayListDto = new Array<CesMultiPay>();
      // if (this.currentSelectedUnit != null && this.currentSelectedUnit.CesMicroDataPayGroups != null) {
      //    // repeat for paygrp1 and paygrp2
      //   this.currentSelectedUnit.CesMicroDataPayGroups.forEach(group => {
      //     if (group.cesMultiPayMicroRows != null) {
      //        // the way viewmodel is designed - we want first row from each group object - since second row is prev month row data
      //         const eachPayGroupRow = group.cesMultiPayMicroRows[0];
      //         // map to DTO object
      //         if (eachPayGroupRow != null) {
      //           const mutliPayDto = new CesMultiPay();
      //           mutliPayDto.RefYY = eachPayGroupRow.RefMM;
      //           mutliPayDto.RefMM = eachPayGroupRow.RefYY;
      //           mutliPayDto.PayFrequency = eachPayGroupRow.PayFrequency.code;
      //           mutliPayDto.CommisionPayFrequncy = eachPayGroupRow.CommisionPayFrequncy.code;
      //           mutliPayDto.TotalWorkers = +eachPayGroupRow.TotalWorkers;
      //           mutliPayDto.TotalWomenWorkers = +eachPayGroupRow.TotalWomenWorkers;
      //           mutliPayDto.TotalWorkerPayrolls = +eachPayGroupRow.TotalWorkerPayrolls;
      //           mutliPayDto.TotalWorkerHours = +eachPayGroupRow.TotalWorkerHours;
      //           mutliPayDto.TotalOvertime = +eachPayGroupRow.TotalOvertime;
      //           mutliPayDto.TotalCommisions = +eachPayGroupRow.TotalCommisions;
      //           mutliPayDto.TotalNonSupervisoryWokers = +eachPayGroupRow.TotalNonSupervisoryWokers;
      //           mutliPayDto.TotalNonSupervisoryWorkerPayrolls = +eachPayGroupRow.TotalNonSupervisoryWorkerPayrolls;
      //           mutliPayDto.TotalNonSupervisoryWorkerHours = +eachPayGroupRow.TotalNonSupervisoryWorkerHours;
      //           mutliPayDto.TotalNonSupervisoryOvertime = +eachPayGroupRow.TotalNonSupervisoryOvertime;
      //           mutliPayDto.TotalNonSUpervisoryCommisions = +eachPayGroupRow.TotalNonSUpervisoryCommisions;
      //           mutliPayDto.GME = +eachPayGroupRow.GME;
      //           mutliPayDto.GMECc = eachPayGroupRow.GMECc;
      //           mutliPayDto.PayGroupIndex = group.PayGroupIndex;
      //           mutliPayDto.UpdateDateTime = new Date(eachPayGroupRow.UpdateDateTime);
      //           // add it tot eh list
      //           cesMultiPayListDto.push(mutliPayDto);
      //         }
      //     }
      //   });
      // }
      return cesMultiPayListDto;
    }
}
