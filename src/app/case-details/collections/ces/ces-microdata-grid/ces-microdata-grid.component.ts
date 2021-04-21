import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef,  AfterContentChecked, AfterViewChecked, HostListener } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject, of, Subject, Subscription, pipe, throwError, EMPTY } from 'rxjs';
import { CollectionsCesMicroData, MicroDataCellContextError, CollectionsCesMicroDataDto, CollectionsMutliPayMicroDataGroup, CollectionsCesMultiPayMicroData } from 'src/app/shared/models/collections-microdata.model';
import { MicrodataService } from '../../../services/microdata.service';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { CollectionsUnit, Collections } from '../../models/collection-unit.model';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { UnitService } from '../../../services/unit.service';
import { LookupService } from 'src/app/core/services/lookup.service';
import bankersRounding from 'bankers-rounding';
import * as _ from 'lodash';
import { ExplCode, Lopp } from 'src/app/shared/models/expl-code.model';
// import { RespCode } from 'src/app/shared/models/resp-code.model';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { CollectionsService } from '../../../services/collections.service';
import { HttpParams } from '@angular/common/http';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { Message } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { MicroDataCellObject, MicroDataStaticData, RespCode } from '../../models/microdata-cell-object.model';
import { ScreeningParameters } from 'src/app/shared/models/screening-parameters-dto.model';
import * as moment from 'moment';
import { CaseDetailsService } from 'src/app/case-details/services/case-details.service';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';
import { RolloverService } from 'src/app/case-details/services/rollover.service';
import { InterviewWizardService } from 'src/app/case-details/services/interview-wizard.service';
import { TcwNotesService } from 'src/app/core/services/tcw-notes.service';

@Component({
  selector: 'fsms-tcw-ces-microdata-grid',
  templateUrl: './ces-microdata-grid.component.html',
  styleUrls: ['./ces-microdata-grid.component.css']
})
export class CesMicrodataGridComponent implements AfterViewChecked, AfterContentChecked, AfterViewInit, OnInit, OnDestroy {

  @ViewChild('notesToolBarBtn', null) toolbarNotesBtn: ElementRef;

  @ViewChild('pwCell', { read: ElementRef, static: false }) pwCell: ElementRef;
  @ViewChild('wwCell', { read: ElementRef, static: false }) wwCell: ElementRef;
  @ViewChild('aeprCell', { read: ElementRef, static: false }) aeprCell: ElementRef;
  @ViewChild('pwprCell', { read: ElementRef, static: false }) pwprCell: ElementRef;
  @ViewChild('aecmCell', { read: ElementRef, static: false }) aecmCell: ElementRef;
  @ViewChild('pwcmCell', { read: ElementRef, static: false }) pwcmCell: ElementRef;
  @ViewChild('aehrCell', { read: ElementRef, static: false }) aehrCell: ElementRef;
  @ViewChild('pwhrCell', { read: ElementRef, static: false }) pwhrCell: ElementRef;
  @ViewChild('aeotCell', { read: ElementRef, static: false }) aeotCell: ElementRef;
  @ViewChild('pwotCell', { read: ElementRef, static: false }) pwotCell: ElementRef;

  currentaSelectedDataEntryCellAccessbilityName = '';
  currentSelectedDataEntryValueForAccessbility = '';

  // this is just to disable data entry in microratio cells
  disablekeyentry = new RegExp('^A-Za-z0-9');
  // disablekeyentry = new RegExp('^\d');

  // TO SET FOCUS ON FIRRST DATA ENTRY CELL AE-EMP
  @ViewChild('beginCollectionFocusElement', { read: ElementRef, static: false }) beginCollectionFocusElement: ElementRef;



  // static hard coded information
  notifications: Message[] = [];
  selectedIndex = 1;

  AWHselectedError = false;
  AHEselectedError = false;
  WWAEselectedError = false;
  PWAEselectedError = false;
  PWAHEselectedError = false;
  PWAWHselectedError = false;
  PWAOTselectedError = false;
  AOTselectedError = false;
  PWAWEselectedError = false;

  hasMicroRatioGridUpdated = false;
  onInit = false;

  // non-observable backing pattern - This is just non-observable version of an observable to act as a backing variable
  // when you need to do some local changes and update teh observable
  cesMicroDataAePwRows: CollectionsCesMicroData[] = null;
  rowGroupMetaData: any;

  cesMultiPayMicroDataAePwRows: CollectionsCesMultiPayMicroData[];
  rowGroupMetaMultiPayData: any;

  selectedScreeningParams$: Observable<ScreeningParameters> = this.collectionService.selectedScreeningParams$;
  showMicroDataGridOnGoodDC$: Observable<boolean> = this.collectionService.showMicroDataGridOnGoodDC$;

  showScreeningParamsBtn$: Observable<boolean>;

  datagridLoading = false;

  ldbErrorAcceptBtnDisabled = true;

  showInterviewWizard = false;

  disablePlpClpOptions = false;


    // observable for microdata list that is bound to UI
  //   cesMicroData$: Observable<CollectionsCesMicroData[]> = this.collectionService.CollectionMicroData$
  //   .pipe(
  //       map((cesmicroData: CollectionsCesMicroData[]) => {
  //         console.log('splitting rows');

  //         // if there is an udpate to PLP values in collections
  //         // notify and udpate the vaues in notes compoennet.
  //         this.updateNotesPLopp(cesmicroData);

