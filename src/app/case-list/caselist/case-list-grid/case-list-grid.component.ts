import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, Input, AfterViewChecked, ElementRef } from '@angular/core';
// import { Column, Row } from 'primeng/api/primeng-api';
import { Case } from '../../../shared/models/case.model';
import { CaseListService } from '../../services/case-list.service';
import { Subject, combineLatest, Subscription, BehaviorSubject, Observable, of, Scheduler } from 'rxjs';
import { FilterUtils } from 'primeng/utils';
import { Table } from 'primeng/table';
import { pipe } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';
import { ActivatedRoute } from '@angular/router';
import { GridType } from '../../model/grid-type.enum';
import { ScheduleFilter } from '../../model/schedule-filter.enum';
import { SurveyId } from '../../../shared/models/survey-id.enum';
import { DatePipe } from '@angular/common';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import * as CaseListActions from '../../../case-list/store/caselist.actions';
import * as CaseListReducer from '../../../case-list/store/caselist.reducer';

@Component({
  selector: 'fsms-tcw-case-list-grid',
  templateUrl: './case-list-grid.component.html',
  styleUrls: ['./case-list-grid.component.css']
})
export class CaseListGridComponent implements OnInit, OnDestroy {
  @Input() surveyId: SurveyId;
  @Input() gridType: GridType;

  error: string = null;
  sortFieldName: string;
  sortOrder: number;
  cols: { field: string, header: string, width: string, description: string }[];
  colorCodes: { label: string, value: string }[];
  timezones: any[];
  selectedCases: any;
  dateFilters: any;
  filterGlobalText: string;

  surveyIds = SurveyId;
  gridTypes = GridType;

  scheduleFilters: { value: string, label: string }[] = [];
  scheduleFilterOption: string;

  nextScheduledCall: Date = null;
  nextScheduledCaseNum: string = null;

  reptModeSelection: { value: string, conditional: boolean } = { value: 'All', conditional: false };
  reptModeSubscription: Subscription;

  selectionMode: string;
  selectionModeSwitch: boolean;
  selectionModeSubscription: Subscription;

  index: number;
  isLoadingChange$ = this.caseListService.isLoadingSubject.asObservable();
  caseList: Case[];
  caseListSubject: BehaviorSubject<Case[]> = new BehaviorSubject<Case[]>([]);

  caseListSubscription: Subscription;

  tabSwitchSubscription: Subscription;

  canSetFocusOnNextElemSubject = new BehaviorSubject<boolean>(false);
  canSetFocusOnNextElement$ = this.canSetFocusOnNextElemSubject.asObservable();

  @ViewChild('nextFocusElem', { read: ElementRef, static: false }) focusNextElement: ElementRef;
  //@ViewChild('myCalendar',  { read: ElementRef, static: false}) datePicker: ElementRef;

  stateKey: string;

  constructor(private caseListService: CaseListService, private store: Store<fromApp.AppState>, private activatedRoute: ActivatedRoute, private uiConfigService: UIConfigService) {

  }

