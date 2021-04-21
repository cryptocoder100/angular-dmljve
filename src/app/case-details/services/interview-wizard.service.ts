import { Injectable } from '@angular/core';
import { LookupService } from 'src/app/core/services/lookup.service';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import * as fromApp from '../../store/app.reducer';
import { CaseDetailsService } from './case-details.service';
import { Case } from 'src/app/shared/models/case.model';
import * as moment from 'moment';
import { take } from 'rxjs/operators';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { ToolBarDialogProps } from 'src/app/shared/models/ToolbarDialogProps';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { UnitService } from './unit.service';
import { CallCountType } from 'src/app/shared/models/interview-code.model';
import { ThrowStmt } from '@angular/compiler';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class InterviewWizardService {

  // sets current selected case
  currentSelectedCase: Case;
  isR2RInterviewType = false;
  currentCollectionMonth: string;
  currentCollectionYear: string;
  isERInterviewType = false;
  isNRPInterviewType = false;
  private interviewType: string;
  envVariableDetails: EnvironmentDetails;



  constructor(private lookupService: LookupService,
              private unitService: UnitService,
              private router: Router,
              private uiConfigService: UIConfigService,
              private store: Store<fromApp.AppState>,
              private caseDetailsService: CaseDetailsService) {

         this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.envVariableDetails = authState.userEnvironment.environmentDetails;
                  // this.currentLoggedInUser = authState.userEnvironment.currentUser.userId;
        });
         this.currentCollectionMonth = this.envVariableDetails.environmentVariables.find(a => a.envName === 'CURRENT_MONTH').envValue;
         this.currentCollectionYear = this.envVariableDetails.environmentVariables.find(a => a.envName === 'CURRENT_YEAR').envValue;
         this.currentSelectedCase = this.caseDetailsService.getSelectedCaseDetails(); // do not remove - it throws exception as if this service not initializing
         this.setInterviewTypes();
  }

  getCaseCMI() {
    return this.currentSelectedCase.CMI;
  }

  getCurrentSelectedCase() {
    // fetch case details and set it
    this.currentSelectedCase = this.caseDetailsService.getSelectedCaseDetails();
  }

  // show dialer
  ShowDialerDialog(): void {
    if (this.currentSelectedCase.CASE_NUM) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-dialer', this.currentSelectedCase.CASE_NUM ]}}]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-dialer', 100, 100);
    }
  }

   // show scheduler
  ShowSchedulerDialog(): void {
    if (this.currentSelectedCase.CASE_NUM) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-scheduler', this.currentSelectedCase.CASE_NUM] }}]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-scheduler', 100, 100);
    }
  }

  incrementCallCount(callType: CallCountType) {
    if (this.currentSelectedCase) {
      switch (callType) {
        case CallCountType.CallCount: {
          if (this.currentSelectedCase.CALL_COUNT) {
            this.currentSelectedCase.CALL_COUNT += 1;
          } else {
            this.currentSelectedCase.CALL_COUNT = 1;
          }
          this.currentSelectedCase.CALL_LAST_TIME = new Date();
          break;
        }
        case CallCountType.CallInterviewCount: {
          if (this.currentSelectedCase.CALL_INTERVIEW) {
            this.currentSelectedCase.CALL_INTERVIEW += 1;
          } else {
            this.currentSelectedCase.CALL_INTERVIEW = 1;
          }
          break;
        }
        case CallCountType.CallNACount: {
          if (this.currentSelectedCase.CALL_NA_COUNT) {
            this.currentSelectedCase.CALL_NA_COUNT += 1;
          } else {
            this.currentSelectedCase.CALL_NA_COUNT = 1;
          }
          break;
        }
        case CallCountType.CallBusyCount: {
          if (this.currentSelectedCase.CALL_BUSY_COUNT) {
            this.currentSelectedCase.CALL_BUSY_COUNT += 1;
          } else {
            this.currentSelectedCase.CALL_BUSY_COUNT = 1;
          }
          break;
        }
        case CallCountType.CallScheduleCount: {
          if (this.currentSelectedCase.CALLBACKS_SCHED) {
            this.currentSelectedCase.CALLBACKS_SCHED += 1;
          } else {
            this.currentSelectedCase.CALLBACKS_SCHED = 1;
          }
          break;
        }
     }
    }
  }



  CompleteInterview(isCompleteInterviewLater: boolean, shouldAutoScehdule: boolean) {
    this.currentSelectedCase.FINISH = 'T';

    // perform auto-schedule and set a date for call back to complete the interview later
    // (only when auto schedule scenario is eligible and when user choose complete later
    if (isCompleteInterviewLater) {
      if (shouldAutoScehdule) {
        this.autoScehduleInterviewForLater();
      }
    } else {
      this.currentSelectedCase.REPT_COND = '';
      this.currentSelectedCase.REPT_MODE_COND = this.currentSelectedCase.REPT_MODE;

      const unitList = this.unitService.getUnitList();
      // set NRP flag to 2 for each unit
      unitList.forEach(un => {
       un.NRPFlag = '2';
      });
      // save the unit back to their objects
      this.unitService.setUnitList(unitList);
      // Emit data to disable the dialer button when NRP case changes its mode from N-N to N
      if (this.currentSelectedCase.REPT_MODE_COND === 'N') {
          this.uiConfigService.setDialerButtonDisabled(true);
      }
    }
  }



  autoScehduleInterviewForLater() {
    const now = new Date();
     // Get the first date of this month at 9 o'clock in the morning
    const firstSaturdayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0, 0);
    while (firstSaturdayOfThisMonth.getDay() !== 6) {
        firstSaturdayOfThisMonth.setDate(firstSaturdayOfThisMonth.getDate() + 1);
    }
    // Auto schedule to this first Saturday if today is after the last closing of previous month
    // but before the first closing of this month,
    // e.g. Monday, Tuesday, Wednesday, Thursday, Friday of first week
    // otherwise auto-schedule to first saturday of next month
    if (firstSaturdayOfThisMonth >= now) {
      this.currentSelectedCase.SCHED_DATE_TIME = firstSaturdayOfThisMonth;
    } else {
      // Get the first date of the next month at 9 o'clock in the morning
      let firstDateOfNextMonth;
      if (now.getMonth() === 11) {
          firstDateOfNextMonth = new Date(now.getFullYear() + 1, 0, 1, 9, 0, 0, 0);
      } else {
          firstDateOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
      }
      const firstSaturdayOfNextMonth = firstDateOfNextMonth;
      // Get the first Saturday in the month
      while (firstSaturdayOfNextMonth.getDay() !== 6) {
          firstSaturdayOfNextMonth.setDate(firstSaturdayOfNextMonth.getDate() + 1);
      }
      // Me.m_CaseHeader.SCHED_DATE_TIME = l_datDate
      this.currentSelectedCase.SCHED_DATE_TIME = firstSaturdayOfNextMonth;
    }
  }


  setCaseCallResult(callResultCode) {
    this.currentSelectedCase.CALL_RESULT_CODE = callResultCode;

    if (callResultCode === '046') {
      this.currentSelectedCase.NRP_CODE = '9';
      this.unitService.setOutOfBussinessForAllUnits();
    } else if (callResultCode === '042') {
      this.currentSelectedCase.NRP_CODE = '9';
      this.unitService.setRefusalForAllUnits();
    }

  }

  showInterviewWizard() {


    // check if we can open
    if (this.currentSelectedCase.REPT_COND === 'R' ||
        this.currentSelectedCase.REPT_COND === 'E' ||
        this.currentSelectedCase.REPT_COND === 'N') {
          return true;
    }
  }

  getRespondentFullName() {
    const pre = this.currentSelectedCase.CON_PRE ? this.currentSelectedCase.CON_PRE : '';
    const first = this.currentSelectedCase.CON_FIRST ? this.currentSelectedCase.CON_FIRST : '';

    const last = this.currentSelectedCase.CON_LAST ? this.currentSelectedCase.CON_LAST : '';
    const suffix = this.currentSelectedCase.CON_SUFF ? this.currentSelectedCase.CON_SUFF : '';

    return `${pre} ${first} ${last} ${suffix}`;
  }

  getCollectionMonthYear() {
    return `${this.currentCollectionMonth}/${this.currentCollectionYear}`;
  }


  getGreetingFromTimeZone() {
    if (this.currentSelectedCase.TIMEZONE != null) {
      if (this.currentSelectedCase.TIMEZONE.lastIndexOf('CANADA', 0) === 0) {
        this.currentSelectedCase.TIMEZONE = this.currentSelectedCase.TIMEZONE.replace('CANADA', 'Canada');
      }
    }

    const now = new Date();
    let nowMoment = moment(`${now.getFullYear()}-${now.getUTCMonth()}-${now.getDate()}`);
    let offsetHours = nowMoment.format('Z');

    if (this.currentSelectedCase.TIMEZONE) {
      var tz = nowMoment.tz(this.currentSelectedCase.TIMEZONE);
      if (tz) {
        offsetHours = tz.format('Z');
      }
    }
    
    if (+offsetHours < 12) {
      return 'Morning';
    } else {
     return 'Afternoon';
    }
  }

  getClosingDate(): string {
    // list of closing dates
    const listOfClosingDateEnv = this.envVariableDetails.environmentVariables.filter(a => a.envGroup === 'CLOSING_DATES');
    // find the closing date that is for the collection month
    const closingDateEnvNameKey = `CLOSING_DATES_${this.currentCollectionMonth}`;
    return listOfClosingDateEnv.find(a => a.envName === closingDateEnvNameKey).envValue;
  }


  // uitlity function
  TriggerShowPopup(pageStyleName: string, positionTop: number, positionLeft: number): void {
    // send a signal to turn visible to true
    const props = new ToolBarDialogProps();
    props.StyleClass = pageStyleName;
    props.Show = true;
    props.ShowHeader = false;
    props.PositionLeft = positionLeft;
    props.PositionTop = positionTop;
    this.uiConfigService.ShowPopUp(props);
  }
     //    if (collectionPanelModel.getSelectedCase().TIMEZONE != null) {
  //     if (collectionPanelModel.getSelectedCase().TIMEZONE.lastIndexOf("CANADA", 0) === 0) {
  //         collectionPanelModel.getSelectedCase().TIMEZONE = collectionPanelModel.getSelectedCase().TIMEZONE.replace("CANADA", "Canada");
  //     }
  // }
  // var localDate = kendo.timezone.convert(new Date(), new Date().getTimezoneOffset(), collectionPanelModel.getSelectedCase().TIMEZONE || "US/Eastern");
  // if (localDate.getHours() < 12) {
  //     scope.formInputs.locateText = scope.formInputs.locateText.replace("[MornAftn]", "Morning");
  // } else {
  //     scope.formInputs.locateText = scope.formInputs.locateText.replace("[MornAftn]", "Afternoon");
  // }

  // var closingDate;
  // _.each(systemSettingPanelModel.getClosingDates(), function (item) {
  //     if (item.envName.indexOf(systemSettingPanelModel.getCurrentRefMonth().envValue) > 0) {
  //         closingDate = item.envValue;
  //     }
  // });
  // if (closingDate != undefined || closingDate != null) {
  //     scope.formInputs.interviewContentsText = scope.formInputs.interviewContentsText.replace(new RegExp('\\[ByDate\\]', 'g'), closingDate)
  // } else {
  //     scope.formInputs.interviewContentsText = scope.formInputs.interviewContentsText.replace(new RegExp("\\[ByDate\\]", 'g'), " / / ");
  // }



  getNumberofMissingMonths() {
    switch (this.currentSelectedCase.RESP_CODE) {
      case '81': {
        return '1';
      }
      case '82': {
        return '> 1';
      }
      default: {
        return '0';
      }
    }
  }

  getCallCount(): number {
    return this.currentSelectedCase.CALL_COUNT ? this.currentSelectedCase.CALL_COUNT : 0;
  }

  getLastCall() {
    if (!this.currentSelectedCase.CALL_LAST_TIME) {
      return '';
    }
    const pipe = new DatePipe('en-US');
    return pipe.transform(this.currentSelectedCase.CALL_LAST_TIME, 'MMM dd, yyyy h:mm a');
  }

  setInterviewTypes() {
    switch (this.currentSelectedCase.REPT_COND) {
      case 'R': {
        this.interviewType = 'R2R';
        this.isR2RInterviewType = true;
        break;
      }
      case 'N': {
        this.interviewType = 'NRP';
        this.isNRPInterviewType = true;
        break;
      }
      case 'E': {
        this.interviewType = 'ER';
        this.isERInterviewType = true;
        break;
      }
    }
  }

}
