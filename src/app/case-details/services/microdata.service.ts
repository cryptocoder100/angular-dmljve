import { Injectable } from '@angular/core';
import { ExplCode } from '../../shared/models/expl-code.model';
import { LookupService } from '../../core/services/lookup.service';
import { TcwConstantsService } from '../../core/services/tcw-constants.service';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { CollectionsCesMicroData, CollectionsCesMicroDataDto } from 'src/app/shared/models/collections-microdata.model';
import { Observable, Subject, of, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { CollectionsUnit } from '../collection/models/collection-unit.model';
import { HttpParams } from '@angular/common/http';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { CollectionsService } from './collections.service';
import { ScreeningParameters, ScreeningParametersDto } from 'src/app/shared/models/screening-parameters-dto.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MicrodataService {

  onCollectionsUnitChangedSubject: BehaviorSubject<CollectionsUnit> = new BehaviorSubject<CollectionsUnit>(null);
  collectionsUnitChanged$: Observable<CollectionsUnit> = this.onCollectionsUnitChangedSubject.asObservable();

  cesMicroData: CollectionsCesMicroData[] = null;

  // observalbe to fetch and return microdata from server
  cesMicroData$: Observable<CollectionsCesMicroDataDto[] | TcwError>;

   /* bindable observables */
   isCES = this.lookupService.IsCES$.subscribe(c => c);
   Constants$ = this.tcwConstantsService.getConstants();
   // used fro holding selected values CC1
   selectedExplationCode: ExplCode = null;



   constructor(private lookupService: LookupService,
               private tcwConstantsService: TcwConstantsService,
               private tcwHttpService: TcwHttpService,
               private collectionsService: CollectionsService) {

   }


  onCollectionsUnitChanged(unit: CollectionsUnit ) {
     // emit data to the observable to trigger http call
    this.onCollectionsUnitChangedSubject.next(unit);

   }

   getMicroDataForUnit(stateCode: string, reptNum: string, screeningParams: ScreeningParametersDto, scheduleType: string): Observable<CollectionsCesMicroData[]> {
      // let microdataRows: CollectionsCesMicroData[] = [];
      // set needed parameters and values to fetch http request
      const params = new HttpParams().set('stateCode', stateCode).set('reptNum', reptNum);
      return this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params).pipe(
        map((result: CollectionsCesMicroDataDto[]) => {
        // map microdatadto to view model and calcualte ratios
        // return this.collectionsService.mapMicroDataDtoToMicroDataViewModel(screeningParams, scheduleType, result);
        return [];
      }));
      // this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params).subscribe((result: CollectionsCesMicroDataDto[]) => {
      //   // map microdatadto to view model and calcualte ratios
      //   microdataRows = this.collectionsService.mapMicroDataDtoToMicroDataViewModel(screeningParams, scheduleType, result);
      // });
      //return microdataRows;
   }



}
