import { Injectable } from '@angular/core';
import { pipe, Observable, of, BehaviorSubject, Subject, throwError } from 'rxjs';
import { take, switchMap, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import * as fromCaseDetails from '../store/case-details.reducer';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { Router } from '@angular/router';
import * as CaseListActions from '../../case-list/store/caselist.actions';
import { Case } from 'src/app/shared/models/case.model';
import { LookupService } from 'src/app/core/services/lookup.service';
import { CollectionsService } from './collections.service';
import { UnitService } from './unit.service';
import { Unit } from 'src/app/shared/models/unit.model';
import { CollectionsCesMicroDataDto } from 'src/app/shared/models/collections-microdata.model';
import { Collection } from 'lodash';
import { CollectionsSaveService } from './collections-save.service';
import { CaseRollOverSummary } from 'src/app/shared/models/rollover.model';




@Injectable({
    providedIn: 'root'
})
export class CaseDetailsService {

  // caseDetailsSavingSubject = new BehaviorSubject<boolean>(false);
  // caseDetailsSaving$ = this.caseDetailsSavingSubject.asObservable();
    surveyId: string;
    selectedCaseDetails: Case;

    // Prasad - list of CMIs for which we need to run NRP calcualtion during rollover
    allowableCMIValuesForRollover: string[] = ['03', '11', '14', '15', '16', '18', '08'];

    // list of NRPs for which we need to run NRP calcualtion during rollover
    allowableNrpCodesForRollover: string[] = ['', '0', '8', '9'];

    collectionYear: string;
    collectionMonth: string;
    private isCaseDirty = false;
    private isCollectionDataDirty = false;
    currentUserId: string;
    private hasCollection = false;
    private hasCollectionSubject = new Subject<boolean>();
    hasCollection$ = this.hasCollectionSubject.asObservable();
    currentSelectedUnitIdForCollections: string = null;


    //caseContactDetailschangedSubject = new BehaviorSubject<boolean>(false);
    //caseContactDetailschanged$ = this.caseContactDetailschangedSubject.asObservable();




    constructor(private store: Store<fromApp.AppState>,
                private collectionSaveService: CollectionsSaveService,
                private unitService: UnitService,
                private lookupService: LookupService) {



        const subs = this.unitService.setRolloerCallComplete$.subscribe(isRolloverComplete => {
          if (this.selectedCaseDetails != null && isRolloverComplete) {
            // ready to report
            if (this.selectedCaseDetails.REPT_COND === 'R') {
                   if (this.selectedCaseDetails.REPT_MODE === 'W') {
                    this.selectedCaseDetails.REPT_COND = 'W';
                   } else {
                    this.selectedCaseDetails.REPT_COND = '';
                   }

                   this.selectedCaseDetails.REPT_MODE_COND = this.selectedCaseDetails.REPT_MODE;
               }
          }
        });

        this.store.select(fromAuth.getUserEnvironment).pipe(take(1)).subscribe(userEnv => {
            this.surveyId = userEnv.environmentDetails.survey;
        });
        this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
          this.currentUserId = authState.userEnvironment.currentUser.userId;
        });
    }

    // Prasad: Get this from store since the selected case is set;
    // more declarative code than procedural
    selectedCase$: Observable<Case> = this.store.select<Case>(fromCaseList.getSelectedCaseObject).pipe(
        take(1),
        switchMap(caseDetails => {
          console.log('casedetail service');
          return of(caseDetails);
        }),
        catchError(errorResponse => {
            return of(errorResponse);
        })
      );


    getSurveyId(): string {
        return this.surveyId;
    }

    setSelectedCaseDetails(aCase: Case) {
        this.selectedCaseDetails = aCase;
    }

    getSelectedCaseDetails(): Case {
        return this.selectedCaseDetails;
    }

    setJoltsCurrentCasePriority(joltsCasePriority: string) {
      this.selectedCaseDetails.PRIORITY = joltsCasePriority;
    }

    isJoltsCaseReadyToReport() {
      return this.selectedCaseDetails.REPT_COND === 'R';
    }


    completeRolloverForCES(unitList: Unit[]) {
      this.selectedCaseDetails.REPT_MODE_COND = this.selectedCaseDetails.REPT_MODE;
      if (this.selectedCaseDetails.REPT_MODE === 'T' || this.selectedCaseDetails.REPT_MODE === 'W') {
            this.selectedCaseDetails.REPT_COND = 'R';
            this.selectedCaseDetails.REPT_MODE_COND = `${this.selectedCaseDetails.REPT_MODE}-${this.selectedCaseDetails.REPT_COND}`;
      }
      if (this.selectedCaseDetails.REPT_MODE === 'R' || this.selectedCaseDetails.REPT_MODE === 'E' || this.selectedCaseDetails.REPT_MODE === 'N') {
        this.selectedCaseDetails.REPT_COND = '';
        this.selectedCaseDetails.REPT_MODE_COND = `${this.selectedCaseDetails.REPT_MODE}`;
      }

      // get unit list
      let activeUnitsCount = 0;
      unitList.forEach(un => {
        un.CMICes = this.selectedCaseDetails.CMI;
        un.ExportFlag = 'T';
        if (un.DispositionCode === '00' || un.DispositionCode === '99') {
          activeUnitsCount++;
        }
      });
      // set active units
      this.selectedCaseDetails.ACTIVE_UNITS_COUNT = activeUnitsCount;

      // update multi flag
      if (this.selectedCaseDetails.ACTIVE_UNITS_COUNT > 1) {
        this.selectedCaseDetails.MULTI_FLAG = 'T';
      } else {
        this.selectedCaseDetails.MULTI_FLAG = 'F';
      }
    }


    completeRolloverForJOLTS(unitList: Unit[]) {
      // update case info
      this.selectedCaseDetails.REPT_MODE_COND = this.selectedCaseDetails.REPT_MODE;
      if (this.selectedCaseDetails.REPT_MODE === 'T' ||  this.selectedCaseDetails.REPT_MODE === 'W' || this.selectedCaseDetails.REPT_MODE === 'L') {
          this.selectedCaseDetails.REPT_COND = 'R';
          this.selectedCaseDetails.REPT_MODE_COND = `${this.selectedCaseDetails.REPT_MODE}-${this.selectedCaseDetails.REPT_COND}`;
      } else {
          if (this.selectedCaseDetails.REPT_COND === 'R') { // R for Ready to Report
              this.selectedCaseDetails.REPT_COND = '';
              this.selectedCaseDetails.REPT_MODE_COND = this.selectedCaseDetails.REPT_MODE;
          }
      }

      // updateUnitsCMI
      unitList.forEach(un => {
        un.CMICes = this.selectedCaseDetails.CMI;
      });
    }

    // push the new values set in rollover over to case
    completeRollover(rolloverContactInfoCase: Case, rolloverCaseInfo: CaseRollOverSummary, collectionMonth, collectionYear): boolean {
      try {
        // set case information
        this.selectedCaseDetails.ROLL_DATE = collectionMonth + collectionYear;
        this.selectedCaseDetails.REPT_MODE = rolloverCaseInfo.ReportMode;
        this.selectedCaseDetails.CMI = rolloverCaseInfo.CollectionMethodIndicator;
        this.selectedCaseDetails.TDE_STAT = rolloverCaseInfo.TdeStatus;
        this.selectedCaseDetails.ER_LOC = rolloverCaseInfo.EditResponsbilityLocation;
        this.selectedCaseDetails.DATA_LOC = rolloverCaseInfo.DataLocation;

        // also save changes made from contact details info in the rollover page to
        // main case to save
        if (this.surveyId === 'J') {
          this.selectedCaseDetails.CON_FIRST = rolloverContactInfoCase.CON_FIRST;
          this.selectedCaseDetails.CON_LAST = rolloverContactInfoCase.CON_LAST;
          this.selectedCaseDetails.ADDRESS = rolloverContactInfoCase.ADDRESS;
          this.selectedCaseDetails.CITY = rolloverContactInfoCase.CITY;
          this.selectedCaseDetails.STATE = rolloverContactInfoCase.STATE;
          this.selectedCaseDetails.zipCode = rolloverContactInfoCase.zipCode;
          this.selectedCaseDetails.EMAIL_ADDRESS = rolloverContactInfoCase.EMAIL_ADDRESS;
          this.selectedCaseDetails.PHONE_PRE = rolloverContactInfoCase.PHONE_PRE;
          this.selectedCaseDetails.PHONE_NUM = rolloverContactInfoCase.PHONE_NUM;
          this.selectedCaseDetails.FAX_PRE = rolloverContactInfoCase.FAX_PRE;
          this.selectedCaseDetails.FAX_NUM = rolloverContactInfoCase.FAX_NUM;

          this.selectedCaseDetails.CMI = '10';
        }

        // get unit list to udpate CMI
        const unitList: Unit[] = this.unitService.getUnitList();

        if (this.surveyId === 'C') {
          this.completeRolloverForCES(unitList);
        } else { // JOLTS
          this.completeRolloverForJOLTS(unitList);
        }

        // apply NRP codes only for certain CMI values
        if (this.allowableCMIValuesForRollover.includes(this.selectedCaseDetails.CMI)) {
          this.reCaluclateNRPCodes(unitList);
        }

        // save the unit back to their objects
        this.unitService.setUnitList(unitList);

        // save the case with these changes
        this.saveCase(false);

        // save sucess - make sure returns true after asynchronous op for save is complete
        return true;

      } catch (e) {
        // throw error and call log api
        throw new Error(`Rollover save failed for ${this.selectedCaseDetails.CASE_NUM}`);
      }
    }


    reCaluclateNRPCodes(unitList: Unit[]) {
      // check if NRP code falls in the allowable range
     if (this.allowableNrpCodesForRollover.includes(this.selectedCaseDetails.NRP_CODE)) {

            // sort the unit list by prlopp -
            // basically next 5 lines tries to get a unit which has largest PrLopp and Largest SizeCode
            unitList.sort((unit1, unit2) => (unit1.PRLopp > unit2.PRLopp) ? 1 : -1);
            const maxPrLopp = unitList.reverse()[0].PRLopp;
            // get all those units that has this highest values - there could more than 1 unit that have the same max value
            const maxPrLoppUnits = unitList.filter(a => a.PRLopp === maxPrLopp);
            maxPrLoppUnits.sort((unit1, unit2) => (unit1.ESSizeCode > unit2.ESSizeCode) ? 1 : -1);
            const maxPrLoppAndSizeCodeUnit = maxPrLoppUnits.reverse()[0];

            if (maxPrLoppAndSizeCodeUnit != null) {
              switch (maxPrLoppAndSizeCodeUnit.PRLopp) {
                case null:
                case '':
                case '0': {
                  this.selectedCaseDetails.NRP_CODE = '3';
                  break;
                }
                case '1': {
                  this.setNRPCodeByESSizeCode(maxPrLoppAndSizeCodeUnit.ESSizeCode);
                  break;
                }
                case '2': {
                  this.selectedCaseDetails.NRP_CODE = '4';
                  break;
                }
                case '3': {
                  this.selectedCaseDetails.NRP_CODE = '3';
                  break;
                }
                case '4': {
                  this.selectedCaseDetails.NRP_CODE = '5';
                  break;
                }
              }
            }
          }
    }


    setNRPCodeByESSizeCode(esSizeCode: string) {
      switch (esSizeCode) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          this.selectedCaseDetails.NRP_CODE = '1';
          break;
        }
        case '':
        case '6':
        case '7':
        case '8':
        case '9': {
          this.selectedCaseDetails.NRP_CODE = '2';
          break;
        }
      }
    }




    saveCase(closeOnSuccess: boolean): string {

      const selectedCase = this.getSelectedCaseDetails();
      const unitList: Unit[] = this.unitService.getUnitList();

      const oldActiveUnitsCount: number = selectedCase.ACTIVE_UNITS_COUNT;
      let activeUnitsCount = 0;
      unitList.forEach(un => {
        if (un.DispositionCode === '00' || un.DispositionCode === '99') {
          activeUnitsCount++;
        }

        let microDataToSave: any;
        // grab all collections microdata for each unit from collection service
        if (selectedCase.REPT_MODE !== 'A' && selectedCase.REPT_MODE !== 'E') {
          if (this.lookupService.isCES) {

            microDataToSave = this.collectionSaveService.CollectCesMicroData(un);
            un.CesMicroDataList = microDataToSave.cesMicroData;
            un.RespCode = microDataToSave.collectionUnitRc;
            un.PR1Lopp = microDataToSave.lastPrLopp; // adding the recalculated PrLp to unit
            // set the current selected unit in collections
            const isUnitSelected = microDataToSave.isCurrentSelectedUnit;
            if(isUnitSelected) {
              this.currentSelectedUnitIdForCollections = un.unitPK;
            }
            //this.caseContactDetailschanged$.subscribe ( isChanged => { if (isChanged) {
             // un.ExportFlag = 'T';
            //}})

            selectedCase.LAST_GOOD_DATE = microDataToSave.lastGoodDate;
            selectedCase.PLP = microDataToSave.lastPrLopp;

          } else {
            microDataToSave = this.collectionSaveService.CollectJoltsMicroData(un);
            // un.ExportFlag = 'T';
            un.JoltsMicroDataList = microDataToSave.joltsMicroData;
          }
        }

        let isUnitChanged = false;
        if (selectedCase.REPT_MODE === 'A' || selectedCase.REPT_MODE === 'E') {
            // when in Address enrollment
            const oldRespCode = un.RespCode;
            un.RespCode = this.unitService.calculateUnitRespCode(un, selectedCase.REPT_MODE);
            if (un.RespCode !== oldRespCode) {
              isUnitChanged = true;
            }
        } else {
            // when in collections
            // unit always changes (look in collections service where Unit respc0de is set)
            isUnitChanged = true;
        }


        if (un.INT_DATA !== this.currentUserId) {
          un.INT_DATA = this.currentUserId;
          isUnitChanged = true;
        }

        if (isUnitChanged) {
          un.TimeOfActivityDateTime = new Date();
          this.unitService.setUnitDirty(un.unitPK);
        }
      });

      selectedCase.ACTIVE_UNITS_COUNT = activeUnitsCount;
      if (activeUnitsCount > 1) {
        selectedCase.MULTI_FLAG = 'T';
      } else {
        selectedCase.MULTI_FLAG = 'F';
      }

      selectedCase.RESP_CODE = this.calculateCaseRespCode(unitList.map(un => un.RespCode));
      selectedCase.INT = this.currentUserId;
      selectedCase.DATE_TIME = new Date();
      selectedCase.TOUCH++;

      let casesToSave: Case[] = [];
      casesToSave.push(new Case(selectedCase));

      // if (this.getCaseDirty()) {
      //   casesToSave.push(new Case(selectedCase));
      // }

      let unitsToSave: Unit[] = [];
      unitList.forEach(un => {
        if (this.unitService.dirtyUnitPKs.findIndex(pk => un.unitPK === pk) !== -1) {
          unitsToSave.push(new Unit(un));
        }
      });

      // tslint:disable-next-line: object-literal-shorthand
      this.store.dispatch(new CaseListActions.SaveCases({casesToSave: casesToSave, unitsToSave: unitsToSave, microdataToSave: [],
        auditCaseNum: selectedCase.CASE_NUM, closeOnSuccess, isCompleteAddressRefinement: false, isCompleteEnrollment: false, isNrpComplete: false, currentSelectedUnitId: this.currentSelectedUnitIdForCollections}));

      return selectedCase.RESP_CODE;

    }






    IsConRefCodeEmpty(): boolean {
      return this.selectedCaseDetails.CONV_REF_CODE == null || this.selectedCaseDetails.CONV_REF_CODE === '';
    }

    // Prasad  -this method allows us to dynamically create the collection tab if one is not present when user complete enrollment.
    //          so the user can simply open collection right after enrollment
    setHasCollection(value: boolean) {
        this.hasCollection = value;
        this.hasCollectionSubject.next(value);
    }

    calculateCaseRespCode(unitRespCodes: string[]): string {
        if (!unitRespCodes || unitRespCodes.length === 0) {
            return '00';
        }

        if (unitRespCodes.length === 1) {
            return unitRespCodes[0];
        }

        const firstRespCode = unitRespCodes[0];
        let allSame = true;
        let allFinal = true;
        let allNonFinalSame = true;
        let existRefusal = false;
        let existOutOfBusiness = false;
        let existDuplicate = false;
        let existPending = false;
        let existNonResponseAndGoodDataOnly = true;
        let existNonResponseAndDelinquentOnly = true;
        let existDelinquentAndGoodDataOnly = true;
        let nonFinalRespCode: string;

        unitRespCodes.forEach(rc => {
            if (allSame && rc !== firstRespCode) {
                allSame = false;
            }

            if (this.lookupService.isRespCodeFinal(rc)) {
                existNonResponseAndDelinquentOnly = false;
                existNonResponseAndGoodDataOnly = false;
                existDelinquentAndGoodDataOnly = false;
                if (!existRefusal && this.lookupService.isRespCodeRefusal(rc)) {
                    existRefusal = true;
                } else if (!existOutOfBusiness && this.lookupService.isRespCodeOutOfBusiness(rc)) {
                    existOutOfBusiness = true;
                } else if (!existDuplicate && this.lookupService.isRespCodeDuplicate(rc)) {
                    existDuplicate = true;
                }
            } else {
                allFinal = false;
                if (!nonFinalRespCode) {
                    nonFinalRespCode = rc;
                } else {
                    if (rc !== nonFinalRespCode) {
                        allNonFinalSame = false;
                    }
                }

                if (!existPending && this.lookupService.isRespCodePending(rc)) {
                    existPending = true;
                    existNonResponseAndDelinquentOnly = false;
                    existNonResponseAndGoodDataOnly = false;
                    existDelinquentAndGoodDataOnly = false;
                }

                const isGoodData = this.lookupService.isRespCodeGoodData(rc);
                const isNonResponse = this.lookupService.isRespCodeNonResponse(rc);
                const isDelinquent = this.lookupService.isRespCodeDelinquent(rc);

                if (!isNonResponse && !isDelinquent) {
                    existNonResponseAndDelinquentOnly = false;
                }

                if (!isNonResponse && !isGoodData) {
                    existNonResponseAndGoodDataOnly = false;
                }

                if (!isDelinquent && isGoodData) {
                    existDelinquentAndGoodDataOnly = false;
                }

                if (!isNonResponse) {
                    if (!isDelinquent) {
                        existNonResponseAndDelinquentOnly = false;
                    }
                    if (!isGoodData) {
                        existNonResponseAndGoodDataOnly = false;
                    }
                }
            }
        });

        if (allSame) {
            return firstRespCode;
        }

        if (allFinal) {
            if (existRefusal) {
                return '30';
            }
            if (existOutOfBusiness) {
                return '50';
            }
            if (existDuplicate) {
                return '70';
            }
            return '50';
        }

        if (allNonFinalSame && nonFinalRespCode) {
            return nonFinalRespCode;
        }

        if (existPending || existNonResponseAndGoodDataOnly || existDelinquentAndGoodDataOnly) {
            return '10';
        }

        if (existNonResponseAndDelinquentOnly) {
            return '82';
        }

        return firstRespCode;
    }
}
