
import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { CaseListService } from '../services/case-list.service';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { TabView } from 'primeng/tabview';
import { Observable, Subscription } from 'rxjs';
import { Case } from 'src/app/shared/models/case.model';
import { GridType } from '../model/grid-type.enum';
import { SurveyId } from '../../shared/models/survey-id.enum';
import { map, take } from 'rxjs/operators';
import { TcwSchedulerService } from 'src/app/case-toolbar/case-scheduler/services/tcw-schedler.service';
import { TcwMaintenanceService } from 'src/app/core/services/tcw-maintenance.service';

@Component({
  selector: 'fsms-tcw-caselist',
  templateUrl: './caselist.component.html',
  styleUrls: ['./caselist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CaselistComponent implements OnInit, OnDestroy {
  @ViewChild(TabView, { static: false }) tabView: TabView;

  surveyId: string;
  refreshButtonClass$ = new Observable<string>();
  tabToReturnTo$ = new Observable<string>();
  subs: Subscription;
  caseList: Case[];
  gridTypes = GridType;
  surveyTypes = SurveyId;
  isAdmin: boolean;

  // Corresponds to GridType Enum
  headers = ['Scheduled', 'Unscheduled', 'Edit', 'Parked'];
  activeTabIndex = 0;




  constructor(private uiConfigService: UIConfigService,
              private tcwMaintenanceService: TcwMaintenanceService,
              private schedulerService: TcwSchedulerService,
              private caseListService: CaseListService) {

  }


  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit() {
    // on push new value change tab
    this.subs = this.schedulerService.switchCaseListTabAfterScheduling$
    .subscribe((schedTabName: string) => {
      this.manualTabSwitch(schedTabName);
    });



    this.surveyId = this.caseListService.getSurveyId();
    this.refreshButtonClass$ = this.caseListService.caseRefreshNotification$;
    this.isAdmin = this.caseListService.isAdmin;
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(true);

    const tabName = this.caseListService.getCaseListTabToReturnOnSave();
    this.manualTabSwitch(tabName);
  }

  onTabViewChange(event) {
    const selectedTab = this.tabView.tabs[event.index].header;
    this.activeTabIndex = this.headers.findIndex(a => a === selectedTab);
    this.uiConfigService.SetParkCaseDropDown(selectedTab === this.headers[GridType.Parked]);
    this.caseListService.TabSwitch(selectedTab);
  }

  manualTabSwitch(tabName: string) {
    if (tabName !== '') {
        // expected avtive tab is different - fire tab swtich
        this.activeTabIndex = this.headers.findIndex(a => a === tabName);
        this.uiConfigService.SetParkCaseDropDown(tabName === this.headers[GridType.Parked]);
        this.caseListService.TabSwitch(tabName);
      }
  }


  fetchFreshData(): void {
    this.caseListService.fetchCaseData();
  }
}
