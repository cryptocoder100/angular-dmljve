import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { take } from 'rxjs/operators';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { CaseListService } from 'src/app/case-list/services/case-list.service';
import { Case } from 'src/app/shared/models/case.model';
import { LookupAddress } from 'dns';
import { LookupService } from 'src/app/core/services/lookup.service';
import { CollectionsJoltsMicroData, CollectionsCesMicroData } from 'src/app/shared/models/collections-microdata.model';
import { RollOverQuestion, CaseRollOverSummary } from 'src/app/shared/models/rollover.model';
import { CaseDetailsService } from './case-details.service';

@Injectable({
  providedIn: 'root'
})
export class RolloverService {

  startRolloverSubject = new BehaviorSubject<boolean>(false);
  startRollover$ = this.startRolloverSubject.asObservable();

  startRolloverInitSubject = new BehaviorSubject<boolean>(false);
  startRolloverInit$ = this.startRolloverInitSubject.asObservable();

  onCancelRolloverSubject = new BehaviorSubject<Map<string, RollOverQuestion[]>>(null);
  onCancelRollover$ = this.onCancelRolloverSubject.asObservable();


  enableRolloverCallCompleteSubject = new BehaviorSubject<boolean>(false);
  enableRolloverCallComplete$ = this.enableRolloverCallCompleteSubject.asObservable();

  // service that holds the list of quetions for rollover options and maintains state
  qaListForTdeRollover: RollOverQuestion[] = [];
  qaListForFaxRollover: RollOverQuestion[] =  [];
  qaListForWebRollover: RollOverQuestion[] = [];
  qaListForEmailRollover: RollOverQuestion[] = [];

  caseDetails: Case;
  isCES: boolean = this.lookUpService.isCES;
  currentEnvironmentVariables: EnvironmentDetails;
  currentSelectedCase: Case;
  monthToTDEEnvVar: string;
  rollOverCaseDetails: CaseRollOverSummary;

