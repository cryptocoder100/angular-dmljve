import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Case } from 'src/app/shared/models/case.model';
import { CaseDetailsService } from '../services/case-details.service';
import { map, catchError, subscribeOn, tap } from 'rxjs/operators';
import { Observable, of, throwError, EMPTY, Subscription, BehaviorSubject } from 'rxjs';
import { Unit } from 'src/app/shared/models/unit.model';
import { SplitComponent, SplitAreaDirective } from 'angular-split';
import { UnitService } from '../services/unit.service';
import { MicrodataService } from '../services/microdata.service';
import { CaseSummary } from 'src/app/shared/models/case-summary.model';
import { summaryFileName } from '@angular/compiler/src/aot/util';
import { LookupService } from 'src/app/core/services/lookup.service';
import { CollectionsUnit } from './models/collection-unit.model';
import { CollectionsService } from '../services/collections.service';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { CaseListService } from 'src/app/case-list/services/case-list.service';
import { JoltsCollectionsService } from '../services/jolts-collections.service';
import { MessageService } from 'primeng/api';
import { RolloverReminder } from 'src/app/shared/models/collections-microdata.model';
import { CaseSummaryComponent } from './case-summary/case-summary.component';


@Component({
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit, AfterViewInit, OnDestroy {



  /* bindable observables */
  // prepare and set values for case and casesummary object
  caseSummary$: Observable<CaseSummary> = this.caseDetailsService.selectedCase$.pipe(
                                                // tap(c => console.log(JSON.stringify(c))),
                                                map(c => this.createCaseSummary(c)),
                                                catchError(this.handleError));

  dropUnitSubs: Subscription;
  reminderSubs: Subscription;
  reminderInfo: RolloverReminder = null;


    // splitter transitino
  only = 0;
  // observable to show JOLTS or CES micro
  isCES$ = this.lookUpService.IsCES$;

  // error observable to show any errors on this page
  error$: Observable<string>;

  dropUnitMessage = null;
  // splitter related variables
  notesSplitterPanelSize: number;
  surveyId: boolean;
  selectedCaseNum: string;
  split: SplitComponent;
  area1: SplitAreaDirective;
  area2: SplitAreaDirective;

  // @ViewChild('caseSummaryElem', { read: CaseSummaryComponent, static: true}) caseSummaryElement: CaseSummaryComponent;


  constructor(private caseDetailsService: CaseDetailsService,
              private caseListService: CaseListService,
              private lookUpService: LookupService,
              private messageService: MessageService,
              private cesCollectionService: CollectionsService,
              private joltsCollectionService: JoltsCollectionsService,
              private uiConfigService: UIConfigService) { }


  ngOnDestroy(): void {
    this.cesCollectionService.onDestroyCollections();
    // this.dropUnitSubs.unsubscribe();
    // this.reminderSubs.unsubscribe();
  }

  ngAfterViewInit(): void {
    // this.caseSummaryElement.setFocus();
  }


  ngOnInit() {
    console.log('init of collection compone');
    const isCES = this.lookUpService.isCES;
    console.log(this.caseSummary$);


    if (isCES) {
      // subscribe to ces rollover reminder
      this.reminderSubs = this.cesCollectionService.onRolloverReminder$.subscribe(rolloverMsg => {
        // show toast
        if (rolloverMsg != null) {

          this.messageService.clear();
          this.messageService.add({key: 'rolloverRemindertoast', severity: 'warn', summary: rolloverMsg.title, detail: rolloverMsg.reminderMsg, sticky: true });
        }
      });

      // subscribe to drop units message
      this.dropUnitSubs = this.cesCollectionService.onDropUnitReminder$.subscribe(dropUnitMessage => {
        // show toast
        if (dropUnitMessage != null) {
          this.dropUnitMessage =  dropUnitMessage;
          this.messageService.clear();
          this.messageService.add({key: 'dropUnitRemindertoast', severity: 'warn', summary: '', detail: dropUnitMessage, sticky: true });
        }
      });
    } else { // subscribe to jolts rollover reminder
      this.reminderSubs = this.joltsCollectionService.onRolloverReminder$.subscribe(rolloverMsg => {
        // show toast
        if (rolloverMsg != null) {
          this.messageService.clear();
          this.messageService.add({key: 'rolloverRemindertoast', severity: 'warn', summary: rolloverMsg.title, detail: rolloverMsg.reminderMsg, sticky: true });
        }
      });
    }
  }


  // create summary view model to bind
  createCaseSummary(c: Case): CaseSummary {
    // call into case list service and set the current selected case for future use
    this.caseListService.setCaseDetails(c);

    // create view model
    const caseSummary: CaseSummary  = {
        CaseNum: c.CASE_NUM,
        Owner: c.USER_ALLOC,
        ScheduledDate: c.SCHED_DATE_TIME,
        Contact:  `${c.CON_FIRST}, ${c.CON_LAST}`,
        ContactFirm: c.CON_FIRM,
        Title: c.CON_TITLE,
        Email: c.EMAIL_ADDRESS,
        Phone: c.PHONE_NUM != null ? '(' + c.PHONE_PRE + ') ' + c.PHONE_NUM.substr(0, 3) + '-' + c.PHONE_NUM.substr(3) : null,
        Supervisor: c.SUPERVISOR_ID == null ? 'N/A' : c.SUPERVISOR_ID ,
        City: c.CITY,
        Form: c.SCHED_TYPE,
        State: c.STATE,
        ReportCond: c.REPT_COND,
        Mode: (c.REPT_COND === null || c.REPT_COND === '' || c.REPT_COND === undefined) ? c.REPT_MODE : c.REPT_MODE + '-' + c.REPT_COND
      };
      // if report mode is N-N disable dialer
    if (caseSummary.Mode === 'N-N' || caseSummary.Mode === 'N') {
        this.uiConfigService.setDialerButtonDisabled(true);
      }

    return caseSummary;
  }



  pullUp() {
      switch (this.only) {
      case 0:
      case 1:
          this.only = 2;
          return;
      case 2:
          this.only = 1;
          return;
      }
  }

  pullDown() {
      switch (this.only) {
      case 0:
      case 1:
      case 2:
          this.only = 1;
          return;
      }
  }


  handleError(err) {
    // log technical error
    console.log(err);

    // replace with friendly error message
    this.error$ = of(`An error occurred loading case summary information in Collection page`);
    return EMPTY;
  }

}


