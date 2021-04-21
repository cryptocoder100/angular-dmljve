import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import * as fromCaseDetails from '../store/case-details.reducer';
import { Case } from '../../shared/models/case.model';
import {TabMenuModule} from 'primeng/tabmenu';
import { MenuItem, ConfirmationService } from 'primeng/api';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { CaseDetailsService } from '../services/case-details.service';
import { Route } from '@angular/compiler/src/core';
import { TcwConstantsService } from 'src/app/core/services/tcw-constants.service';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { UnitService } from '../services/unit.service';
import { Unit } from 'src/app/shared/models/unit.model';
import { Subscription, Observable, of } from 'rxjs';
import { CollectionsService } from '../services/collections.service';
import { CollectionsUnit } from '../collection/models/collection-unit.model';

@Component({
  selector: 'fsms-tcw-case-details',
  templateUrl: './case-details.component.html',
  styleUrls: ['./case-details.component.css'],
})
export class CaseDetailsComponent implements OnInit, OnDestroy {

  // caseDetailsSaving$ = this.caseDetailsService.caseDetailsSaving$;

   // backing variable that wil be used to not loose data entry values when switching between tabs
   collectionUnitListVm: CollectionsUnit[] = null;

  tabMenuItems: MenuItem[];
  caseDetails: Case;
  currentUser: string;
  isReadOnlyCase = false;
  tabSubscription: Subscription;



  constructor(private store: Store<fromCaseDetails.State>,
              private activatedRoute: ActivatedRoute,
              private uiConfigService: UIConfigService,
              private caseDetailsService: CaseDetailsService,
              private collectionsService: CollectionsService,
              private tcwConstantsService: TcwConstantsService,
              private router: Router,
              private unitService: UnitService) {
      this.store.select(fromAuth.getUserEnvironment).pipe(take(1)).subscribe(userEnv => {
        this.currentUser = userEnv.currentUser.userId;
      });
  }

  ngOnInit() {
    this.uiConfigService.SetOpenCaseDisabledOrEnabled(false);

    this.caseDetails = this.activatedRoute.snapshot.data.caseDetails;
    this.caseDetailsService.setSelectedCaseDetails(this.caseDetails);

    if (this.caseDetails.caseLock && this.caseDetails.caseLock.lockedBy) {
      const lockedByUser: string = this.caseDetails.caseLock.lockedBy;

      if (lockedByUser !== this.currentUser) {
        this.isReadOnlyCase = true;
        this.uiConfigService.SetErrorDialogMessage('This case is locked by ' + this.caseDetails.caseLock.lockedBy + '.  It is read-only.');
      }
    }

    this.tabMenuItems = [
      { label: 'Address/Enrollment', routerLink: 'addressEnrollment' }
    ];

    this.unitService.populateAllUnitsForCase(this.caseDetails.CASE_NUM).subscribe((data: Unit[]) => {
      console.log('Retrieved ' + data.length + ' unit(s) for case');
      this.populateConstantsAndConstructTabs();
    }, (error: TcwError) => {
      console.error('Could not retrieve units');
      this.populateConstantsAndConstructTabs();
    });
  }

  populateConstantsAndConstructTabs() {
    this.tcwConstantsService.getConstants().pipe(take(1)).subscribe(data => {
      this.constructTabs();
    }, (err: TcwError) => {
      console.error('Could not get constants');
      this.constructTabs();
    });
  }

  constructTabs() {
    if (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') {
      this.router.navigate(['./addressEnrollment'], {relativeTo: this.activatedRoute});
      this.caseDetailsService.setHasCollection(false);


      // Prasad - subscribe to this onInit so when the enrollment is complete, a collection and its route is set dynaically later
      this.tabSubscription = this.caseDetailsService.hasCollection$.subscribe(hasCollection => {
        if (hasCollection) {
          this.tabMenuItems.push({ label: 'Collection', routerLink: 'collection' });
          this.tabSubscription.unsubscribe();
        }
      });
    } else {
      this.tabMenuItems.push({ label: 'Collection', routerLink: 'collection' });
      this.router.navigate(['./collection'], {relativeTo: this.activatedRoute});
      this.caseDetailsService.setHasCollection(true);

    }
  }

  ngOnDestroy() {
    this.collectionUnitListVm = null;
    if (this.tabSubscription) {
      this.tabSubscription.unsubscribe();
    }
    this.collectionsService.onCaseDetailsDestroy();
  }
}