  //         // proceed with viewdata model mapping
  //         // split each microrow to AE and PW rows to match the new design of the grid - UI
  //         const aePwcesmicroData = this.splitMicroRows(cesmicroData);
  //         this.datagridLoading = false;
  //         // finall also set the seelcted screening aprameters
  //         // this.selectedScreeningParams = unit.ScreeningParameters;
  //         return aePwcesmicroData;
  //       }),
  //       catchError((err: TcwError) => {
  //         return throwError(err);
  //       })
  // );


   // observable for microdata list that is bound to UI
   cesMicroData$: Subscription = this.collectionService.CollectionMicroData$
   .subscribe(cesmicroData => {
         // proceed with viewdata model mapping

         // get collection month microdata
         const collectionMonthMicrodata = this.collectionService.getCollectionMonthMicroData(cesmicroData);

         if (collectionMonthMicrodata != null && !this.collectionService.isCurrentUnitMultiPay()) {
           // update the notes service with latest PrLopps
           this.tcwNotesService.setPrlpForNotesFromCollections(collectionMonthMicrodata.PayFrequency, null, null);
         }
         // split each microrow to AE and PW rows to match the new design of the grid - UI
         cesmicroData = this.splitMicroRows(cesmicroData);

         const scheduledType = this.collectionService.getCurrentUnitSchedType();

         // setting correct transcript texts for non-supervisory rows based on sched_type
         this.setTranscriptsListAndErrorTranscriptsListByScheduleType(scheduledType);

         this.datagridLoading = false;

   });


  /* bindable observable data */
  errorMessage$: Observable<string>;


  // create action stream for onleave microdata cell event to calculate the averages
  calculateMicroRatioValueSubject = new Subject<MicroDataCellObject>();
  calculateMicroRatioValue$ = this.calculateMicroRatioValueSubject.asObservable();

  showRollOVerDialog$ = this.uiConfigService.showRollOver$;
  showRollOverDialog: boolean;
  selectedCaseUnits: CollectionsUnit[];

  // observable responsible for disable/enamble typing in input text
  noCharInputRegExOnMultiPay$: Observable<RegExp | string> = this.collectionService.noCharInputRegExOnMultiPay$.
    pipe(
      map((pattern: string) => {
        if (pattern === 'pint') {
          this.disablePlpClpOptions = false;
          return pattern;
        } else { // its multipay - so remvoe the ability to edit on main collection page
          this.disablePlpClpOptions = true;
          return new RegExp(pattern);
        }
      })
    );

  // to show LDB error dialog
  canShowLdbError$: Observable<boolean> = this.collectionService.hasLdbError$;
  // to show notice text on Ae LDB error dialog
  canShowLdbErrorNoticeText$: Observable<boolean> = this.collectionService.onLdbErrorIsUnitNAICSValid$;


  // create observable stream for setting focus on each collection cell - pass cellName
  setFocusOnCollectionCellSubject = new Subject<string>();
  setFocusOnCollectionCell$ = this.setFocusOnCollectionCellSubject.asObservable();


  onRectifySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  onRectify$: Observable<boolean> = this.onRectifySubject.asObservable();

  // action stream for onfcous
  ratioCellActionSubject = new BehaviorSubject<MicroDataCellObject>(new MicroDataCellObject(''));
  ratioCellFocusAction$ = this.ratioCellActionSubject.asObservable();

  // action stream for onfcous
  actionSubject = new BehaviorSubject<MicroDataCellObject>(new MicroDataCellObject(''));
  focusAction$ = this.actionSubject.asObservable();

  // set the total count of the units
  unitsCount$ = this.unitService.unitsCount$;

  // filter and get text from the transscripts array by current cell id on focus
  interviewTranscripts: Map<string, string> = this.lookupService.getInterviewScripts(true);
  interviewTranscriptText$: Observable<any>;

  // by this time cesMicrodata already got the values. Get all error dictionaries
  cesInterviewErrorLookupScripts = this.lookupService.getInterviewErrorScripts(true);
  cesScreeningLookupScripts = this.lookupService.getScreeningErrorScripts(true);

