import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ofType } from '@ngrx/effects';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { ToolBarDialogProps } from 'src/app/shared/models/ToolbarDialogProps';
import { BehaviorSubject, Observable, Subject, Subscription, throwError, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { CaseListService } from '../../case-list/services/case-list.service';
import { Store, ActionsSubject, Action } from '@ngrx/store';
import { take } from 'rxjs/operators';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../auth/store/auth.reducer';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import * as CaseListActions from '../../case-list/store/caselist.actions';
import { TcwSearchService } from 'src/app/core/services/tcw-search.service';
import { Case } from '../models/case.model';
import { CaseDetailsService } from 'src/app/case-details/services/case-details.service';
import { UnitService } from 'src/app/case-details/services/unit.service';
import { Unit } from '../models/unit.model';
import { TcwError } from '../models/tcw-error';
import { LookupService } from 'src/app/core/services/lookup.service';
import { JsonPipe } from '@angular/common';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';
import { truncate } from 'lodash';

@Component({
  selector: 'fsms-tcw-case-toolbar',
  templateUrl: './case-toolbar.component.html',
  styleUrls: ['./case-toolbar.component.css']
})
export class CaseToolbarComponent implements OnInit, OnDestroy {
  // create an input property for this component/directive
  @Input() ForCaseList: boolean;
  @Input() ForCaseCollection: boolean;
  @Input() ForReadOnlyCase: boolean;
  showSummary = false;
  searchUnitNumber: string;
  // IsGroupScheduleDisabled: boolean;
  caseSummaryDetails$: Observable<Case | TcwError>;

  // caseDetailsSaving$ = this.caseDetailsService.caseDetailsSaving$;

  subscriptions: Subscription;
  searchResultsCase: Case;
  searchResultsCaseSubject: BehaviorSubject<Case> = new BehaviorSubject<Case>(null);
  searchResultsCase$: Observable<Case> = this.searchResultsCaseSubject.asObservable();

  // observables subscribed to UIConfig service subjects
  enableGroupSchedule$: Observable<boolean>;
  disableOpenCase$: Observable<boolean>;
  disableDialer$: Observable<boolean>;

  toolbarConfig: CaseToolBarConfiguration;
  // private toolbarSubject = new BehaviorSubject<ToolBarDialogProps>(new ToolBarDialogProps(true));
  // toolbar$ = this.toolbarSubject.asObservable();

  showParkedCaseDropdown$: Observable<boolean>;
  showParkedCaseDropdown: boolean;
  showUserDropdown: boolean;
  caseId: string;
  surveyId: string;
  caseReptModes: { label: string, value: { value: string, conditional: boolean } }[];
  userList: { label: string, value: { value: string } }[];
  parkList: { label: string, value: { value: string } }[];
  selectedParked: { value: string };
  selectedUser: { value: string };
  currentUserId: string;
  parkedCaseSubscription: Subscription;
  toolbarSubscription: Subscription;

  constructor(private store: Store<fromApp.AppState>, private tcwSaveAllService: TcwSaveAllService, private router: Router, private uiConfigService: UIConfigService,
    private caseListService: CaseListService, private tcwSearchService: TcwSearchService,
    private caseDetailsService: CaseDetailsService, private unitService: UnitService,
    private lookupService: LookupService, private actionsSubject$: ActionsSubject) {
    // tslint:disable-next-line: no-use-before-declare
    this.toolbarConfig = new CaseToolBarConfiguration();
    this.caseReptModes = [
      { label: 'All', value: { value: 'All', conditional: false } },
      { label: 'Address Refinement', value: { value: 'A', conditional: false } },
      { label: 'Enrollment', value: { value: 'E', conditional: false } },
      { label: 'CATI Collection', value: { value: 'C', conditional: false } },
      { label: 'Permanent Cati Collection', value: { value: 'P', conditional: false } },
      { label: 'Fax Collection', value: { value: 'F', conditional: false } },
      { label: 'TDE Collection', value: { value: 'T', conditional: false } },
      { label: 'Web Collection', value: { value: 'W', conditional: false } },
      { label: 'Mail Collection', value: { value: 'M', conditional: false } },
      { label: 'Email Collection', value: { value: 'L', conditional: false } },
      { label: 'Edit Reconciliation', value: { value: 'E', conditional: true } },
      { label: 'Non Response Prompt', value: { value: 'N', conditional: true } },
      { label: 'Ready To Report', value: { value: 'R', conditional: true } },
      { label: 'Refusal Conversion', value: { value: 'C', conditional: true } },
      { label: 'Delinquent', value: { value: 'D-C', conditional: true } }
    ];

    this.parkList = [
      { label: 'EMPLONLY', value: { value: 'EMPLONLY' } },
      { label: 'ENROLLHOLD', value: { value: 'ENROLLHOLD' } },
      { label: 'MGRREV', value: { value: 'MGRREV' } },
      { label: 'NEW ROLLS', value: { value: 'NEW ROLLS' } },
      { label: 'OFO REGIONAL', value: { value: 'OFO REGIONAL' } },
      { label: 'PC ONE', value: { value: 'PC ONE' } },
      { label: 'REFUSAL', value: { value: 'REFUSAL' } },
      { label: 'REFUSAL PERM', value: { value: 'REFUSAL PERM' } },
      { label: 'REMOVE', value: { value: 'REMOVE' } },
      { label: 'ROLLOFF', value: { value: 'ROLLOFF' } },
      { label: 'SELFREPORT', value: { value: 'SELFREPORT' } }
    ];

    this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
      this.showUserDropdown = authState.isAdmin;
      this.currentUserId = authState.userEnvironment.currentUser.userId;
    });

    this.surveyId = this.caseListService.getSurveyId();
  }

  ngOnInit() {
    this.toolbarConfig.IsCaseListFeatureEnabled = this.ForCaseList;
    this.toolbarConfig.IsCaseSaveFeaturesEnabled = this.ForCaseCollection;
    this.toolbarConfig.IsReadOnlyCase = this.ForReadOnlyCase;

    this.store.select(fromCaseList.getCaseListState).pipe(take(1)).subscribe(caseListState => {
      if (this.showUserDropdown && caseListState.userId && caseListState.userId.length > 0) {
        this.selectedUser = { value: caseListState.userId };
      } else {
        this.selectedUser = { value: this.currentUserId };
      }
    });

    this.userList = [{
      label: this.selectedUser.value,
      value: { value: this.selectedUser.value }
    }];

    // need to dynamically disable these buttons
    // Prasad - this observable value is emitted from collection service through uiconfigservice - on Mutlipay scenario
    this.subscriptions = this.uiConfigService.isReadOnlySaveFeatures$.subscribe(value => {
      if (!this.ForReadOnlyCase) {
        this.toolbarConfig.IsReadOnlyCase = value;
      }

    });

    // this.IsGroupScheduleDisabled = true;
    this.enableGroupSchedule$ = this.uiConfigService.enabledGroupSchedule$;
    this.showParkedCaseDropdown$ = this.uiConfigService.showParkedCaseDropdown$;
    this.selectedParked = this.parkList[0].value;
    this.disableOpenCase$ = this.uiConfigService.disableOpenCase$;
    this.disableDialer$ = this.uiConfigService.disableDialer$;

    if (this.ForCaseList) {
      this.parkedCaseSubscription = this.uiConfigService.showParkedCaseDropdown$.subscribe((visible) => {
        if (visible !== this.showParkedCaseDropdown) {
          this.showParkedCaseDropdown = visible;
          if (visible) {
            this.caseListService.UserIdChange(this.selectedParked.value);
          } else {
            this.caseListService.UserIdChange(this.selectedUser.value);
          }
        }
      });
    }

    this.toolbarSubscription = this.store.select(fromCaseList.getSelectedCaseNum).subscribe(selectedCaseNum => {
      this.caseId = selectedCaseNum;
    });

    if (this.showUserDropdown) {
      this.caseListService.getUserIdList().pipe(take(1)).subscribe(users => {

        this.userList = users.map(user => {
          return {
            label: user,
            value: { value: user }
          };
        });
      });
    }
  }

  onSearchEnterKey(): void {
    this.displaySummary();
  }

  onSearchClick(): void {
    this.displaySummary();
  }

  displaySummary() {
    this.showSummary = true;
    this.getCaseByUnit().subscribe((data: Case) => {
      this.searchResultsCaseSubject.next(data);
      this.showSummary = true;
    }, (error) => {
      this.uiConfigService.SetErrorDialogMessage(error.friendlyErrorMessageToUser);
      this.showSummary = false;
    });
  }


  CaseOpened(closeSideBar: boolean) {
    console.log('Inside CaseOpened' + !closeSideBar);
    this.showSummary = !closeSideBar;
  }

  getCaseByUnit(): Observable<Case | TcwError> {
    let isCes;
    this.lookupService.IsCES$.subscribe((data: boolean) => { isCes = data; });
    if (isCes) {
      return this.tcwSearchService.getCaseByUnitIdCes(this.searchUnitNumber);
    } else {
      return this.tcwSearchService.getCaseByUnitIdJolts(this.searchUnitNumber);
    }
  }

  OpenCase(): void {
    // navigate to the secondary route and activate notes component
    this.caseListService.openCase(this.caseId);
  }

  // show notes
  ShowNotesDialog(): void {
    if (this.caseId) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-notes', this.caseId] } }]);
      this.TriggerShowPopup('case-notes', 50, 100);
      // when not in collection make the notes editable in this case
        this.uiConfigService.setCollectionModeActive(false);
        //Allan allow notes to get focus
        this.uiConfigService.IsNotesDisplayed = true;
    }
  }


  // show dialer
  ShowDialerDialog(): void {
    if (this.caseId) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-dialer', this.caseId] } }]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-dialer', 100, 100);
    }
  }



  // show scheduler
  ShowSchedulerDialog(): void {
    if (this.caseId) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-scheduler', this.caseId] } }]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-scheduler', 100, 100);
    }
  }

  // show group scheduler
  ShowGroupSchedulerDialog(): void {
    let selectedCaseNumList: string[];
    this.store.select(fromCaseList.getSelectedCaseNumList).pipe(take(1)).subscribe(caseNums => {
      selectedCaseNumList = caseNums;
    });

    if (selectedCaseNumList.length <= 1) {
      this.uiConfigService.SetErrorDialogMessage('You must select multiple cases for group scheduler');
      return;
    } else {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-scheduler', selectedCaseNumList[0]] } }]);
      // send a signal to turn visible to true
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-scheduler', 100, 100);
    }
  }

  // show dialer
  ShowPrintFaxDialog(): void {

    if (this.caseId) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-printfax', this.caseId] } }]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-printfax', 0, 0);
    }
  }

  // show bathc fax entry
  ShowBatchFaxEntryDialog(): void {
    // reach into the store to get the selected case (when user selected a case on the case list) - we need to know
    // case mode and other info that is in the store.
    let selectedCaseObj: Case = null;
    const subs = this.store.select(fromCaseList.getSelectedCaseObject).subscribe(selectedCase => {
      selectedCaseObj = selectedCase;
    });

    // check if the user trying to get to bachtch fax without selecting  a case
    // this scneerio very unlikely since we do disable all toolbar buttons until user selects a case
    // but can act as another gaurd
    if (selectedCaseObj == null) {
      this.uiConfigService.SetErrorDialogMessage('Please select a Case from the list.');
    } else {
      // we do not want to activate the component if its not in collection mode.
      // we could do the same with CanActivate route gaurd, but since I have the case object right here,
      // its lot easier to do here with less code.
      if (selectedCaseObj.REPT_MODE === 'A' || selectedCaseObj.REPT_MODE === 'E') {
        this.uiConfigService.SetErrorDialogMessage('Case not currently in a Collection mode.');
      } else {
        // navigate to the secondary route and activate notes component
        this.router.navigate([{ outlets: { popup: ['case-batchfax', this.caseId] } }]);

        // send a signal to turn visible to true
        this.TriggerShowPopup('case-batchfax', 50, 50);
      }
    }
  }



  ShowTransferRequestDialog(): void {
    if (this.caseId) {
      // navigate to the secondary route and activate notes component
      this.router.navigate([{ outlets: { popup: ['case-transferrequest', this.caseId] } }]);
      // send a signal to turn visible to true
      this.TriggerShowPopup('case-transferrequest', 50, 50);
    }

  }

  // uitlity function
  TriggerShowPopup(pageStyleName: string, positionTop: number, positionLeft: number): void {
    // send a signal to turn visible to true
    const props = new ToolBarDialogProps();
    props.StyleClass = pageStyleName;
    props.Show = true;
    props.ShowHeader = true;
    props.PositionLeft = positionLeft;
    props.PositionTop = positionTop;
    this.uiConfigService.ShowPopUp(props);
  }

  onUserDropdownChange(event): void {
    this.caseListService.UserIdChange(event.value.value);
  }

  onCaseReptModeSelect(event): void {
    this.caseListService.CaseReportModeChange(event.value);
  }

  returnToCaseList(): void {
    let currentCaseListUser: string;
    this.store.select(fromCaseList.getCaseListState).pipe(take(1)).subscribe(caseListState => {
      currentCaseListUser = caseListState.userId;

    });
    this.router.navigate(['/case-list', currentCaseListUser]);
  }

  onSave(closeOnSuccess: boolean) {
    const caseRespCode = this.caseDetailsService.saveCase(closeOnSuccess);
    // set teh dirty false after save
    this.tcwSaveAllService.setCaseNotDirty();
    this.tcwSaveAllService.setCollectionDataDirty(false);
    // this.caseDetailsSaving$ = of(false);

    // determine whcih case list to return the users to - scheduled or edit etc.,
    if (caseRespCode === '11' || caseRespCode === '12') {
      this.caseListService.setCaseListTabToReturnOnSave('Edit');
    }

    // on true rtrun to case list
    if (closeOnSuccess) {
      this.doClose();
    }
  }

  doClose() {
    this.returnToCaseList();
  }

  onCancel(): void {
    this.store.dispatch(new CaseListActions.UnloadSelectedCase(false));

    this.doClose();
  }

  ngOnDestroy() {
    if (this.ForCaseList) {
      this.parkedCaseSubscription.unsubscribe();
      this.showParkedCaseDropdown = false;
      this.uiConfigService.SetParkCaseDropDown(false);
    }
    this.toolbarSubscription.unsubscribe();
  }
}



export class CaseToolBarConfiguration {
  IsCaseListFeatureEnabled: boolean;
  IsCaseSaveFeaturesEnabled: boolean;
  IsReadOnlyCase: boolean;
}