  constructor(private store: Store<fromApp.AppState>,
              private lookUpService: LookupService,
              // private caseDetailsService: CaseDetailsService,
              private caseListService: CaseListService) {
     // get all environment variables
     this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
        this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
      });
     this.monthToTDEEnvVar = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'MONTH_TO_TDE').envValue;

    //  myArray.forEach(val => myClonedArray.push(Object.assign({}, val)));

     this.lookUpService.getRollOverQuestions('tde').forEach(item => this.qaListForTdeRollover.push(Object.assign({}, item)));
     this.lookUpService.getRollOverQuestions('fax').forEach(item => this.qaListForFaxRollover.push(Object.assign({}, item)));
     this.lookUpService.getRollOverQuestions('web').forEach(item => this.qaListForWebRollover.push(Object.assign({}, item)));
     this.lookUpService.getRollOverQuestions('email').forEach(item => this.qaListForEmailRollover.push(Object.assign({}, item)));
  }



  cancelRolloverAndReset() {
    this.qaListForTdeRollover.splice(0, this.qaListForTdeRollover.length);
    this.qaListForFaxRollover.splice(0, this.qaListForFaxRollover.length);
    this.qaListForWebRollover.splice(0, this.qaListForWebRollover.length);
    this.qaListForEmailRollover.splice(0, this.qaListForEmailRollover.length);

    this.lookUpService.getRollOverQuestions('tde').forEach(item => this.qaListForTdeRollover.push(Object.assign({}, item)));
    this.lookUpService.getRollOverQuestions('fax').forEach(item => this.qaListForFaxRollover.push(Object.assign({}, item)));
    this.lookUpService.getRollOverQuestions('web').forEach(item => this.qaListForWebRollover.push(Object.assign({}, item)));
    this.lookUpService.getRollOverQuestions('email').forEach(item => this.qaListForEmailRollover.push(Object.assign({}, item)));


    // create a map to pacage all these questions
    const rolloverQuestionsMap = new Map<string, RollOverQuestion[]>();
    rolloverQuestionsMap.set('tde', this.qaListForTdeRollover);
    rolloverQuestionsMap.set('fax', this.qaListForFaxRollover);
    rolloverQuestionsMap.set('web', this.qaListForWebRollover);
    rolloverQuestionsMap.set('email', this.qaListForEmailRollover);

    this.onCancelRolloverSubject.next(rolloverQuestionsMap);
  }

  setDefaultAnswersForQuestionsByRolloverStatus(rolloverType: string) {
    switch (rolloverType) {
      case 'ttone': {
        if (this.qaListForTdeRollover != null && this.qaListForTdeRollover.length > 0) {
          if (this.rollOverCaseDetails.TouchToneStatus === '1') {
            this.qaListForTdeRollover.find(c => c.questionId === 1).answer = 'YES';
          } else if (this.rollOverCaseDetails.TouchToneStatus === '2') {
            this.qaListForTdeRollover.find(c => c.questionId === 1).answer = 'NO';
          } else {
            this.qaListForTdeRollover.find(c => c.questionId === 1).answer = 'NA';
          }
        }
        break;
      }
      case 'tde': {
        if (this.qaListForTdeRollover != null && this.qaListForTdeRollover.length > 0) {
          if (this.rollOverCaseDetails.TdeStatus === '1') {
            this.qaListForTdeRollover.find(c => c.questionId === 2).answer = 'YES';
          } else if (this.rollOverCaseDetails.TdeStatus === '2') {
            this.qaListForTdeRollover.find(c => c.questionId === 2).answer = 'NO';
          } else {
            this.qaListForTdeRollover.find(c => c.questionId === 2).answer = 'NA';
          }
          // set all other questions to disable
          this.qaListForTdeRollover.find(c => c.questionId === 3).isDisabled = true;
          this.qaListForTdeRollover.find(c => c.questionId === 4).isDisabled = true;
          this.qaListForTdeRollover.find(c => c.questionId === 5).isDisabled = true;
        }
        break;
      }


      case 'fax': {
        if ((this.qaListForTdeRollover != null && this.qaListForTdeRollover.length > 0) &&
            (this.qaListForFaxRollover != null && this.qaListForFaxRollover.length > 0)) {
              if (this.rollOverCaseDetails.FaxStatus === '1') {
                this.qaListForTdeRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForTdeRollover.find(c => c.questionId === 4).answer = 'YES';
                this.qaListForTdeRollover.find(c => c.questionId === 5).answer = 'YES';

                this.qaListForFaxRollover.find(c => c.questionId === 2).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 4).answer = 'YES';

              } else if (this.rollOverCaseDetails.FaxStatus === '2') {
                this.qaListForTdeRollover.find(c => c.questionId === 3).answer = 'NO';
                this.qaListForTdeRollover.find(c => c.questionId === 4).answer = 'NO';
                this.qaListForTdeRollover.find(c => c.questionId === 5).answer = 'NO';

                this.qaListForFaxRollover.find(c => c.questionId === 2).answer = 'NO';
                this.qaListForFaxRollover.find(c => c.questionId === 3).answer = 'NO';
                this.qaListForFaxRollover.find(c => c.questionId === 4).answer = 'NO';

              } else if (this.rollOverCaseDetails.FaxStatus === '3') {
                this.qaListForTdeRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForTdeRollover.find(c => c.questionId === 4).answer = 'YES';
                this.qaListForTdeRollover.find(c => c.questionId === 5).answer = 'NO';

                this.qaListForFaxRollover.find(c => c.questionId === 2).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 4).answer = 'NO';

              } else if (this.rollOverCaseDetails.FaxStatus === '4') {
                this.qaListForTdeRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForTdeRollover.find(c => c.questionId === 4).answer = 'NO';
                this.qaListForTdeRollover.find(c => c.questionId === 5).answer = 'YES';

                this.qaListForFaxRollover.find(c => c.questionId === 2).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 3).answer = 'NO';
                this.qaListForFaxRollover.find(c => c.questionId === 4).answer = 'YES';

              } else {
                this.qaListForTdeRollover.find(c => c.questionId === 3).answer = 'NA';
                this.qaListForTdeRollover.find(c => c.questionId === 4).answer = 'NA';
                this.qaListForTdeRollover.find(c => c.questionId === 5).answer = 'NA';

                this.qaListForFaxRollover.find(c => c.questionId === 1).answer = 'YES';
                this.qaListForFaxRollover.find(c => c.questionId === 2).answer = 'NA';
                this.qaListForFaxRollover.find(c => c.questionId === 3).answer = 'NA';
                this.qaListForFaxRollover.find(c => c.questionId === 4).answer = 'NA';
              }
        }
        break;
      }

      case 'email': {
        if ((this.qaListForEmailRollover != null && this.qaListForEmailRollover.length > 0) &&
            (this.qaListForWebRollover != null && this.qaListForWebRollover.length > 0)) {
              if (this.rollOverCaseDetails.EmailStatus === '1') {
                this.qaListForWebRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForWebRollover.find(c => c.questionId === 4).answer = 'YES';

                this.qaListForEmailRollover.find(c => c.questionId === 2).answer = 'YES';
                this.qaListForEmailRollover.find(c => c.questionId === 3).answer = 'YES';

              } else if (this.rollOverCaseDetails.EmailStatus === '2') {
                this.qaListForWebRollover.find(c => c.questionId === 3).answer = 'NO';
                this.qaListForWebRollover.find(c => c.questionId === 4).answer = 'NO';

                this.qaListForEmailRollover.find(c => c.questionId === 2).answer = 'NO';
                this.qaListForEmailRollover.find(c => c.questionId === 3).answer = 'NO';

              } else if (this.rollOverCaseDetails.EmailStatus === '3') {
                this.qaListForWebRollover.find(c => c.questionId === 3).answer = 'YES';
                this.qaListForWebRollover.find(c => c.questionId === 4).answer = 'NO';

                this.qaListForEmailRollover.find(c => c.questionId === 2).answer = 'YES';
                this.qaListForEmailRollover.find(c => c.questionId === 3).answer = 'NO';

              } else {
                this.qaListForWebRollover.find(c => c.questionId === 1).answer = 'NA';
                this.qaListForWebRollover.find(c => c.questionId === 2).answer = 'NA';
                this.qaListForWebRollover.find(c => c.questionId === 3).answer = 'NA';
                this.qaListForWebRollover.find(c => c.questionId === 4).answer = 'NA';

                this.qaListForEmailRollover.find(c => c.questionId === 1).answer = 'NO';
                this.qaListForEmailRollover.find(c => c.questionId === 2).answer = 'NA';
                this.qaListForEmailRollover.find(c => c.questionId === 3).answer = 'NA';
              }
        }
        break;
      }
    }
  }

  // on rollover complete - update teh rollover cmplete button with RED or default color
  enableRolloverCallComplete(canEnableRolloverButtonComplete: boolean) {
    this.enableRolloverCallCompleteSubject.next(true);
  }

  // Prasad - The method emits true/false to the rollover component whcih then uses
  // it to set the focus on the first element.
  onRolloverDialogInit() {
    this.startRolloverInitSubject.next(true);
  }


  onStartRollover() {
    this.startRolloverSubject.next(true);
  }

  onInitializeRolloverPage() {
    this.startRolloverSubject.next(false);
  }


  // method to determine if a rollover reminder for TDE is needed
  isTdeEligible(joltsMicroData: CollectionsJoltsMicroData[] | CollectionsCesMicroData[],  collectionYear: string, collectionMonth: string) {
    let eligible = false;
    this.currentSelectedCase  = this.caseListService.getCaseDetails();

    if (this.currentSelectedCase.REPT_MODE === 'C') {
        if (this.currentSelectedCase.START_DATE != null && this.monthToTDEEnvVar != null) {
            // Get Difference of Number of Months between current Reference Period and Case Start Date
            // tslint:disable-next-line: one-variable-per-declaration
            let refYear: number, startYear: number, diffMonth: number;

            // Convert refPeriod "XXXX/XX" to Date
            const refYearMonth = new Date(+collectionYear, +collectionMonth - 1);
            const startYearMonth = new Date(+this.currentSelectedCase.START_DATE.substr(2), +this.currentSelectedCase.START_DATE.substr(0, 2) - 1);
            let refMonth = refYearMonth.getMonth();
            let startMonth = startYearMonth.getMonth();
            startYear = startYearMonth.getFullYear();
            refYear = refYearMonth.getFullYear();

            // RefYear > StartYear
            if (startYear < refYear) {
                refMonth += (refYear - startYear) * 12;
                diffMonth = refMonth - startMonth;
            } else if (startYear > refYear) { // StartYear > RefYear
                startMonth += (startYear - refYear) * 12;
                diffMonth = startMonth - refMonth;
            } else { // StartYear == RefYear
                diffMonth = Math.abs(refMonth - startMonth);
            }

            // check if calculated month is greater than env var
            if ((diffMonth + 1) >= +this.monthToTDEEnvVar) {
                eligible = true;
            }
        }

        if (!this.isCES && eligible) {
            const consecMonthsFlag = this.getsJoltsContainsFourConsecutiveMonthsDataFlag(joltsMicroData as CollectionsJoltsMicroData[], collectionYear, collectionMonth);
            if (consecMonthsFlag) { // Find out whether is it consec
                eligible = true;
            } else {
                eligible = false;
            }
        }
    } else {  // Already Converted case or AddressRefinement case or Enrolllment caes; therefore exit
        eligible = false;
    }
    return eligible;
  }

  getsJoltsContainsFourConsecutiveMonthsDataFlag(joltsMicroData: CollectionsJoltsMicroData[], collectionYear: string, collectionMonth: string) {
    let consecMonthsCount = 0;
    let microRow: CollectionsJoltsMicroData;
    if (joltsMicroData.length >= 5) {

        // current month micro row - we only want to check past 4 months from current month
        // not include current month - so start with index 1

        for (let i = 1; i <= 4; i++) {
          microRow =  joltsMicroData[1]; // joltsMicroData.shift(); // return next micro row
          if (this.joltsMicroRowMeetsRolloverReminderCriteria(microRow)) {
            consecMonthsCount++;
          } else {
            return false;
          }
        }
        if (consecMonthsCount === 4) {
          return true;
        }
      }
  }


  joltsMicroRowMeetsRolloverReminderCriteria(microRow: CollectionsJoltsMicroData) {
    // check if this meets criteria
    if (microRow.ResponseCode != null &&  (microRow.ResponseCode.code === '90' || microRow.ResponseCode.code === '91')) {
      if (this.currentSelectedCase.CMI === '0' || this.currentSelectedCase.CMI === '00') {
        if (!(microRow.TotalWorkers >= 0)) {
          return false;
        } else {
          return true;
        }
      }
    }
  }





  isFirstTimeRollover() {
    let is = false;
    if (this.currentSelectedCase.NRP_CODE != null) {
      // CMI Code for Web = 16, Web FTP = 15
          if ((this.currentSelectedCase.CMI === '15' || this.currentSelectedCase.CMI === '16') &&
          this.currentSelectedCase.NRP_CODE.trim() === '') {
            is = true;
      }
    }

    return is;
  }
}
