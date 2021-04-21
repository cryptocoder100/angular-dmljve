import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, AfterContentChecked, ElementRef, ViewChild } from '@angular/core';
import { InterviewMessages, InterviewCodeLookupModel, InterviewWizardPanel, CallCountType } from 'src/app/shared/models/interview-code.model';
import { DdOptions } from 'src/app/shared/models/collections.lookup.model';
import * as fromApp from '../../../../store/app.reducer';
import { ActionsSubject, Store } from '@ngrx/store';
import * as fromAuth from '../../../../shared/auth/store/auth.reducer';
import * as fromCaseList from '../../../../case-list/store/caselist.reducer';
import { CesCMI } from 'src/app/shared/models/rollover.model';
import { LookupService } from 'src/app/core/services/lookup.service';
import { InterviewWizardService } from 'src/app/case-details/services/interview-wizard.service';
import { take } from 'rxjs/operators';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { Interaction } from 'src/app/shared/models/interaction.model';
import { CaseDetailsService } from 'src/app/case-details/services/case-details.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as CaseListActions from '../../../../case-list/store/caselist.actions';
import { ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { CaseListService } from 'src/app/case-list/services/case-list.service';




@Component({
  selector: 'fsms-tcw-interview-wizard',
  templateUrl: './interview-wizard.component.html',
  styleUrls: ['./interview-wizard.component.css']
})
export class InterviewWizardComponent implements OnInit, OnDestroy, AfterContentChecked, AfterViewInit {

  accordionIndex = 0;
  // value that sets what panel in teh wizard will eb visible.
  // primeng's steps use index to represent each panel sort of like array items.
  // see minterview model for enum listing each panel
  activeIndex = 0;

  prevIndex = 0;
  activePanelIndex = 0;
  currentSelectedCaseCMI: string;



  // declare an array to hold the step index (each wizard) path the user is navigating forward.
  // set the array to start with the 1st wizard - start interview - 0
  wizardNavigatedPathArray: number[] = [0];
  currentPathArrayPointer = 0;

  // to enable or disable next and prev buttons
  disableNext = false;
  disablePrev = true;
  disableDone = true;


  // for start interview wizard (1st panel) panel items
  beginInterviewText: string;
  selecteddialOptionValue: string;

  // for locaet respondent wizard (2nd panel) panel items
  locateRespondentWizardText: string;
  selectedlocateRespondentCallOptionValue: string;

  // interview content wizard panel (3rd panel) items
  callInterviewTranscriptText: string;
  probeQuestion: string;
  selectedProbeOptionValue: string;
  callResultsOption: DdOptions[];
  selectedCallResultsOptionValue: DdOptions;
  canShowCallResultsOption: boolean;

  // drop down options on the contact unavialble (4rth panel) wizard
  contactUnavailableText = `Select the appropriate "Contact Unavailable" option`;
  isInterviewTypeNRP = false;
  isInterviewTypeR2R = false;
  isInterviewTypeER = false;
  unAvailableOptions: DdOptions[];
  selectedUnAvailableOptionValue: DdOptions;
  unAvailableNRPOptions: DdOptions[];
  selectedUnAvailableNRPOptionValue: DdOptions;

  // end interview wizard (5th panel) items
  endInterViewText = `Select Done to close the case.`;
  selectedEndInterviewOptionValue: string;

  // collection of messages constatnt object for interview wizard
  interviewMessages: InterviewMessages;
  CmiCodes: CesCMI;
  numberOfMissingMonths: string;

  // static data to be shown on the right side panel (always visible no matter whcih wizard panel the user is on)
  urlText: string;
  urlLink: string;
  helpText: string;
  helpLine: string;
  missingMonths: string;
  callsPlaced: number;
  isCallBusyCount = false;
  isCallNaCount = false;

  lastCallDate: string;

  shouldAutoSchedule = false;
  isCallInterviewCount = false;
  isCallScheduleCount = false;
  oldInteraction: Interaction;

  envVariableDetails: EnvironmentDetails;
  greetings: string;
  closingDate: string;

  currentLoggedInUser: string;

  saveSuccessSubscription: Subscription;
  saveFailSubscription: Subscription;
  caseListSub: Subscription;

  @ViewChild('startInterview', { read: ElementRef, static: true}) startInterviewHtmlRef: ElementRef;
  @ViewChild('locateRespondent', { read: ElementRef, static: true}) locateRespondentHtmlRef: ElementRef;
  @ViewChild('endInterview', { read: ElementRef, static: true}) endInterviewHtmlRef: ElementRef;
  endInterviewEleme: HTMLElement;


  get SelectedCallResultOption(): DdOptions {
    return this.selectedCallResultsOptionValue;
  }
  set SelectedCallResultOption(value: DdOptions) {
    this.selectedCallResultsOptionValue = value;
    if (value != null && value.code !== '') {
      this.disableNext = false;
      this.disablePrev = false;
    } else {
      this.disableNext = true;
      this.disablePrev = false;
    }
  }

  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private lookupService: LookupService,
              private cd: ChangeDetectorRef,
              private interviewWizardService: InterviewWizardService,
              private store: Store<fromApp.AppState>,
              private caseDetailsService: CaseDetailsService,
              private caseListService: CaseListService,
              private actionsSubject$: ActionsSubject,
              private router: Router) {
        this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.envVariableDetails = authState.userEnvironment.environmentDetails;
                  this.currentLoggedInUser = authState.userEnvironment.currentUser.userName;
        });
        this.store.select(fromCaseList.getInteraction).pipe(take(1)).subscribe((interaction: Interaction) => {
          this.oldInteraction = interaction;
        });
      }





  ngAfterViewInit(): void {
    this.endInterviewEleme = this.startInterviewHtmlRef.nativeElement as HTMLElement;
    // elem.focus();
  }

  ngAfterContentChecked() {
    this.cd.detectChanges();
  }

  ngOnInit() {
    // load all lookups
    const elem = this.startInterviewHtmlRef.nativeElement as HTMLElement;
    console.log(elem.getRootNode());

    const interviewModel = new InterviewCodeLookupModel();
    this.CmiCodes = this.lookupService.getCesCMICodes();
    this.interviewMessages = interviewModel.getInterviewMessages();
    this.unAvailableOptions = interviewModel.getUnAvailableCodes();
    this.unAvailableOptions.unshift(null);
    this.unAvailableNRPOptions = interviewModel.getUnAvailableNRPCodes();
    this.unAvailableNRPOptions.unshift(null);
    this.callResultsOption = interviewModel.getCallResultOptions();

    // start init
    this.initInterviewWizard();

    // enable and open the panel
    this.accordionIndex = this.accordionIndex;

    this.saveSuccessSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SAVE_CASES_SUCCESS)).subscribe((action: CaseListActions.SaveCasesSuccess) => {
      this.onSaveSuccess(action.payload.closeOnSuccess);
    });

    this.saveFailSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SAVE_CASES_FAIL)).subscribe((action: CaseListActions.SaveCasesFail) => {
      this.onSaveFail(action.payload);
    });
  }

  onSaveSuccess(closeOnSuccess: boolean) {
    this.loadingSubject.next(false);
    if (closeOnSuccess) {
       this.returnToCaseList();
    }
  }

  onSaveFail(errorMessage: string) {
    this.loadingSubject.next(false);
    console.error(errorMessage);
  }

  ngOnDestroy() {
    this.saveSuccessSubscription.unsubscribe();
    this.saveFailSubscription.unsubscribe();
  }

  initInterviewWizard() {
     this.beginInterviewText = this.interviewMessages.beginInterview;
     this.locateRespondentWizardText = this.interviewMessages.respondentText;
     this.probeQuestion = this.interviewMessages.reportProblem;
     this.isInterviewTypeNRP = this.interviewWizardService.isNRPInterviewType;
     this.isInterviewTypeER = this.interviewWizardService.isERInterviewType;
     this.isInterviewTypeR2R = this.interviewWizardService.isR2RInterviewType;

     // set the text appearing on the wizard panel - Interview Content panel.
     this.setTranscriptsForInterviewConentWizard();

     // set the default selections radio button options for each wizard panel
     this.selecteddialOptionValue = 'dial';
     this.selectedlocateRespondentCallOptionValue = 'speak';

     // calcualte and set the missing months, call counts, etc., (appears on the right side section on the interview panel wizard
     // along wth help links)
     this.numberOfMissingMonths = this.interviewWizardService.getNumberofMissingMonths();
     this.callsPlaced = this.interviewWizardService.getCallCount();
     this.lastCallDate = this.interviewWizardService.getLastCall();
     this.helpText = 'Help Line';
     if (this.currentSelectedCaseCMI === this.CmiCodes.CMI_CODE_WEB) {
       this.urlText = 'Web Url';
       this.urlLink = this.envVariableDetails.environmentVariables.find(a => a.envGroup === 'WEB_COLLECTION' && a.envName === 'WEB_URL').envValue;
       this.helpLine = this.envVariableDetails.environmentVariables.find(a => a.envGroup === 'WEB_COLLECTION' && a.envName === 'WEB_HELP_PHONE').envValue;

     } else {
        this.urlText = 'TDE Phone';
        this.urlLink = this.envVariableDetails.environmentVariables.find(a => a.envGroup === 'TDE' && a.envName === 'TDEPhone').envValue;
        this.helpLine = this.envVariableDetails.environmentVariables.find(a => a.envGroup === 'TDE' && a.envName === 'TDEHelpLine').envValue;
     }

     // format interview transcripts texts appropriately that will appear on each interview wizaerd panel
     this.greetings = this.interviewWizardService.getGreetingFromTimeZone();
     this.closingDate = this.interviewWizardService.getClosingDate();

     if (this.callInterviewTranscriptText != null) {
      if (this.closingDate != null) {
        this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace(new RegExp('\\[ByDate\\]', 'g'), this.closingDate);
      } else {
       this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace(new RegExp('\\[ByDate\\]', 'g'), ' / / ');
      }

      this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace('[IntrName]', this.currentLoggedInUser);
      this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace('[RespName]', this.interviewWizardService.getRespondentFullName());
      this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace('[RefMonthYear]', this.interviewWizardService.getCollectionMonthYear());
      this.callInterviewTranscriptText = this.callInterviewTranscriptText.replace('[TDEPhone]', this.envVariableDetails.environmentVariables.find(a => a.envGroup === 'TDE' && a.envName === 'TDEPhone').envValue);
     }

     this.locateRespondentWizardText = this.locateRespondentWizardText.replace('[MornAftn]', this.greetings);
     this.locateRespondentWizardText = this.locateRespondentWizardText.replace('[RespName]', this.interviewWizardService.getRespondentFullName());
     this.locateRespondentWizardText = this.locateRespondentWizardText.replace('[IntrName]', this.currentLoggedInUser);
  }




  // sets the message that interivew uses on the 3rd wizard panel
  setTranscriptsForInterviewConentWizard() {
    this.callInterviewTranscriptText = this.interviewMessages.r2rTdeInterviewContent;

     // set interview transcript text
    if (this.isInterviewTypeR2R) {
        if (this.currentSelectedCaseCMI === this.CmiCodes.CMI_CODE_WEB) {
          this.callInterviewTranscriptText = this.interviewMessages.r2rWebInterviewContent;
        } else {
          this.callInterviewTranscriptText = this.interviewMessages.r2rTdeInterviewContent;
        }
        this.canShowCallResultsOption = false;
    }
    if (this.isInterviewTypeNRP) {
        this.callInterviewTranscriptText = this.interviewMessages.r2rNrpInterviewContent;
        this.canShowCallResultsOption = true;
    }
    if (this.isInterviewTypeER) {
        this.callInterviewTranscriptText = this.interviewMessages.r2rErInterviewContent;
        this.canShowCallResultsOption = true;
    }
  }


  // event method fired each time user clicks the next or previous button
  onChange(event: any) {
    if (this.prevIndex !== this.activeIndex) { // fires twice - hence need this activepnaelindex check
      const toPreviousWizard = this.prevIndex > this.activeIndex ? true : false;
      const toNextWizard = this.prevIndex < this.activeIndex ? true : false;

      if (toNextWizard) { // go forwards
        this.goToNextWizard();
      } else if (toPreviousWizard) { // go backwards
        this.goToPreviousWizard();
      }
    }
  }

  done() {

    this.store.select(fromCaseList.getInteraction).pipe(take(1)).subscribe((interaction: Interaction) => {
      if (interaction) {
        if (!this.oldInteraction || this.oldInteraction.interactionId != interaction.interactionId) {
          this.interviewWizardService.incrementCallCount(CallCountType.CallCount);
        }
      }
    });

    if (this.isCallBusyCount) {
      this.interviewWizardService.incrementCallCount(CallCountType.CallBusyCount);
    }
    if (this.isCallInterviewCount) {
        this.interviewWizardService.incrementCallCount(CallCountType.CallInterviewCount);
    }
    if (this.isCallScheduleCount) {
        this.interviewWizardService.incrementCallCount(CallCountType.CallScheduleCount);
    }
    if (this.isCallNaCount) {
        this.interviewWizardService.incrementCallCount(CallCountType.CallNACount);
    }
    if (this.activeIndex === InterviewWizardPanel.EndInterview) {
      const isCompleteInterviewLater = this.selectedEndInterviewOptionValue === 'later' ? true : false;
      this.interviewWizardService.CompleteInterview(isCompleteInterviewLater, this.shouldAutoSchedule);
    }
    this.disableDone = true;
    this.accordionIndex = -1;

    this.loadingSubject.next(true);
    this.caseDetailsService.saveCase(true);
    // because user clicked on DONE from teh interview wizard we need to send them back to unscheduled tab
    this.caseListService.setCaseListTabToReturnOnSave('Unscheduled');
  }


  // navigate forward
  goToPreviousWizard() {
    this.disableNext = false;
    this.disableDone = true;
    // resset the end interview selected options
    this.selectedEndInterviewOptionValue = 'NA';
    this.wizardNavigatedPathArray.pop();
    this.currentPathArrayPointer--;
    this.prevIndex = this.wizardNavigatedPathArray[this.currentPathArrayPointer];

    switch (this.prevIndex) {
      case InterviewWizardPanel.StartInterview: { // start interview
         // show dialer
        this.callsPlaced = this.interviewWizardService.getCallCount();
        this.lastCallDate = this.interviewWizardService.getLastCall();
        this.shouldAutoSchedule = false;
        this.disablePrev = true;
        break;
      }
      case InterviewWizardPanel.InterviewContact: {
        this.isCallInterviewCount = false;
        break;
      }
      case InterviewWizardPanel.ContactUnavailable: {
        if (this.selectedUnAvailableOptionValue.code === '01') {
          this.isCallScheduleCount = false;
        } else if (this.selectedUnAvailableOptionValue.code === '02') {
          this.isCallScheduleCount = false;
        } else if (this.selectedUnAvailableOptionValue.code === '03') {
          this.isCallInterviewCount = false;
        } else if (this.selectedUnAvailableNRPOptionValue.code === '02') {
          this.shouldAutoSchedule = false;
          this.isCallScheduleCount = false;
        } else if (this.selectedUnAvailableNRPOptionValue.code === '03') {
          this.shouldAutoSchedule = false;
          this.isCallInterviewCount = false;
        } else if (this.selectedUnAvailableNRPOptionValue.code === '04') {
          this.shouldAutoSchedule = false;
        }
        break;
      }
    }
    // move the user to the prev wizard by setting prev state to active index
    this.activeIndex   = this.prevIndex;
  }




  // navigate back
  goToNextWizard() {
    this.disablePrev = false;
    switch (this.prevIndex) {
      case InterviewWizardPanel.StartInterview: { // current page start interview

        if (this.selecteddialOptionValue === 'dial') {
          // show dialer
          this.interviewWizardService.ShowDialerDialog();
          this.activeIndex = InterviewWizardPanel.LocateRespondent;
          const elem = this.locateRespondentHtmlRef.nativeElement as HTMLElement;
          elem.focus();
        } else if (this.selecteddialOptionValue === 'no-dial') {
          if (this.isInterviewTypeNRP) {
            this.shouldAutoSchedule = true;
          }
          this.activeIndex = InterviewWizardPanel.EndInterview;
          this.endInterviewEleme.focus();
          this.disableNext = true;
          this.disablePrev = false;
        }
        break;
      }
      case InterviewWizardPanel.LocateRespondent: { // current page locate respondent next page to InterviewContact/ContactUnavailable/EndInterview
        this.prevIndex = this.activeIndex;
        if (this.selectedlocateRespondentCallOptionValue === 'speak') {
          this.disableNext = true;
          this.disablePrev = false;
          this.activeIndex = InterviewWizardPanel.InterviewContact;
        } else if (this.selectedlocateRespondentCallOptionValue === 'unAvailable') {
          this.activeIndex = InterviewWizardPanel.ContactUnavailable;
        } else if (this.selectedlocateRespondentCallOptionValue === 'badPhone') {
          this.activeIndex = InterviewWizardPanel.EndInterview;
          this.disableNext = true;
          this.disablePrev = false;
        }
        break;
      }
      case InterviewWizardPanel.ProbeProblems: {
        this.prevIndex = this.activeIndex;
        if (this.selectedProbeOptionValue === 'yes') {
          this.activeIndex = InterviewWizardPanel.SpecifyProblems;
        } else if (this.selectedProbeOptionValue === 'no') {
          this.activeIndex = InterviewWizardPanel.EndInterview;
          this.disableNext = true;
          this.disablePrev = false;
        } else {
            // show message no option selected
        }
        break;
      }
      case InterviewWizardPanel.InterviewContact: { // current page  interview contact next page to EndInterview/probe problems
        this.prevIndex = this.activeIndex;
        this.isCallInterviewCount = true;
        this.interviewWizardService.setCaseCallResult(this.SelectedCallResultOption.code);
        if (this.isInterviewTypeNRP || this.isInterviewTypeER) {
          this.activeIndex = InterviewWizardPanel.EndInterview;
          this.disableNext = true;
          this.disablePrev = false;
        } else {
          this.activeIndex = InterviewWizardPanel.ProbeProblems;
        }
        break;
      }
      case InterviewWizardPanel.ContactUnavailable: { // current page contactAvailable next page end interview
        this.prevIndex = this.activeIndex;
        if ((this.selectedUnAvailableOptionValue != null && this.selectedUnAvailableOptionValue.code === '01') ||
            (this.selectedUnAvailableNRPOptionValue != null && this.selectedUnAvailableNRPOptionValue.code === '01')) {
            // show dialer
            this.interviewWizardService.ShowSchedulerDialog();
            this.interviewWizardService.setCaseCallResult('007');
            this.isCallScheduleCount = true;
        } else if (this.selectedUnAvailableOptionValue != null &&
            (this.selectedUnAvailableOptionValue.code === '02' || this.selectedUnAvailableOptionValue.code === '03')) {
              this.isCallScheduleCount = true;
              if (this.selectedUnAvailableOptionValue.code === '02') {
                this.interviewWizardService.setCaseCallResult('090');
              } else if (this.selectedUnAvailableOptionValue.code === '03') {
                this.interviewWizardService.setCaseCallResult('004');
              }
        } else if (this.selectedUnAvailableNRPOptionValue != null &&
          (this.selectedUnAvailableNRPOptionValue.code === '02' || this.selectedUnAvailableNRPOptionValue.code === '03' || this.selectedUnAvailableNRPOptionValue.code === '04')) {
            if (this.isInterviewTypeNRP) {
              this.shouldAutoSchedule = true;
            }
            if (this.selectedUnAvailableNRPOptionValue.code === '02') {
              this.isCallScheduleCount = true;
              this.interviewWizardService.setCaseCallResult('090');
            } else if (this.selectedUnAvailableNRPOptionValue.code === '03') {
              this.isCallScheduleCount = true;
              this.interviewWizardService.setCaseCallResult('004');
            }
        }
        this.activeIndex = InterviewWizardPanel.EndInterview;
        this.disableNext = true;
        this.disablePrev = false;

        break;
      }

    }
    this.prevIndex = this.activeIndex;

    // add the next wizard index to the path array
    this.wizardNavigatedPathArray.push(this.activeIndex);
    this.currentPathArrayPointer++;

    // if (this.activeIndex === InterviewWizardPanel.EndInterview || InterviewWizardPanel.InterviewContact) {
    //   this.disableNext = true;
    // } else {
    //   this.disableNext = false;
    // }
  }

  onCallOptionsClick() {

  }

  onEndOptionsClick() {
    // enable done button once user selects the option
    this.disableDone = false;
  }


  onDialOptionsClick() {

  }

  returnToCaseList(): void {
    let currentCaseListUser: string = '';
    this.caseListSub = this.store.select(fromCaseList.getCaseListState).pipe(take(1)).subscribe(caseListState => {
      currentCaseListUser = caseListState.userId;

    });
    this.router.navigate(['/case-list', currentCaseListUser]);
  }

}