  // use rxjs operators to find errors
  errorTranscript$ = this.focusAction$.pipe(
    map((cellValue) => {
      console.log('fired error transcripts - ' + JSON.stringify(cellValue));

      // set the accessbility text for each cell on focus
      this.currentaSelectedDataEntryCellAccessbilityName = cellValue != null ? cellValue.cellNameForAccessibility : '';
      this.currentSelectedDataEntryValueForAccessbility = cellValue.cellValue ? cellValue.cellValue : 'None';

      if (cellValue.month != null || cellValue.year != null) {
        // set state for mm/yy current user selected row for multipay page building
        this.collectionService.currentUserSelectedMicroRowMonth = cellValue.month;
        this.collectionService.currentUserSelectedMicroRowYear = cellValue.year;
        this.collectionService.MultiPayHeaderTextRC = this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year).ResponseCode.code;
      }

      // determine the interview error script first
      if (!cellValue.IsRatioCell) {
        if (cellValue.rowType != null) {
          this.showScreeningParamsBtn$ = of(false);
          this.interviewTranscriptText$ = of(this.interviewTranscripts.get(cellValue.cellName).replace('{0}', moment(cellValue.month, 'MM').format('MMMM')));
        }
      }

      // user focused on the ratio cell - show ratio errors if any
      if (cellValue.IsRatioCell) {
        if (this.cesMicroDataAePwRows != null && this.cesMicroDataAePwRows.length > 0) {
          if (this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year).MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios()) {
            const errorList = this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year).CesScreeningErrorScripts;
            console.log('error list ' + JSON.stringify(errorList));
            if (errorList != null && errorList.size > 0) {
              // get the original error script
              const errorText = this.cesScreeningLookupScripts.get(errorList.get(cellValue.cellName));
              if (errorText != null) {
                this.showScreeningParamsBtn$ = of(true);
                this.setScreeningErrorFlag(cellValue.cellName);
                // replace neccessary string values in the error scripts
                const formattedError = errorText.replace('{0}', cellValue.cellValue);
                // now add the screening parameter value at the end by xtracting the alast bit of text from the wrror list
                // we need to extract the text that is stored using the key of format 'cellName-ScreenValue'
                const key = `${cellValue.cellName}-ScreenValue`;
                return `${formattedError} ${errorList.get(key)}`;
              } else {
                this.showScreeningParamsBtn$ = of(false);
                return 'No Errors found.';
              }
            } else {
              this.showScreeningParamsBtn$ = of(false);
              return 'No Errors found.';
            }
          } else if (this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year).MicroDataRatioOtmContextError.hasOtmErrors()) {
            const errorList = this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year).CesOtmScreeningErrorScripts;
            console.log('error list ' + JSON.stringify(errorList));
            if (errorList != null && errorList.size > 0) {
              // get the original error script from the error array
              const errorText = this.cesScreeningLookupScripts.get(errorList.get(cellValue.cellName));
              if (errorText != null) {
                this.showScreeningParamsBtn$ = of(true);
                this.setScreeningErrorFlag(cellValue.cellName);


                // we need to extract the prev month value that is stored using the key of format '[cellName]-PrevValue'
                // in error array as well.
                const key = `${cellValue.cellName}-PrevValue`;
                // replace the {0} place holder in the error text with corresspnding prev month value
                const formattedError = errorText.replace('{0}', errorList.get(key));

                // now replace the {1} placeholder in the error text with the current month's value.
                // basically we want an error text soemething like this for OTM - e.g: ...value changed from {0} to {1} [where {0} is prev month and {1} current month]
                return formattedError.replace('{1}', cellValue.cellValue);

              } else {
                this.showScreeningParamsBtn$ = of(false);
                return 'No Errors found.';
              }
            } else {
              this.showScreeningParamsBtn$ = of(false);
              return 'No Errors found.';
            }
          } else {
            this.showScreeningParamsBtn$ = of(false);
            return 'No Errors found.';
          }

        }
      } else { // user focused on entry cell - show edit errors if any
        if (this.cesMicroDataAePwRows != null && this.cesMicroDataAePwRows.length > 0 && cellValue.rowType != null) {
          const microRow = this.cesMicroDataAePwRows.find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year && a.RowType === cellValue.rowType);
          // show edit errors
          if (microRow.MicroDataCellContextError.hasEditErrors()) {
            const errorList = microRow.CesInterviewErrorScripts;
            console.log('error list ' + JSON.stringify(errorList));
            if (errorList != null && errorList.size > 0) {
              // return errorList.get(cellValue.cellName);
              return this.cesInterviewErrorLookupScripts.get(errorList.get(cellValue.cellName));
            } else {
              console.log(document.activeElement);
              return 'No Errors found.';
            }
          } else if (microRow.MicroDataRatioOtmContextError.hasOtmErrors() || microRow.MicroDataRatioOtmContextError.hasLdbCheckError()) {
            const errorList = microRow.CesOtmScreeningErrorScripts;
            console.log('error list ' + JSON.stringify(errorList));
            if (errorList != null && errorList.size > 0) {
              // return errorList.get(cellValue.cellName);
              let errorText = this.cesScreeningLookupScripts.get(errorList.get(cellValue.cellName));
              // if this is a Ldb error then we need little more work to do in formatting
              if (errorText != null && microRow.MicroDataRatioOtmContextError.hasLdbCheckError()) {
                const aeLdbYearAgo = this.collectionService.getAeLdbYearAgo() != null ? this.collectionService.getAeLdbYearAgo().toString() : null;
                errorText = errorText.replace('{0}', aeLdbYearAgo);
                errorText = errorText.replace('{1}', cellValue.cellValue);
              }
              if (errorText != null) {

                this.showScreeningParamsBtn$ = of(true);
                return errorText;
              } else {
                console.log(document.activeElement);
                this.showScreeningParamsBtn$ = of(false);
                return 'No Errors found.';
              }
            }
          } else {
            console.log(document.activeElement);
            this.showScreeningParamsBtn$ = of(false);
            return 'No Errors found.';
          }
        }
      }
      console.log(document.activeElement);
      return 'No Errors found.';
    })
  );

  /* end of observables */


  /* get all columns array from static constant class */
  scrollableCols = MicroDataStaticData.cesScrollableCols;

  oldMicroDataCellValue: string | number = null;
  aeLdbErrorMicroRow: CollectionsCesMicroData = null;

  transcriptTextStyle = 'tcw-collection-transcript';

  // loading explanations for ldb check errors
  explanationLdbCheck: ExplCode[] = this.lookupService.getAeLdbExplanationCode(true);
  _selectedExplanationLdbCheck: ExplCode;
  get SelectedExplanationLdbCheck(): ExplCode {
    return this._selectedExplanationLdbCheck;
  }
  set SelectedExplanationLdbCheck(value: ExplCode) {
    this._selectedExplanationLdbCheck = value;
    if (value != null && value.code !== '') {
      this.ldbErrorAcceptBtnDisabled = false;
    }
  }

  SetFocusOnCollectionCell: string;

  // loading Explanation code for microgrid drop downs
  explanationCodeOptions: ExplCode[] = this.unitService.getExplanationCodeForCollections(true);
  explanationCodeOptions2: ExplCode[] = this.explanationCodeOptions.filter(item => item.code !== '88').filter(item => item.code !== '89');
  selectedExplanationCode: ExplCode;
  selectedExplanationCode2: ExplCode;
  // loading response codes
  respCodeOptions = this.lookupService.getRespCode(true);
  selectedRespCode: RespCode;
  // Lopp options
  loppOptions = this.lookupService.getLOPP(true);
  selectedPLopp1: Lopp; // for PLP column value
  selectedPLopp2: Lopp; // for CLP column value
  /* end of static data */



  constructor(private microdataService: MicrodataService,
    private uiConfigService: UIConfigService,
    private collectionService: CollectionsService,
    private interviewWizardService: InterviewWizardService,
    private rolloverService: RolloverService,
    // tslint:disable-next-line: deprecation
    private tcwSaveAllService: TcwSaveAllService,
    private lookupService: LookupService,
    private unitService: UnitService,
    private cdref: ChangeDetectorRef,
    private tcwHttpService: TcwHttpService,
    private tcwNotesService: TcwNotesService,
    private messageService: MessageService) {
    this.selectedExplanationCode = new ExplCode();
    this.selectedExplanationCode2 = new ExplCode();
    this.selectedPLopp1 = new Lopp();
    this.selectedPLopp2 = new Lopp();
    this.selectedRespCode = new RespCode();
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
    this.setCollectionCellFocus(this.SetFocusOnCollectionCell);
  }

  onRollOverCancel() {
    // close the dialog
    this.uiConfigService.ToggleRollOverDialog(false);
    this.rolloverService.cancelRolloverAndReset();
  }

  onStartRollover() {
    this.rolloverService.onStartRollover();
  }

  // Prasad - MEthod is used primarily to set the focus on the dialog.
  // Feel free to use this mentod to set any additional initialization if needed.
  setRolloverFocus() {
    this.rolloverService.onRolloverDialogInit();
  }


  updateNotesPLopp(cesmicroData: CollectionsCesMicroData[]) {
    // get collection month microdata
    const collectionMonthMicrodata = this.collectionService.getCollectionMonthMicroData(cesmicroData);
    if (collectionMonthMicrodata != null && !this.collectionService.isCurrentUnitMultiPay()) {
      // update the notes service with latest PrLopps
      this.tcwNotesService.setPrlpForNotesFromCollections(collectionMonthMicrodata.PayFrequency, null, null);
    }
  }

  rectifyLdbErrorForAE() {
    this.collectionService.toggleAeLdbError(false);
  }

  acceptLdbRcValueAndReturnToCollectionGrid() {
    if (this._selectedExplanationLdbCheck != null) {
      this.collectionService.setAeLdbErrorSkip(this._selectedExplanationLdbCheck);
    }
  }



  // Prasad - this is click event handler from the notes button on the AE LDB check screening error popup
  // This breaks UX design - cannot open popup on top of another popup - but this is how its set in old system.
  openNotes() {
    // dirtier and ugly coding pattern but easier and quicker - given time constraint
    const toolbarNotesButton = (document.getElementById('notesToolBarBtn') as HTMLInputElement);
    toolbarNotesButton.click();
  }


  ngAfterViewInit() {
    setTimeout(()=>{ // this will make the execution after the above boolean has changed
      // set the focus on teh ae-cell
     const cellElement = document.getElementById("aeCell0");
     if(cellElement) {
       cellElement.focus();
     }
    },0);
    // Prasad - subscribe to the observable that will pass the cell name that
    // needs focusing.
    this.setFocusOnCollectionCell$
      .subscribe(setFocusOnCollectionCell => {
        this.SetFocusOnCollectionCell = setFocusOnCollectionCell;
        this.setCollectionCellFocus(this.SetFocusOnCollectionCell);
      });
  }


  // Prasad - We need to set manual focus AGAIN
  // in the ngAfterViewChecked hook (right after diong the same thing in the setFocusOnCollectionCell$
  // subscription. The reason being - the Angular's ChangeDetection cycle and
  // the reason why it causes ExpressionChangedAfterItHasBeenCheckedError  error
  ngAfterViewChecked() {
      this.setCollectionCellFocus(this.SetFocusOnCollectionCell);
  }

  setCollectionCellFocus(cellName) {
    //Allan - exit if notes displayed
    if (cellName && !(this.uiConfigService.IsNotesDisplayed)) {
      const cellElement = document.getElementById(cellName);
      if(cellElement != null) {
        cellElement.focus();
      }
    }
  }

  setCollectionCellFocus1(cellName) {
    let elem: HTMLElement = null;
    switch (cellName) {
      case 'wwCell': {
        elem = this.wwCell.nativeElement as HTMLElement;
        break;
      }
      case 'aeprCell': {
        elem = this.aeprCell.nativeElement as HTMLElement;
        break;
      }
      case 'aecmCell': {
        elem = this.aecmCell.nativeElement as HTMLElement;
        break;
      }
      case 'aehrCell': {
        elem = this.aehrCell.nativeElement as HTMLElement;
        break;
      }
      case 'pwCell': {
        elem = this.pwCell.nativeElement as HTMLElement;
        break;
      }
      case 'pwprCell': {
        elem = this.pwprCell.nativeElement as HTMLElement;
        break;
      }
      case 'pwcmCell': {
        elem = this.pwcmCell.nativeElement as HTMLElement;
        break;
      }
      case 'pwhrCell': {
        elem = this.pwhrCell.nativeElement as HTMLElement;
        break;
      }
    }

    if (elem != null) {
      elem.focus();
    }
  }

  ngOnDestroy(): void {
    this.cesMicroDataAePwRows = null;
    this.cesMicroData$.unsubscribe();
    // this.collectionService.onDestroy();
    this.unitService.onDestroy();

  }


  ngOnInit() {
    console.log('init of grid component');
    this.interviewWizardService.getCurrentSelectedCase();
    // set if interview wizards needs to show
    this.showInterviewWizard = this.interviewWizardService.showInterviewWizard();

    // hide rollover dialog when page loads
    this.uiConfigService.ToggleRollOverDialog(false);
    this.rolloverService.onInitializeRolloverPage();

    // subscribe to observable that determines when rollover should be shown
    this.showRollOVerDialog$.subscribe(c => {
      this.showRollOverDialog = c;
    });



    this.onInit = true;
    this.cesMicroDataAePwRows = null;
  }

  setTranscriptsListAndErrorTranscriptsListByScheduleType(scheduledType: string) {
    // get teh sched_type for the unit.

    if(scheduledType != null) {
      // do transformations to the interview transcripts based on the scheduled types
      this.interviewTranscripts = _.cloneDeep(this.lookupService.getInterviewScripts(true));
      this.transformTranscriptsForScheduleTypes(scheduledType, this.interviewTranscripts);

      // do transformations to the interview Error transcripts based on the scheduled types
      this.cesInterviewErrorLookupScripts =  _.cloneDeep(this.lookupService.getInterviewErrorScripts(true));
      this.transformTranscriptsForScheduleTypes(scheduledType, this.cesInterviewErrorLookupScripts);
    }
  }


  // method to transform 'non-supervisory' text to respective text for each schedule type
  transformTranscriptsForScheduleTypes(scheduleType: string, transcriptMaps: Map<string, string>) {
    let indx: number = 0;
    this.interviewTranscripts.forEach((value, key, map) => {
      let transcripts = value != null ? value : null;
      if(transcripts != null) {
        if(scheduleType === 'B') {
          transcripts = transcripts.replace('non-supervisory', 'construction');
          map.set(key, transcripts);
        }
        if(scheduleType === 'S') {
          transcripts = transcripts.replace('non-supervisory', 'faculty');
          map.set(key, transcripts);
        }
        if(scheduleType === 'G') {
          transcripts = transcripts.replace('non-supervisory', 'public administration');
          map.set(key, transcripts);
        }
      }
    });
  }

  // this sets the loading spinner for data grid
  setOnLoading(isLoading) {
    this.datagridLoading = isLoading;
  }


  onValueChanged(value: number) {
    // Prasad - not a good standardized code
    // tried proper ways to avoid - Principle of least surprise.
    // COde coule be improved here -but this works!!!!
    if (value === -1) {
      this.selectedIndex = 1;
    } else {
      this.selectedIndex = value + 1;
    }
  }



  setExplanationCodeValues(selectedEmployementValue: ExplCode, microRowEmployementShift: ExplCode) {
    if(selectedEmployementValue != null) {
      microRowEmployementShift.code = selectedEmployementValue.code;
      microRowEmployementShift.text = selectedEmployementValue.text;
    } else {
      microRowEmployementShift.code = null; // set it to null so collection grid can perform proper calcualtions
    }
  }


  // user event changing CC1 to override screening errors
  onExplanationComment1Changed(cellObject: MicroDataCellObject) {
    console.log('on change ' + JSON.stringify(cellObject));
    const currentEditedAeMicroRow = this.cesMicroDataAePwRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year && a.RowType === 'AE');
    const indexOfAeRow = this.cesMicroDataAePwRows.indexOf(currentEditedAeMicroRow, 0);
    const currentEditedPwMicroRow = this.cesMicroDataAePwRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year && a.RowType === 'PW');
    const indexOfPwRow = this.cesMicroDataAePwRows.indexOf(currentEditedPwMicroRow, 0);


    // merge AE and PW adn process the single mciro row
    const currentEditedMicroRow = this.mergeMicroRows(currentEditedAeMicroRow, currentEditedPwMicroRow);

    // set user       selected CC1 value approriately (because of tabbing feature we need this code)
    // extract the code from teh cellValue (the first 2 digits). E.g "01 - Seasonal Reasoning"
    if(cellObject.cellName === "CC1") {
      const selectedExplnationToClearErrors = this.explanationCodeOptions.find(a => a.code ===  currentEditedMicroRow.EmployementShift1.text.substring(0,2));
      this.setExplanationCodeValues(selectedExplnationToClearErrors, currentEditedMicroRow.EmployementShift1);

    } else {
      const selectedExplnationToClearErrors = this.explanationCodeOptions.find(a => a.code ===  currentEditedMicroRow.EmployementShift2.text.substring(0,2));
      this.setExplanationCodeValues(selectedExplnationToClearErrors, currentEditedMicroRow.EmployementShift2);
    }


    // you cannot use CC1 or comments to clear the Edit errors. It applies only for screening errors
    if (!currentEditedAeMicroRow.MicroDataCellContextError.hasEditErrors()) {
      // when a secondary comment is selected, we just want to set tha value ot the main list and just return.
      // users must have already chosen a comment 1.
      if (currentEditedMicroRow.EmployementShift2 != null && currentEditedMicroRow.EmployementShift2.code != null) {
        this.collectionService.clearScreeningErrors(currentEditedMicroRow);
        return;
      }

      if (currentEditedMicroRow.EmployementShift1 != null && currentEditedMicroRow.EmployementShift1.code != null) {
             console.log('clearing' + JSON.stringify(currentEditedMicroRow.EmployementShift1));
        // call the service to remove all errrors and set RC 90
        this.collectionService.clearScreeningErrors(currentEditedMicroRow);
      } else {
        // console.log('trying to remove the expl code and return edit errors');
        console.log('not clearing' + JSON.stringify(currentEditedMicroRow.EmployementShift1));
        // user is trying to remove the explanation code - so rerun the screening checks to bring back the errors if any
        this.collectionService.processCurrentEditedMicroDataRow(currentEditedMicroRow);
      }
      if (cellObject.nextCellName != null) {
        this.setFocusOnCollectionCellSubject.next(cellObject.nextCellName + cellObject.rowNumber);
      }
    }
  }

  onCollectionCellTab(cellObject: MicroDataCellObject) {
    console.log(JSON.stringify(cellObject));
    if (cellObject.nextCellName != null) {
      this.setFocusOnCollectionCellSubject.next(cellObject.nextCellName + cellObject.rowNumber);
    }
  }

  onCollectionDataChanged() {
    this.tcwSaveAllService.setCollectionDataDirty(true);
  }

  // method event to fire - on leave of cell when editing microdata values
  updateMicroRatios(cellObject: MicroDataCellObject) {
    console.log('updateMicroRatios fired with ' + JSON.stringify(cellObject));
    if (cellObject != null) {
      // check if need to set dirty flag
      if (this.oldMicroDataCellValue !== cellObject.cellValue) {
        this.onCollectionDataChanged();
        this.oldMicroDataCellValue = cellObject.cellValue;
      }

      // conitnue with processing rows
      const currentEditedAeMicroRow = this.cesMicroDataAePwRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year && a.RowType === 'AE');
      const indexOfAeRow = this.cesMicroDataAePwRows.indexOf(currentEditedAeMicroRow, 0);
      const currentEditedPwMicroRow = this.cesMicroDataAePwRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year && a.RowType === 'PW');
      const indexOfPwRow = this.cesMicroDataAePwRows.indexOf(currentEditedPwMicroRow, 0);

      // merge AE and PW adn process the single mciro row
      const currentEditedMicroRow = this.mergeMicroRows(currentEditedAeMicroRow, currentEditedPwMicroRow);

      if(cellObject.cellName === 'RC') {
        const code = currentEditedMicroRow.ResponseCode.text.substring(0,2);
        currentEditedMicroRow.ResponseCode = this.respCodeOptions.find(a => a.code === code);
        this.respCodeOptions = this.lookupService.getRespCode(true);
        console.log('set rc ' + JSON.stringify(currentEditedMicroRow.ResponseCode));
      }
      if(cellObject.cellName === 'AE-PLP') {
        const code = currentEditedMicroRow.PayFrequency.text.substring(0,1);
        currentEditedMicroRow.PayFrequency.code = code;
        this.loppOptions = this.lookupService.getLOPP(true);
      } if(cellObject.cellName === 'AE-CLP') {
        const code = currentEditedMicroRow.CommisionPayFrequncy.text.substring(0,1);
        currentEditedMicroRow.CommisionPayFrequncy.code = code;
        this.loppOptions = this.lookupService.getLOPP(true);
      }


      // setting current edited row to ae ldberror variable - in the event there is an ldb error we know wich row
      this.aeLdbErrorMicroRow = currentEditedAeMicroRow;

      // call the service to process the edit checks/screenings and let service send the data back as observable
      this.collectionService.processCurrentEditedMicroDataRow(currentEditedMicroRow);

      if (cellObject.nextCellName != null) {
        this.setFocusOnCollectionCellSubject.next(cellObject.nextCellName + cellObject.rowNumber);
      }
    }
  }


  onFocus(focusValue: MicroDataCellObject) {
    console.log('onFocus fired with ' + JSON.stringify(focusValue));
    // emit a value to the action stream when onfocus happens - for error scripts or transcripts
    this.actionSubject.next(focusValue);
  }


  // fetches micro data for unit
  getMicroData(unit: CollectionsUnit): Observable<CollectionsCesMicroData[]> {
    let microdataRows: CollectionsCesMicroData[] = [];
    if (unit == null) {
      return of(microdataRows);
    } else {
      let data: CollectionsCesMicroData[] = [];
      // check for ullable unit
      // check if microdata list already available in service - if not make an http call
      const selectedUnit = this.collectionService.collectionUnitListVm.find(a => a.UnitId === unit.UnitId);
      if (selectedUnit.CesMicroData != null && selectedUnit.CesMicroData.length > 0) {
        console.log('getMicroData - returning from cache - Unit: ' + unit.UnitId);
        data = this.splitMicroRows(unit.CesMicroData);
        this.showErrorNotificationIfErrors(data);
        // finall also set the seelcted screening aprameters
        // this.selectedScreeningParams = unit.ScreeningParameters;
        return of(data);
      } else {
        const params = new HttpParams().set('stateCode', unit.StateCode).set('reptNum', unit.ReportNum);
        console.log('getMicroData - returning from server - Unit: ' + unit.UnitId);
        return this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params).pipe(
          // tap(c => console.log(JSON.stringify(c))),
          map((result: CollectionsCesMicroDataDto[]) => {
            // split each microrow to AE and PW rows for the new design grid
            data = this.splitMicroRows(microdataRows);
            this.showErrorNotificationIfErrors(data);
            // finall also set the seelcted screening aprameters
            // this.selectedScreeningParams = unit.ScreeningParameters;
            return data;
          }),
          catchError((err: TcwError) => {
            return throwError(err);
          })
        );
      }
    }




  }


  // splits each micro row into 2 rows one for AE row and one for PW row so binding to Primeng is possible
  splitMicroRows(data: CollectionsCesMicroData[]): CollectionsCesMicroData[] {
    const mappedMicroData: CollectionsCesMicroData[] = [];
    console.log('splitMicroRows ENTRY --- ' + JSON.stringify(this.cesMicroDataAePwRows));
    if (data != null) {
      if (this.cesMicroDataAePwRows != null) {
        // this.cesMicroDataAePwRows.splice(0, this.cesMicroDataAePwRows.length);
      } else {
        // this.cesMicroDataAePwRows = [];
      }
      try {
        if (this.cesMicroDataAePwRows != null && this.cesMicroDataAePwRows.length > 0 && !this.collectionService.IsUnitSwitching) {
          // split each micro entryrow into 2 rows - AE row and PW row - so we can bind to Primeng grid structure for new layout
          data.forEach(eachRow => {
            const aeRow = { ...eachRow, RowType: 'AE', cesMultiPay: eachRow.CesMultiPay, MicroDataCellContextError: eachRow.MicroDataCellContextError };
            const pwRow = { ...eachRow, RowType: 'PW', cesMultiPay: eachRow.CesMultiPay, MicroDataCellContextError: eachRow.MicroDataCellContextError };

            let aerow = this.cesMicroDataAePwRows.find(a => a.RefYY === eachRow.RefYY && a.RefMM === eachRow.RefMM && a.RowType === 'AE');
            // console.log('each row- section for month ' + eachRow.RefMM + '/' + eachRow.RefYY + ' ~~~~~~~~~'  + JSON.stringify(aerow));



            aerow.TotalWorkers = eachRow.TotalWorkers;
            aerow.TotalWomenWorkers = eachRow.TotalWomenWorkers;
            aerow.TotalWorkerPayrolls = eachRow.TotalWorkerPayrolls;
            aerow.TotalCommisions = eachRow.TotalCommisions;
            aerow.TotalWorkerHours = eachRow.TotalWorkerHours;
            aerow.TotalOvertime = eachRow.TotalOvertime;
            aerow.EmployementShift1 = eachRow.EmployementShift1;
            aerow.EmployementShift2 = eachRow.EmployementShift2;
            aerow.PayFrequency = eachRow.PayFrequency;
            aerow.CommisionPayFrequncy = eachRow.CommisionPayFrequncy;
            aerow.ResponseCode = eachRow.ResponseCode;


            aerow.DisallowPwRowDataCollection = eachRow.DisallowPwRowDataCollection;
            aerow.DisallowAeRowDataCollection = eachRow.DisallowAeRowDataCollection;
            aerow.DisallowPwCellDataCollection = eachRow.DisallowPwCellDataCollection;
            aerow.DisallowPwOTDataCollection = eachRow.DisallowPwOTDataCollection;
            aerow.DisallowAeOTDataCollection = eachRow.DisallowAeOTDataCollection;
            aerow.DisallowAeCellDataCollection = eachRow.DisallowAeCellDataCollection;


            // errors list
            aerow.MicroDataCellContextError = eachRow.MicroDataCellContextError;
            aerow.MicroDataRatioContextError = eachRow.MicroDataRatioContextError;
            aerow.MicroDataRatioOtmContextError = eachRow.MicroDataRatioOtmContextError;

            let pwrow = this.cesMicroDataAePwRows.find(a => a.RefMM === eachRow.RefMM && a.RefYY === eachRow.RefYY && a.RowType === 'PW');
            pwrow.TotalNonSupervisoryWokers = eachRow.TotalNonSupervisoryWokers;
            pwrow.TotalNonSupervisoryWorkerPayrolls = eachRow.TotalNonSupervisoryWorkerPayrolls;
            pwrow.TotalNonSUpervisoryCommisions = eachRow.TotalNonSUpervisoryCommisions;
            pwrow.TotalNonSupervisoryWorkerHours = eachRow.TotalNonSupervisoryWorkerHours;
            pwrow.TotalNonSupervisoryOvertime = eachRow.TotalNonSupervisoryOvertime;
            // errors list
            pwrow.MicroDataCellContextError = eachRow.MicroDataCellContextError;
            pwrow.MicroDataRatioContextError = eachRow.MicroDataRatioContextError;
            pwrow.MicroDataRatioOtmContextError = eachRow.MicroDataRatioOtmContextError;

            pwrow.DisallowPwRowDataCollection = eachRow.DisallowPwRowDataCollection;
            pwrow.DisallowAeRowDataCollection = eachRow.DisallowAeRowDataCollection;
            pwrow.DisallowPwCellDataCollection = eachRow.DisallowPwCellDataCollection;
            pwrow.DisallowPwOTDataCollection = eachRow.DisallowPwOTDataCollection;
            pwrow.DisallowAeOTDataCollection = eachRow.DisallowAeOTDataCollection;
            pwrow.DisallowAeCellDataCollection = eachRow.DisallowAeCellDataCollection;

            aerow.PWAE = eachRow.PWAE;
            aerow.PWAHE = eachRow.PWAHE;
            aerow.PWAOT = eachRow.PWAOT;
            aerow.PWAWE = eachRow.PWAWE;
            aerow.PWAWH = eachRow.PWAWH;
            aerow.WWAE = eachRow.WWAE;
            aerow.AHE = eachRow.AHE;
            aerow.AOT = eachRow.AOT;
            aerow.AWE = eachRow.AWE;
            aerow.AWH = eachRow.AWH;
            aerow.GoodDate = eachRow.GoodDate;
            aerow.RatioGoodDate = eachRow.RatioGoodDate;

          });
        } else {
          this.cesMicroDataAePwRows = [];
          data.forEach(eachRow => {
            const aeRow = { ...eachRow, RowType: 'AE', cesMultiPay: eachRow.CesMultiPay, MicroDataCellContextError: eachRow.MicroDataCellContextError };
            const pwRow = { ...eachRow, RowType: 'PW', cesMultiPay: eachRow.CesMultiPay, MicroDataCellContextError: eachRow.MicroDataCellContextError };
            this.cesMicroDataAePwRows.push(aeRow);
            this.cesMicroDataAePwRows.push(pwRow);
          });
          this.collectionService.IsUnitSwitching = false;
        }
        // once all rows are added - group rows
        this.updateRowGroupMetaData();
        console.log('splitMicroRows - rowgroupmeta'); //+ JSON.stringify(this.rowGroupMetaData));
      }
      catch(e) {
        console.log('Error building split AE/PW rows.');
      }
    }
    return this.cesMicroDataAePwRows;
  }

  // merges AE and PW rows together
  mergeMicroRows(aeRow: CollectionsCesMicroData, pwRow: CollectionsCesMicroData): CollectionsCesMicroData {
    const mergedMicroRow: CollectionsCesMicroData = aeRow;
    if(pwRow) {
      mergedMicroRow.TotalNonSupervisoryWokers = pwRow.TotalNonSupervisoryWokers;
      mergedMicroRow.TotalNonSupervisoryWorkerHours = pwRow.TotalNonSupervisoryWorkerHours;
      mergedMicroRow.TotalNonSupervisoryWorkerPayrolls = pwRow.TotalNonSupervisoryWorkerPayrolls;
      mergedMicroRow.TotalNonSUpervisoryCommisions = pwRow.TotalNonSUpervisoryCommisions;
      mergedMicroRow.TotalNonSupervisoryOvertime = pwRow.TotalNonSupervisoryOvertime;
    }
    return mergedMicroRow;
  }



  onSort() {
    this.updateRowGroupMetaData();
  }

  // show taost that needs their attention on microgrid errors
  showErrorNotificationIfErrors(data: CollectionsCesMicroData[]) {
    if (data != null) {
      if (this.hasEditCheckErrors(data)) {
        this.messageService.clear();
        this.messageService.add({ key: 'cestoast', severity: 'warn', summary: 'Error Message', detail: 'Micro data field errors found.' });
      }
    }
  }

  // small helper
  hasEditCheckErrors(data): boolean {
    let value = false;
    for (const eachMicroRow of data) {
      if (eachMicroRow.CesInterviewErrorScripts != null && eachMicroRow.CesInterviewErrorScripts.size > 0) {
        value = true;
        break;
      }
    }
    return value;
  }

  // primeng table specific requirement to group AE-PW row of the same month together
  updateRowGroupMetaData() {
    this.rowGroupMetaData = {};
    if (this.cesMicroDataAePwRows) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.cesMicroDataAePwRows.length; i++) {
        const rowData = this.cesMicroDataAePwRows[i];
        // month column
        const currentMonthYear = rowData.RefMMYY;

        if (i === 0) {
          this.rowGroupMetaData[currentMonthYear] = { index: 0, size: 1 };
        } else {
          const previousRowData = this.cesMicroDataAePwRows[i - 1];
          const previousMonthYear = previousRowData.RefMMYY;
          if (currentMonthYear === previousMonthYear) {
            this.rowGroupMetaData[currentMonthYear].size++;
          } else {
            this.rowGroupMetaData[currentMonthYear] = { index: i, size: 1 };
          }
        }
      }
    }
  }



  // compute LP factors for each PLp options
  computeLpFactor(refMM: number, refYY: number, plopp: number) {
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
          lpFactor = NaN;
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


  setScreeningErrorFlag(cellRatioName: string) {
    this.AWHselectedError = false;
    this.AHEselectedError = false;
    this.WWAEselectedError = false;
    this.PWAEselectedError = false;
    this.PWAHEselectedError = false;
    this.PWAWHselectedError = false;
    this.PWAOTselectedError = false;
    this.AOTselectedError = false;
    this.PWAWEselectedError = false;

    this[cellRatioName + 'selectedError'] = true;
  }
}
