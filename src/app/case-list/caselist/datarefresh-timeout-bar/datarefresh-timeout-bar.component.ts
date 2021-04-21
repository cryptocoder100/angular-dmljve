import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CaseListService } from '../services/case-list.service';
import { MessageService } from 'primeng/api';
// import { MessageService } from 'primeng/api';

@Component({
  selector: 'fsms-tcw-datarefresh-timeout-bar',
  templateUrl: './datarefresh-timeout-bar.component.html',
  styleUrls: ['./datarefresh-timeout-bar.component.css']
})
export class DatarefreshTimeoutBarComponent implements OnInit, OnDestroy {

  progressBarValue$ = new Observable<number>();
  progressBarSubscription: Subscription;

  constructor(private caseListService: CaseListService, private messageService: MessageService) { }

  ngOnInit() {
    this.progressBarValue$ = this.caseListService.value$;
    this.caseListService.runRefreshBarTimer();

    this.progressBarSubscription = this.progressBarValue$.subscribe((p: number) => {
      if (p <= 0) {
        this.messageService.add(
          {
            severity: 'success',
            summary: 'Refresh Alert',

            // tslint:disable-next-line: max-line-length
            detail: 'It has been ' + this.caseListService.minutesToRefresh + ' min since you have updated your case list. Please take a moment to refresh your case list by clicking the glowing red referesh button',
            life: 10000
          });
      }
    });
  }

  ngOnDestroy() {
    this.progressBarSubscription.unsubscribe();
  }
}