  ngOnInit() {
    this.initializeGrid();

    for (const sf in ScheduleFilter) {
      this.scheduleFilters.push({ label: ScheduleFilter[sf], value: ScheduleFilter[sf] });
    }

    if (this.surveyId === this.surveyIds.J) {
      this.scheduleFilterOption = ScheduleFilter.All;
    } else {
      this.scheduleFilterOption = this.caseListService.getCaseListScheduleFilter();
      // this.scheduleFilterOption = ScheduleFilter.Today;
    }

    this.caseListSubscription = this.store.select(CaseListReducer.getCaseList).subscribe(caseListObj => {
      const tempCaseList: Case[] = [];
      caseListObj.forEach(cs => {
        tempCaseList.push(new Case(cs));
      });
      this.caseList = tempCaseList;
      this.refineCaseList();
    });

    this.stateKey = this.surveyId.concat('-').concat(GridType[this.gridType]).concat('-local');

    // This is needed for date range filter to work(SCHED_DATE_TIME column)
    if (!FilterUtils['dateRangeFilter']) {
      FilterUtils['dateRangeFilter'] = (value, filter): boolean => {
        // get the from/start value
        const _self = this;
        if (_self.dateFilters) {
          const start = _self.dateFilters[0].getTime();
          let end;
          // the to/end value might not be set
          // use the from/start date and add 1 day
          // or the to/end date and add 1 day
          if (_self.dateFilters[1]) {
            end = _self.dateFilters[1].getTime() + 86400000;
          } else {
            end = start + 86400000;
          }
          // compare it to the actual values
          return new Date(value).getTime() >= start && new Date(value).getTime() <= end;
        } else {
          return true;
        }
      };
    }

    this.timezones = [
      { label: 'US/Aleutian', value: 'US/Aleutian' },
      { label: 'US/Alaska', value: 'US/Alaska' },
      { label: 'US/Central', value: 'US/Central' },
      { label: 'US/Eastern', value: 'US/Eastern' },
      { label: 'US/Hawaii', value: 'US/Hawaii' },
      { label: 'US/Mountain', value: 'US/Mountain' },
      { label: 'US/Pacific', value: 'US/Pacific' },
      { label: 'US/Samoa', value: 'US/Samoa' },
      { label: 'America/Puerto_Rico', value: 'America/Puerto_Rico' },
      { label: 'Canada/Atlantic', value: 'CANADA/Atlantic' },
      { label: 'Canada/Central', value: 'CANADA/Central' },
      { label: 'Canada/Eastern', value: 'CANADA/Eastern' },
      { label: 'Canada/Mountain', value: 'CANADA/Mountain' },
      { label: 'Canada/Newfoundland', value: 'CANADA/Newfoundland' },
      { label: 'Canada/Pacific', value: 'CANADA/Pacific' }
    ];

    this.selectionMode = this.caseListService.getSelectionMode();
    this.selectionModeSwitch = this.caseListService.getSelectionModeSwitch();

    this.selectionModeSubscription = this.caseListService.caseListModeChange.subscribe(
      (actionObject) => {
        this.selectionMode = actionObject.selectionMode;
        this.selectionModeSwitch = actionObject.selectionModeSwitch;
      }
    );

    this.reptModeSubscription = this.caseListService.caseReptModeSubject.subscribe(
      data => {
        this.reptModeSelection = data;
        this.refineCaseList();
      }
    );

    this.tabSwitchSubscription = this.caseListService.tabSwitchSubject.subscribe(
      data => {
        this.selectedCases = [];
        this.store.dispatch(new CaseListActions.ClearSelectedCases());
      }
    );
  }


  ngAfterViewInit() {
    this.canSetFocusOnNextElement$
      .subscribe(canSetFocus => {
        if (canSetFocus) {
          const elem = this.focusNextElement.nativeElement as HTMLElement;
          elem.focus();
        }
      }
      );
  }

  applyFilter(event, dt) {
    dt.filter(event, 'SCHED_DATE_TIME', 'dateRangeFilter');
    this.canSetFocusOnNextElemSubject.next(true);
  }

  closeEvent(event) {
    this.canSetFocusOnNextElemSubject.next(true);
  }

  clearCaledarFilter(event, dt) {
    dt.reset();
    this.canSetFocusOnNextElemSubject.next(true);
  }


