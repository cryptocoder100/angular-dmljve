import { Injectable } from '@angular/core';
import { Observable, throwError, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { TcwError } from 'src/app/shared/models/tcw-error';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { ExplCode } from 'src/app/shared/models/expl-code.model';
import { LookupService } from 'src/app/core/services/lookup.service';
import * as _ from 'lodash';
import { Unit } from 'src/app/shared/models/unit.model';
import { Constants } from 'src/app/shared/models/constants.model';
import { TcwConstantsService } from 'src/app/core/services/tcw-constants.service';
import { CaseDetailsService } from './case-details.service';
import { Case } from 'src/app/shared/models/case.model';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { Store } from '@ngrx/store';
import { CollectionsCesMicroDataDto } from 'src/app/shared/models/collections-microdata.model';
import { HttpParams } from '@angular/common/http';
import { CollectionsUnit } from '../collection/models/collection-unit.model';




@Injectable({
  providedIn: 'root'
})
export class UnitService {
  // deep cloned untouched Unit Object from server
  pristineClonedUnit: Unit[] = null;




  /* bindable observables */
  isCES: boolean;
  isCESSubs = this.lookupService.IsCES$.subscribe(c => this.isCES = c);

  selectedCaseNum = null;

  currentEnvironmentVariables: EnvironmentDetails;

  // subject rxjs to trigger setting case REPT_MODE etc.,
  // 1. JOLTS page's button click causes this observable to be processed in case-details service through
  // unit service.
  setRolloverCallCompletedSUbject = new BehaviorSubject<boolean>(false);
  setRolloerCallComplete$ = this.setRolloverCallCompletedSUbject.asObservable();

  collectionYear: string;
  collectionMonth: string;
  unitsCount$: Observable<number>;


   // TODO: check if its used else remove it
   UnitList$: Observable<Unit[]>;

   // Using this in the collection service
   units$: Observable<Unit[]> =  this.tcwHttpService.httpGet<Unit[]>('api/Units/' + this.selectedCaseNum).pipe(
    map((data: Unit[]) => {
      console.log('unit$ making http call in unit service to get all units');
      if (this.isCES) {
        // only active units
        return this.unitList.filter(a => a.DispositionCode === '99' || a.DispositionCode === '00');
      } else {
        return this.unitList;
      }
    })
  );

   // constatns observable
   Constants$ = this.tcwConstantsService.getConstants();

   // get states from constants
     State$ = (this.Constants$ as Observable<Constants>).pipe(
       map(c => c.States));


   /* non-observable array of units */

   // used in address enrollment
   unitList: Unit[] = [];

   dirtyUnitPKs: string[] = [];

   selectedCase: Case = null;
   // used fro holding selected values CC!
   selectedExplationCode: ExplCode = null;


   constructor( private store: Store<fromApp.AppState>,
                private lookupService: LookupService,
                private tcwConstantsService: TcwConstantsService,
                private tcwHttpService: TcwHttpService ) {
                 // get all environment variables
                this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
                  // this.currentLoggedInUser = authState.userEnvironment.currentUser.userId;
                });

                // this.collectionYear = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_YEAR').envValue;
                // this.collectionMonth = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_MONTH').envValue;


  }



  setUnitList(unitList: Unit[]) {
    this.unitList = unitList;
  }


   IsMultiUnitCollectionCase(): boolean{
     if(this.unitList != null) {
      return this.unitList.filter(a => a.DispositionCode === '99' || a.DispositionCode === '00').length > 1;
     }
     return false;
   }

  // used in rollover
  isActiveUnit(UnitdispCode: string, CaseConversionRefCode: string) {
    let result = false;
    if (!this.lookupService.isRespCodeFinal(UnitdispCode) || this.lookupService.isRespCodeNonResponse(UnitdispCode)) {
        result = true;
    }
    if (!result) {
        if (this.lookupService.isRespCodeRefusal(UnitdispCode) && CaseConversionRefCode != null && CaseConversionRefCode.trim() !== '') {
            result = true;
        }
    }
    return result;
  }

  // used in rollover page to set OfferToState enable/not
  isUnitFlaggedOffer(collectionYear: string, collectionMonth: string) {
    let  flag = true;
    const collectionDate = new Date(+collectionYear, +collectionMonth - 1);
    if (this.unitList != null && this.unitList.length  > 0) {
      this.unitList.forEach(u => {
        if (u.OfferDate != null) {
         if (new Date(u.OfferDate.getFullYear(), u.OfferDate.getMonth()).getTime() > collectionDate.getTime()) {
            flag = false;
          }
        } else {
          flag = false;
        }
      });
    }
    return flag;
  }


  setRefusalForAllUnits() {
    let aggregateUnit = false;
    this.unitList.forEach(un => {
      if (un.DispositionCode === '74') {
        aggregateUnit = true;
      }
    });

    if (aggregateUnit) {
      // show notification - "Disposition Code 20 has not been assigned to any unit. Since the case contains aggregated units.", "Warning! Not be able to assign DC 20 to all units.
    } else {
      this.unitList.forEach(un => {
        un.DispositionCode = '20';
      });
    }
  }

  setOutOfBussinessForAllUnits() {
    let aggregateUnit = false;
    this.unitList.forEach(un => {
      if (un.DispositionCode === '74') {
        aggregateUnit = true;
      }
    });

    if (aggregateUnit) {
      // show notification - "Disposition Code 50 has not been assigned to any unit. Since the case contains aggregated units. "Warning! Not be able to assign DC 50 to all units.
    } else {
      this.unitList.forEach(un => {
        un.DispositionCode = '50';
      });
    }
  }

  setUnitDirty(unitPK: string) {
    if (this.dirtyUnitPKs.findIndex(un => un === unitPK) === -1) {
      this.dirtyUnitPKs.push(unitPK);
    }
  }

  setAllUnitsNotDirty() {
    this.dirtyUnitPKs = [];
  }

  setAllUnitsDirty() {
    this.dirtyUnitPKs = [];
    this.unitList.forEach(un => {
      this.dirtyUnitPKs.push(un.unitPK);
    });
  }

  getPopulatedUnitAListsObservable(): Observable<Unit[]> {
    return of(this.unitList);
  }

  // only when case in AE mode (for changes in respcode when in collections - look in collections service)
  calculateUnitRespCode(unit: Unit, caseReptMode: string): string {
    if (caseReptMode === 'A' || caseReptMode === 'E') {
      if (this.isCES) {
        if (this.lookupService.isRespCodeFinal(unit.DispositionCode)) {
          return unit.DispositionCode;
        } else {
          return '00';
        }
      } else {
        return unit.DispositionCode;
      }
    }
  }

  // called from JOLTS toolbargrid component when user clicked on rollover call complete
  onReportingRollOverCallComplete(isComplete: boolean) {
    this.setRolloverCallCompletedSUbject.next(isComplete);
  }



  // get all code for explanation drop down CC1
  getExplanationCodeForCollections(IsCES): ExplCode[] {
    const explCodes: ExplCode[] = this.lookupService.getExplCode(IsCES);
    explCodes.forEach(item => item.text = `${item.displayOrder}  -  ${item.desc}`);
    return explCodes;
  }



  // called fro m case-details component on selection of a case - to get a list of units
  populateAllUnitsForCase(caseNum: string): Observable<Unit[] | TcwError> {
    this.unitList = [];
    this.selectedCaseNum = caseNum;
    return this.tcwHttpService.httpGet<Unit[]>('api/Units/' + caseNum).pipe(
      // .subscribe((data: Unit[]) => this.unitList = data.map(un => new Unit(un)));
      tap((data: Unit[]) => {
        this.unitList = data.map(un => new Unit(un));

         // also do a deep clone of unit list for later use
         this.pristineClonedUnit = _.cloneDeep(this.unitList);
         console.log('Initial pristine units ' + JSON.stringify(this.pristineClonedUnit));

        console.log('populateallunitforcase called from case-details component at the beginning');
        if (this.isCES) {
          const activeUnits = this.unitList.filter(a => a.DispositionCode === '99' || a.DispositionCode === '00');
          this.unitsCount$ = activeUnits ?  of(activeUnits.length) : of(0);
        } else {
          this.unitsCount$ = this.unitList ?  of(this.unitList.length) : of(0);
        }

      })
    );
  }


  updatePristineCloneUnit(caseNum: string): Observable<boolean | TcwError> {
    // also do a deep clone of unit list for later use
    // if(updatedMicroDataList != null && unitId != null) {
    //   const currentPristineUnit = this.pristineClonedUnit.find(a => a.unitPK === unitId);
    //   currentPristineUnit.CesMicroDataList =  _.cloneDeep(updatedMicroDataList);
    // }
    console.log('about to make to callto update pristine after save success');

    return this.tcwHttpService.httpGet<Unit[]>('api/Units/' + caseNum).pipe(
      map((data: Unit[]) => {
        this.unitList = data.map(un => new Unit(un));

         // also do a deep clone of unit list for later use
         this.pristineClonedUnit = _.cloneDeep(this.unitList);
         console.log('update pristine after save success is sucessful');

         console.log('newer prissinte ' + JSON.stringify(this.pristineClonedUnit));
         return true;
      })
    );

  }



  updatePristineCloneMultiUnit(caseNum: string, currentSelectedUnitId: string): Observable<boolean | TcwError> {
    // also do a deep clone of unit list for later use
    // if(updatedMicroDataList != null && unitId != null) {
    //   const currentPristineUnit = this.pristineClonedUnit.find(a => a.unitPK === unitId);
    //   currentPristineUnit.CesMicroDataList =  _.cloneDeep(updatedMicroDataList);
    // }
    let savedMicroData: CollectionsCesMicroDataDto[] = null;
    console.log('about to make to callto update pristine after save success ' + currentSelectedUnitId);
    let currentSelectedUnit: Unit = this.unitList != null ? this.unitList.find(a => a.unitPK === currentSelectedUnitId) : null;
    console.log('found the unit to for pristine after save success ' + JSON.stringify(currentSelectedUnit));

    // first fetch the saved microdata for the currentunit to update cache
    // and if its multi unit - need to bring that selected unit to update on cache
    if(currentSelectedUnit != null) {
      if(this.IsMultiUnitCollectionCase()) {
        console.log('making a mutlit unit fetching the current unit - ' + currentSelectedUnit.StateCode + ' ' + currentSelectedUnit.ReportNum);
        const params = new HttpParams().set('stateCode', currentSelectedUnit.StateCode).set('reptNum', currentSelectedUnit.ReportNum);
          this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params)
          .subscribe((result: CollectionsCesMicroDataDto[]) => {
              savedMicroData = result;
              console.log('mutlit unit fetching the current - ' + JSON.stringify(savedMicroData));
          });
      }
    }


    console.log('completed mutlit unit fetching the current -starting full fetch');
    // fetching saved  the list of units
    return this.tcwHttpService.httpGet<Unit[]>('api/Units/' + caseNum).pipe(
      map((data: Unit[]) => {
        this.unitList = data.map(un => new Unit(un));

         // do a deep clone of unit list as cache
         this.pristineClonedUnit = _.cloneDeep(this.unitList);

         console.log('finshed fiethcing and cloned to prisetine cunit');

         // if its  a multi unit - then add the microdata fetched in previous step to this cache for tracking
         if(this.IsMultiUnitCollectionCase()) {
          console.log('setting previous fetched microdata to newly pristine clone');
          let pristineClonedUnit = this.pristineClonedUnit.find(a => a.unitPK === currentSelectedUnit.unitPK);
          if(pristineClonedUnit != null) {
            pristineClonedUnit.CesMicroDataList = _.cloneDeep(savedMicroData);
          }
         }

         console.log('update pristine after save success is sucessful');

         console.log('newer prissinte ' + JSON.stringify(this.pristineClonedUnit));
         return true;
      })
    );




  }





  onDestroy() {
    // this.unitList = null;
    this.isCESSubs.unsubscribe();
  }

  // gets non-observable value of unit list
  getUnitList(): Unit[] {
    return this.unitList;
  }

}
