import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, Observer, Subscription } from 'rxjs';
import { CaseDetailsComponent } from '../../case-details/case-details.component';
import { CaseDetailsService } from '../case-details.service';
import { ConfirmationService } from 'primeng/api';
import { CollectionsService } from '../collections.service';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';

// Prasad - 06/17/2020
@Injectable()
export class CaseDetailsSaveGuard implements CanDeactivate<CaseDetailsComponent> {

  confirmationSubscription: Subscription;

  constructor(private confirmationService: ConfirmationService,
              private tcwSaveAllService: TcwSaveAllService) {

  }

  canDeactivate(component: CaseDetailsComponent, currentRouteState: ActivatedRouteSnapshot, nextState: RouterStateSnapshot): Observable<boolean> {

    if (!this.tcwSaveAllService.getCaseDirty() && !this.tcwSaveAllService.getCollectionDataDirty()) {
      return of(true);
    }

      // tslint:disable-next-line: deprecation
    const observable = Observable.create((observer: Observer<boolean>) => {
      try {
          this.confirmationService.confirm({
            header: 'Edit Confirmation',
            message: 'Do you want to close case without saving ?',
            acceptLabel: 'Yes - Close without saving (1)',
            rejectLabel: 'No - Return to Case (2)',
            accept: () => {
                // clear dirty flag so the next time around it doesn't take the old flag
                this.tcwSaveAllService.setCaseNotDirty();
                this.tcwSaveAllService.setCollectionDataDirty(false);
                observer.next(true);
                observer.complete();
            },
            reject: () => {
                observer.next(false);
                observer.complete();
            }
        });
      } catch (e) {
        console.log('some');
      }
    });
    return observable;
  }
}