  isCaseIncluded(c: Case): boolean {
    const today: Date = new Date();
    let include = false;

    switch (this.gridType) {
      case GridType.Scheduled:
        switch (this.scheduleFilterOption) {
          case ScheduleFilter.Today:
            include = c.SCHED_DATE_TIME != null &&
              (
                c.REPT_COND === 'N' ||
                (today.getFullYear() === c.SCHED_DATE_TIME.getFullYear()
                  && today.getDate() === c.SCHED_DATE_TIME.getDate()
                  && today.getMonth() === c.SCHED_DATE_TIME.getMonth())
              );
            break;
          case ScheduleFilter.ThroughToday:
            include = c.SCHED_DATE_TIME != null &&
              (
                c.REPT_COND === 'N' ||
                (new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).getTime()
                  >= new Date(c.SCHED_DATE_TIME.getFullYear(), c.SCHED_DATE_TIME.getMonth() + 1, c.SCHED_DATE_TIME.getDate()).getTime())
              );
            break;
          case ScheduleFilter.All:
            if (this.surveyId == SurveyId.J) {
              include = c.SCHED_DATE_TIME != null && c.RESP_CODE !== '12' && c.RESP_CODE !== '11' && c.PRIORITY !== 'Y';
            } else {
              include = c.SCHED_DATE_TIME != null;
            }
            break;
        }
        break;
      case GridType.Unscheduled:
        if (this.surveyId == SurveyId.J) {
          include = c.SCHED_DATE_TIME === null && c.RESP_CODE !== '12' && c.RESP_CODE !== '11' && c.PRIORITY !== 'Y';
        } else {
          include = c.SCHED_DATE_TIME === null;
        }
        break;
      case GridType.Edit:
        include = c.RESP_CODE === '12' || c.RESP_CODE === '11' || c.PRIORITY === 'Y';
        break;
      case GridType.Parked:
        include = true;
        break;
      default:
        break;
    }

    if (!include) {
      console.log(this.selectedCases);
      if (this.selectedCases instanceof Case && c.CASE_NUM === this.selectedCases.CASE_NUM) {
        this.store.dispatch(new CaseListActions.ClearSelectedCases());
        this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
      } else if (this.selectedCases && this.selectedCases.length && this.selectedCases.length > 0 && this.selectedCases.findIndex((cs: Case) => cs.CASE_NUM === c.CASE_NUM) !== -1) {
        this.store.dispatch(new CaseListActions.RemoveMultiSelectCase(c.CASE_NUM));
      }
      return false;
    }

    // When input filter value is conditional (i.e., E-C, D-C, N-C, R-C, C-C), filter by just REPT_COND.
    if (this.reptModeSelection.conditional) {
      if (this.reptModeSelection.value === 'D-C') {// LONG TERM DELINQUENT
        include = (c.RESP_CODE === '81' || c.RESP_CODE === '82');
      } else {
        const reptCond = this.reptModeSelection.value.substr(0, 1);
        include = (c.REPT_COND == reptCond);
      }
    } else if (this.reptModeSelection.value === 'All') {
      include = true;
    } else {
      include = (c.REPT_MODE_COND == this.reptModeSelection.value);
    }

