import { TcwHttpService } from '../../core/services/tcw-http.service';
import { Observable, of, Subject, Subscription, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as caseListActions from '../store/caselist.actions';
import { Notes } from 'src/app/shared/models/notes.model';
import { HttpBackend } from '@angular/common/http';


import { SurveyId } from 'src/app/shared/models/survey-id.enum';
import { TcwUser } from 'src/app/shared/models/tcw-user.model';
import { DatePipe } from '@angular/common';
import { Case } from '../../shared/models/case.model';
import { map, catchError, tap } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { AuditLite } from '../../shared/models/auditlite.model';
import { Interaction } from 'src/app/shared/models/interaction.model';


@Injectable()
export class CaseListService {

  private caseListTimer: any;

  private surveyId: string;
  private subscription: Subscription;
  public ces: boolean;
  public jolts: boolean;
  public isAdmin: boolean;

  currentSelectedCaseListScheduleFilter = 'Today\'s Calls';//'Today'; // default // Today's Calls
  caseListTabToReturnTo = 'Scheduled'; // set this to the tabname that they change to
  private selectionMode = 'single';
  private IsSelectionModeSingle = true;
  private tcwUserIdList: string[] = [];

  // subject for selectionMode change to single
  // private selectionModeChangeToSingleSubject = new BehaviorSubject<boolean>(true);
  // private selectionModeChangeToSingle$ = this.selectionModeChangeToSingleSubject.asObservable();

  caseListModeChange = new Subject<{ selectionMode: string, selectionModeSwitch: boolean }>();
  // subject for user dropdown change
  userIdSubject = new BehaviorSubject<string>('');
  userIdChange$ = this.userIdSubject.asObservable();

  // creating a subject for the case list refresh button whose' initial value is default button class css
  // then when raise an observable when its time with another css class that will change teh button style
  private caseRefreshNotificationSubject = new BehaviorSubject<string>('ui-button-refresh-default');
  caseRefreshNotification$ = this.caseRefreshNotificationSubject.asObservable();

  // subject for reseting and setting refresh bar
  private valueSubject = new BehaviorSubject<number>(100); // start with 100%
  value$ = this.valueSubject.asObservable();
  newValue: number;
  interval: any;

  minutesToRefresh = 20;

  currentSelectedCase: Case;

  // subject for case mode dropdown change
  public caseReptModeSubject = new BehaviorSubject<{ value: string, conditional: boolean }>({ value: 'All', conditional: false });

  public tabSwitchSubject = new BehaviorSubject<string>('Scheduled');

  // aseReptModeChange$ = this.caseReptModeSubject.asObservable();
  public isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading: boolean;
  private refreshButtonClass: string;
  private refreshResetButtonClass: string;

  constructor(private messageService: MessageService,
    private tcwHttpService: TcwHttpService,
    private store: Store<fromApp.AppState>,
    private uiConfigService: UIConfigService,
    private router: Router) {

    this.subscription = this.store.select('authState').subscribe(authState => {
      this.surveyId = authState.userEnvironment.environmentDetails.survey;
      this.isAdmin = authState.isAdmin;
      this.ces = (this.surveyId === 'C');
      this.jolts = (this.surveyId === 'J');
      this.refreshButtonClass = 'ui-button-refresh-non-glowing ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-left';
      this.refreshResetButtonClass = 'ui-button-refresh-default ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-left';
    });
    // Once the auth state is populated, we don't need to keep subscribing
    if (this.surveyId) {
      this.subscription.unsubscribe();
    }
  }

  // //TODO:  Change from "object" to type representing Case List model
  // getCaseList(): Observable<object> {
  //   return this.tcwHttpService.httpGet<object>('api/Cases');
  // }

  openCase(caseNum: string) {
    if (this.selectionMode !== 'single') {
      this.uiConfigService.SetErrorDialogMessage('Cannot open a case while Multiselect option is enabled');
    } else {
      this.router.navigate(['/case-details/' + caseNum]);
    }
  }

  // setPreliminaryCaseInfo(caseObj) {
  //   this.currentSelectedCase = caseObj;
  // }

  getUserIdList(): Observable<string[]> {
    if (this.tcwUserIdList.length > 0) {
      return of(this.tcwUserIdList);
    }

    return this.tcwHttpService.httpGet<TcwUser[]>('api/User').pipe(
      map((users: TcwUser[]) => {
        this.tcwUserIdList = users.filter(usr => usr.USER_ID !== 'UNALLOCATED').map(user => user.USER_ID);
        return this.tcwUserIdList;
      }),
      catchError(err => {
        console.error('Could not populate user list', err);
        return of(this.tcwUserIdList);
      })
    );
  }



  getCaseListScheduleFilter() {
    return this.currentSelectedCaseListScheduleFilter;
  }

  setCaseListScheduleFilter(filterName: string) {
    this.currentSelectedCaseListScheduleFilter = filterName;
  }

  getCaseListTabToReturnOnSave() {
    return this.caseListTabToReturnTo;
  }

  setCaseListTabToReturnOnSave(tabName: string) {
    console.log('on tab changed' + tabName);
    this.caseListTabToReturnTo = tabName;
  }

  setCaseListTimer(duration: number = 900) {
    this.caseListTimer = setTimeout(() => {
      this.store.dispatch(new caseListActions.SetRefreshFlag(false));
    }, duration);
  }

  clearTimer() {
    if (this.caseListTimer) {
      clearTimeout(this.caseListTimer);
      this.caseListTimer = null;
    }
  }

  getSurveyId() {
    return this.surveyId;
  }

  setCaseDetails(caseObj: Case) {
    this.currentSelectedCase = caseObj;
  }

  getCaseDetails() {
    return this.currentSelectedCase;
  }

  ////////////////////////////////////////////////
  onSelectionModeChange() {
    this.store.dispatch(new caseListActions.ClearSelectedCases());

    this.selectionMode = (this.selectionMode === 'multiple') ? 'single' : 'multiple';
    this.IsSelectionModeSingle = (this.selectionMode === 'single');
    this.caseListModeChange.next({
      selectionMode: this.selectionMode,
      selectionModeSwitch: !this.IsSelectionModeSingle
    });

    this.uiConfigService.SetToolbarToSelectedMode(!this.IsSelectionModeSingle);
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
  }



  getSelectionMode() {
    return this.selectionMode;
  }
  getSelectionModeSwitch() {
    return !this.IsSelectionModeSingle;
  }

  UserIdChange(userId: string): void {
    if (userId) {
      this.userIdSubject.next(userId);
      this.store.dispatch(new caseListActions.ClearSelectedCases());
      this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
      this.router.navigate(['/case-list', userId]);
    }
  }

  CaseReportModeChange(mode: { value: string, conditional: boolean }): void {
    this.store.dispatch(new caseListActions.ClearSelectedCases());
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
    this.caseReptModeSubject.next(mode);
  }

  TabSwitch(tabName: string) {
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
    this.setCaseListTabToReturnOnSave(tabName);
    this.tabSwitchSubject.next(tabName);
  }

  fetchCaseData(): void {
    const userId = this.userIdSubject.getValue();
    this.store.dispatch(new caseListActions.FetchCaseList(userId));
    this.resetCaseRefresh();
  }


  // Prasad - Refresh button for case list data
  resetCaseRefresh(): void {
    // set the refresh button back to default (not in alert glow mode)
    this.caseRefreshNotificationSubject.next(this.refreshResetButtonClass);
    // reset the progressbar to start over from full timer
    this.valueSubject.next(100);
    this.runRefreshBarTimer();
  }

  notifyUserToRefreshCaseList(): void {
    this.caseRefreshNotificationSubject.next(this.refreshButtonClass);
  }

  runRefreshBarTimer(): void {
    const secondsToCheck = 60;
    const incrementSize = 100 / Math.floor((this.minutesToRefresh * 60) / secondsToCheck);
    this.newValue = 100;

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.newValue = Math.max(this.newValue - incrementSize, 0);
      this.valueSubject.next(this.newValue);

      if (this.newValue === 0) {
        this.notifyUserToRefreshCaseList();
        clearInterval(this.interval);
      }

    }, secondsToCheck * 1000);
  }
}