    return include;
  }

  refineCaseList() {
    const refinedCaseList: Case[] = this.caseList.filter(c => {
      return this.isCaseIncluded(c);
    });

    const today: Date = new Date();
    const next = refinedCaseList.sort((a: Case, b: Case) => a.SCHED_DATE_TIME < b.SCHED_DATE_TIME ? -1 : 1).filter((c) => {
      return (c.SCHED_DATE_TIME != null
        && (today.getFullYear() === c.SCHED_DATE_TIME.getFullYear()
          && today.getDate() === c.SCHED_DATE_TIME.getDate()
          && today.getMonth() === c.SCHED_DATE_TIME.getMonth()));
    });
    this.nextScheduledCall = null;
    this.nextScheduledCaseNum = null;
    if (next.length > 0) {
      if (next[0].SCHED_DATE_TIME) {
        this.nextScheduledCall = next[0].SCHED_DATE_TIME;
        this.nextScheduledCaseNum = next[0].CASE_NUM;
      }
    }

    this.caseListSubject.next(refinedCaseList);
  }

  // Refresh case list base on the case type drop down options
  scheduleFilterChanged(value) {
    this.refineCaseList();
    this.caseListService.setCaseListScheduleFilter(this.scheduleFilterOption);
  }

  // Display each cell of case on every row, slightly massage data for date time format (e.g. schedule date and timezone)
  displayData(col: any, rowData: any) {
    if (col.field === 'SCHED_DATE_TIME') {
      if (!rowData[col.field]) {
        return null;
      }
      const pipe = new DatePipe('en-US');
      return pipe.transform(rowData[col.field], 'MMM dd, yyyy h:mm a');
    } else {
      // if (col.field === 'respondentTimeZone') {
      //   // if (!rowData[col.field]) {
      //   //   return null;
      //   // }
      //   // const pipe = new DatePipe('en-US');
      //   // return pipe.transform(rowData[col.field], 'hh:mm a');
      // } else {
      return rowData[col.field];
      // }
    }
  }



  // Event listener for single/multiple case list row selection
  onSelectionModeChange() {
    this.selectedCases = [];
    this.caseListService.onSelectionModeChange();
  }

  // This function is instroduced by PRIMENG to avoid unnecessary dom operations, thus enhance grid performance
  trackBy(index, item) {
    return item.CASE_NUM;
  }

  // This is used to clear filter, sorting, table column width and ordering from local storage and revert to it's default state.
  onResetTableState(table: Table) {
    this.filterGlobalText = '';
    table.clearState();
    table.reset();
  }

  onFilter(event: any) {
    if (this.selectedCases && this.selectedCases.CASE_NUM) {

      const selCase: any = event.filteredValue.find((caseObj: Case) => {
        return caseObj.CASE_NUM == this.selectedCases.CASE_NUM;
      });

      if (!selCase) {
        this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
      }
    }

  }

  // This is used for testing, for now
  onRowSelect(event: any) {
    this.index = event.index + 1;
    /// set the open case button accordingly
    // pass false if a row selected to set button 'disabled' to false
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(false);


    if (event.data) {
      const caseObj: Case = event.data;
      if (caseObj) {
        this.caseListService.setCaseDetails(caseObj);
        if (this.selectionMode === 'multiple') {
          this.store.dispatch(new CaseListActions.AddMultiSelectCase(caseObj.CASE_NUM));
        } else {
          this.store.dispatch(new CaseListActions.SetSelectedCase(caseObj.CASE_NUM));
        }
      }
    }
  }

  onRowUnselect(event: any) {
    this.index = 0;

    if (event.data) {
      const caseObj: Case = event.data;
      if (caseObj) {
        if (this.selectionMode == 'multiple') {
          this.store.dispatch(new CaseListActions.RemoveMultiSelectCase(caseObj.CASE_NUM));
        } else {
          this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);
          this.store.dispatch(new CaseListActions.ClearSelectedCases());
        }
      }
    }
  }

  // Event listener for case list row double click, for openning a case
  onCaseListDblClick(event, data) {
    this.caseListService.openCase(data.CASE_NUM);
  }

  openNextScheduledCase() {
    this.caseListService.openCase(this.nextScheduledCaseNum);
  }

  ngOnDestroy() {
    this.selectionModeSubscription.unsubscribe();
    this.reptModeSubscription.unsubscribe();
    this.caseListSubscription.unsubscribe();
    this.tabSwitchSubscription.unsubscribe();
  }

  initializeGrid() {
    if (this.surveyId == SurveyId.J) {
      this.colorCodes = [
        { label: '1-Green (Collected/Good, RC 90, 91, 99)', value: '1' },
        { label: '2-Red (Not Collected RC 00-09, 81-82)', value: '2' },
        { label: '3-Yellow (Pending RC 10-19)', value: '3' },
        { label: '4-Black (Inactive RC 20-30, 39, 40, 50-59, 70-74)', value: '4' },
        { label: '5-Blue (Unable to Continue RC 83-85)', value: '5' },
      ];
    } else {
      this.colorCodes = [
        { label: '1-Green (Collected/Good, RC 90)', value: '1' },
        { label: '2-Red (Not Collected RC 00-09, 81-82)', value: '2' },
        { label: '3-Yellow (Edit Failure RC 10-17)', value: '3' },
        { label: '4-Blue (Refusal RC 20-30, 39)', value: '4' },
        { label: '5-Black (Inactive RC 40, 50-59, 70-74)', value: '5' },
      ];
    }

    switch (this.gridType) {
      case GridType.Scheduled:
        this.sortFieldName = 'SCHED_DATE_TIME';
        this.sortOrder = 1;
        if (this.surveyId == SurveyId.J) {
          this.cols = [
            {
              field: 'colorCodeJolts', header: 'Status', width: '94px', description: 'Status'
            },
            {
              field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC'
            },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PRIORITY', header: 'Priority', width: '69px', description: 'Priority'
            },
            {
              field: 'SCHED_DATE_TIME', header: 'Appointment', width: '180px', description: 'Appointment'
            },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case ID'
            },
            {
              field: 'TOUCH', header: 'Touch', width: '43px', description: 'Touch'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time Zone'
            },
            {
              field: 'respondentTimeString', header: 'Resp. Time', width: '130px', description: 'respondent Time'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'Contact Name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone Number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active Units count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit count'
            },
            {
              field: 'FIPS', header: 'FIPS', width: '54px', description: 'Fips'
            },
            {
              field: 'EI_NUMBER', header: 'EI#', width: '69px', description: 'EI Number'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            }
          ];
        } else {
          this.cols = [
            {
              field: 'colorCodeCes', header: 'Status', width: '94px', description: 'Status'
            },
            {
              field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC'
            },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'ALERT', header: 'Alert', width: '80px', description: 'Alert'
            },
            {
              field: 'SCHED_DATE_TIME', header: 'Appointment', width: '180px', description: 'Appointment'
            },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case ID'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time Zone'
            },
            {
              field: 'respondentTimeString', header: 'Resp. Time', width: '130px', description: 'respondent Time'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'Contact Name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active units count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit count'
            },
            {
              field: 'STATE', header: 'ST', width: '54px', description: 'ST'
            },
            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            },
            {
              field: 'CASE_OWNER', header: 'Intvwr ID', width: '120px', description: 'Interviewer Id'
            },
            {
              field: 'PLP', header: 'PLP', width: '54px', description: 'PLP'
            }
          ];
        }
        break;
      case GridType.Unscheduled:
        this.sortFieldName = 'CASE_NUM';
        this.sortOrder = 1;
        if (this.surveyId == SurveyId.J) {
          this.cols = [
            {
              field: 'colorCodeJolts', header: 'Status', width: '94px', description: 'Status'
            },
            {
              field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC'
            },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PRIORITY', header: 'Priority', width: '69px', description: 'Priority'
            },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case ID'
            },
            {
              field: 'TOUCH', header: 'Touch', width: '43px', description: 'Touch'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time Zone'
            },
            {
              field: 'respondentTimeString', header: 'Resp. Time', width: '130px', description: 'respondent Time'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'Contact Name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone Number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active Units count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit count'
            },
            {
              field: 'FIPS', header: 'FIPS', width: '54px', description: 'FIPS'
            },
            {
              field: 'EI_NUMBER', header: 'EI#', width: '69px', description: 'EI Number'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            }
          ];
        } else {
          this.cols = [
            {
              field: 'colorCodeCes', header: 'Status', width: '94px', description: 'Status'
            },
            { field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC' },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'ALERT', header: 'Alert', width: '80px', description: 'Alert'
            },
            { field: 'UI_NUMBER', header: 'UI Number', width: '96px', description: 'UI Number' },
            { field: 'EI_NUMBER', header: 'EI Number', width: '96px', description: 'EI Number' },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case ID'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time Zone'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'Contact Name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone Number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active unit count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit count'
            },
            // { field: "FIPS", title: "FIPS", width: "64px" },
            {
              field: 'STATE', header: 'ST', width: '54px', description: 'ST'
            },

            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            },
            // {
            //   field: "TDE_JUMP_FLAG", header: "TDE", width:"80px"
            // },
            { field: 'CASE_OWNER', header: 'Intvwr ID', width: '120px', description: 'interviewer ID' },
            {
              field: 'PLP', header: 'PLP', width: '54px', description: 'PLP'
            }
          ];
        }
        break;
      case GridType.Edit:
        this.sortFieldName = 'SCHED_DATE_TIME';
        this.sortOrder = -1;
        if (this.surveyId == SurveyId.J) {
          this.cols = [
            {
              field: 'colorCodeJolts', header: 'Status', width: '94px', description: 'Status'
            },
            {
              field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC'
            },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PRIORITY', header: 'Priority', width: '69px', description: 'Priority'
            },
            {
              field: 'SCHED_DATE_TIME', header: 'Appointment', width: '180px', description: 'Appointment'
            },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case ID'
            },
            {
              field: 'TOUCH', header: 'Touch', width: '43px', description: 'Touch'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time Zone'
            },
            {
              field: 'respondentTimeString', header: 'Resp. Time', width: '130px', description: 'respondent Time'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'Contact Name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone Number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active unit count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit Count'
            },
            {
              field: 'FIPS', header: 'FIPS', width: '54px', description: 'FIPS'
            },
            {
              field: 'EI_NUMBER', header: 'EI#', width: '69px', description: 'EI Number'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            }
          ];
        } else {
          this.cols = [];
        }
        break;
      case GridType.Parked:
        this.sortFieldName = 'SCHED_DATE_TIME';
        this.sortOrder = 1;
        if (this.surveyId == SurveyId.J) {
          this.cols = [
            {
              field: 'colorCodeJolts', header: 'Status', width: '94px', description: 'Status'
            },
            {
              field: 'RESP_CODE', header: 'RC', width: '43px', description: 'RC'
            },
            {
              field: 'REPT_MODE_COND', header: 'Mode', width: '60px', description: 'Mode'
            },
            {
              field: 'PRIORITY', header: 'Priority', width: '69px', description: 'Priority'
            },
            {
              field: 'SCHED_DATE_TIME', header: 'Appointment', width: '180px', description: 'Appoinment'
            },
            {
              field: 'CASE_NUM', header: 'Case ID', width: '110px', description: 'Case Number'
            },
            {
              field: 'TOUCH', header: 'Touch', width: '43px', description: 'Touch'
            },
            {
              field: 'CON_FIRM', header: 'Company Name', width: '180px', description: 'Company Name'
            },
            {
              field: 'TIMEZONE', header: 'Time Zone', width: '125px', description: 'Time ZOne'
            },
            {
              field: 'respondentTimeString', header: 'Resp. Time', width: '130px', description: 'Respondent time'
            },
            {
              field: 'contactName', header: 'Contact Name', width: '160px', description: 'contact name'
            },
            {
              field: 'phoneNumber', header: 'Phone Number', width: '160px', description: 'Phone number'
            },
            {
              field: 'ACTIVE_UNITS_COUNT', header: 'Act. Unt Cnt', width: '54px', description: 'Active Unit count'
            },
            {
              field: 'UNITS_CNT', header: 'Unt Cnt', width: '54px', description: 'Unit count'
            },
            {
              field: 'FIPS', header: 'FIPS', width: '54px', description: 'FIPS'
            },
            {
              field: 'EI_NUMBER', header: 'EI#', width: '69px', description: 'EI Number'
            },
            {
              field: 'PANEL_NUM', header: 'Panel#', width: '69px', description: 'Panel Number'
            },
            {
              field: 'CMI', header: 'CMI', width: '69px', description: 'CMI'
            }
          ];
        } else {
          this.cols = [];
        }
        break;
      default:
        break;
    }
  }
}
