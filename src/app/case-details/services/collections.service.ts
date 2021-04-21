import { Injectable } from '@angular/core';
import { UnitService } from './unit.service';
import { map, tap, take, catchError } from 'rxjs/operators';
import { LookupService } from 'src/app/core/services/lookup.service';
import { AddressType } from 'src/app/shared/models/address.model';
import { CollectionsUnit, DropUnit } from '../collection/models/collection-unit.model';
import { Observable, BehaviorSubject, of, EMPTY, throwError } from 'rxjs';
import { Unit } from 'src/app/shared/models/unit.model';
import { CollectionsCesMicroDataDto, CollectionsCesMicroData, MicroDataCellContextError, MicroRatioCellContextError, CollectionsMutliPayMicroDataGroup, CollectionsCesMultiPayMicroData, checkCesCodeType, getAdjustedDelinquentCode, RolloverReminder } from 'src/app/shared/models/collections-microdata.model';
import { EditScreenValidationService } from './edit-screen-validation.service';
import { MicroRatioService } from './micro-ratio.service';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { ScreeningParametersDto, ScreeningParameters } from 'src/app/shared/models/screening-parameters-dto.model';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import { Store } from '@ngrx/store';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { HttpParams } from '@angular/common/http';
import { TcwError } from 'src/app/shared/models/tcw-error';
import * as moment from 'moment';
import { MultiPayService } from './multi-pay.service';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import { CesMultiPay } from 'src/app/shared/models/ces-multipay.model';
import { LdbCheckService } from './ldb-check.service';
import { QuiData } from 'src/app/shared/models/quidata.model';
import { MicroDataCellObject } from '../collection/models/microdata-cell-object.model';
import { createUrlResolverWithoutPackagePrefix } from '@angular/compiler';
import { Case } from 'src/app/shared/models/case.model';
import { CaseDetailsService } from './case-details.service';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { CaseListService } from 'src/app/case-list/services/case-list.service';
import { ExplCode } from 'src/app/shared/models/expl-code.model';
import { RolloverService } from './rollover.service';
import { TcwNotesService } from 'src/app/core/services/tcw-notes.service';
import * as _ from 'lodash';

type PreviousPeriod = {
  refMM: number;
  refYY: number;
};




@Injectable({
  providedIn: 'root'
})
export class CollectionsService {

  collectionsUnitListCache: CollectionsUnit[] = null;

collectionYearMonthMoment: moment.Moment;
cutOffYearMonthMoment: moment.Moment;
collectionYear: string;
collectionMonth: string;
AeLdbCheckMonth: string = null;
_isUnitSwitching = false;
  get IsUnitSwitching(): boolean {
    return this._isUnitSwitching;
  }
  set IsUnitSwitching(value: boolean) {
   this._isUnitSwitching = value;
  }


_multiPayHeaderTextRC: string;
get MultiPayHeaderTextRC(): string {
  return this._multiPayHeaderTextRC;
}
set MultiPayHeaderTextRC(value: string) {
  this._multiPayHeaderTextRC = value;
}

isCollectionDataDirty = false;


currentUserSelectedMicroRowMonth: string;
currentUserSelectedMicroRowYear: string;
currentSeletectedCase: Case;

aeLdbYearAgo: string | number = null;


// TODO: replace this wth skipSetRc
allowToSetMicroDataRC = false;
canSkipAeLebCheck = false;

// selected unit backing variable
currentSelectedUnit: CollectionsUnit = null;
// backing variable for observable for ease of manipulation later
currentSelectedUnitCesMultiPayMicroRowGroups: CollectionsMutliPayMicroDataGroup[];

currentEnvironmentVariables: EnvironmentDetails = null;

// action subject to notify component cahanges in microdata list
onCollectionUnitChangedScreeningParamsSubject: BehaviorSubject<ScreeningParameters> = new BehaviorSubject<ScreeningParameters>(null);
selectedScreeningParams$: Observable<ScreeningParameters> = this.onCollectionUnitChangedScreeningParamsSubject.asObservable();

// action subject to notify component cahanges in microdata list
showMicroDataGridOnGoodDCSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
showMicroDataGridOnGoodDC$: Observable<boolean> = this.showMicroDataGridOnGoodDCSubject.asObservable();

// action stream on unit changed event
onRolloverReminderSubject: BehaviorSubject<RolloverReminder> = new BehaviorSubject<RolloverReminder>(null);
onRolloverReminder$: Observable<RolloverReminder> = this.onRolloverReminderSubject.asObservable();

// action stream for DropUnit Reminder message
onDropUnitReminderSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
onDropUnitReminder$: Observable<string> = this.onDropUnitReminderSubject.asObservable();

// rxjs subject to emit appropriate string when multipay is open and closed
// we want by default to allow to enter numbers in main colleciton grid
// but when we open multipay - we want to be able to not disable the extbox but restrict from entering
// numbers - on to the main collection cells
noCharInputRegExOnMultiPaySubject: BehaviorSubject<string> = new BehaviorSubject<string>('pint');
noCharInputRegExOnMultiPay$: Observable<string> = this.noCharInputRegExOnMultiPaySubject.asObservable();

// subject observable to set LDB error dialog when error
hasLdbErrorSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
hasLdbError$: Observable<boolean> = this.hasLdbErrorSubject.asObservable();

// subject observable to show/hide the notice text on LDB error dialog when error
onLdbErrorIsUnitNAICSValidSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
onLdbErrorIsUnitNAICSValid$: Observable<boolean> = this.onLdbErrorIsUnitNAICSValidSubject.asObservable();


// action subject whennusers change unit
onCollectionUnitChangedSubject: BehaviorSubject<CollectionsUnit> = new BehaviorSubject<CollectionsUnit>(null);
collectionUnitChanged$: Observable<CollectionsUnit> = this.onCollectionUnitChangedSubject.asObservable();

// action subject to cache unit
saveToCacheCollectionDataSubject: BehaviorSubject<CollectionsUnit[]> = new BehaviorSubject<CollectionsUnit[]>(null);
saveToCacheCollectionData$: Observable<CollectionsUnit[]> = this.saveToCacheCollectionDataSubject.asObservable();

// action subject to notify component cahanges in microdata list
onCollectionUnitChangedMicroDataSubject: BehaviorSubject<CollectionsCesMicroData[]> = new BehaviorSubject<CollectionsCesMicroData[]>([]);
CollectionMicroData$: Observable<CollectionsCesMicroData[]> = this.onCollectionUnitChangedMicroDataSubject.asObservable();

// action subject for multipay data whenn users change unit
onCollectionUnitChangedMultiPayDataSubject: BehaviorSubject<CollectionsMutliPayMicroDataGroup[]> = new BehaviorSubject<CollectionsMutliPayMicroDataGroup[]>([]);
CollectionMultiPayMicroData$: Observable<CollectionsMutliPayMicroDataGroup[]> = this.onCollectionUnitChangedMultiPayDataSubject.asObservable();

// action subject for multipay data whenn users change unit
onCollectionNoteActionsSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
CollectionNotesActions$: Observable<boolean> = this.onCollectionNoteActionsSubject.asObservable();


// backing variable for observable for ease of manipulation later
collectionUnitListVm: CollectionsUnit[] = null;


// STEP1 : This observable is the beggining of collection page build

// create a view model list Observable by mapping from the list of units[] DTO
// returned from the UnitService that calls http
// to view model list of CollectionsUnit[] to be bound HTML
collectionUnitListVmForDropdown$: Observable<CollectionsUnit[]> = this.unitService.units$
.pipe(
  map(units => {
        // units.map(unit => this.createCollectionsData(unit))
        return this.getCollectionsUnitListWithMicroData(units);
      }
    ),
    tap(cu => {
      console.log('dropdown called - fetching units by calling unit servive');
      // set the genrated Vm to backing vairable for later use
      this.collectionUnitListVm = cu;
      // also set the current selected unit backing variable
      this.currentSelectedUnit = cu[0]; // first unit
    }),
  );




// covernt and return as observable of units already prepared and stored in variable
collectionUnitListVm$: Observable<CollectionsUnit[]> = of(this.collectionUnitListVm)
    .pipe(
      map(units => units)
    );


  constructor(private unitService: UnitService,
              private lookupService: LookupService,
              private tcwHttpService: TcwHttpService,
              private caseListService: CaseListService,
              private store: Store<fromApp.AppState>,
              private rolloverService: RolloverService,
              // private caseDetailsService: CaseDetailsService,
              private editScreenService: EditScreenValidationService,
              private tcwNotesService: TcwNotesService,
              private ldbCheckService: LdbCheckService,
              private uiConfigService: UIConfigService,
              private multiPayService: MultiPayService,
              private microRatioService: MicroRatioService) {

                // get all environment variables
                this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
                  // this.currentLoggedInUser = authState.userEnvironment.currentUser.userId;
                });

                this.collectionYear = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_YEAR').envValue;
                this.collectionMonth = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_MONTH').envValue;
                this.collectionYearMonthMoment = moment({year: +this.collectionYear, month: +this.collectionMonth, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});
                // this.collectionYearMonthMoment = moment().month(+this.collectionMonth).year(+this.collectionYear);
                this.cutOffYearMonthMoment = (moment().month(+this.collectionMonth).year(+this.collectionYear)).subtract(12, 'months');

                // this value is gotten from Env Variables for ENVNAME - AE_LDB_CHECK_MONTH but this eenvname is not even present in DB. WHen no Envname use null
                const aeLdbCheckMonthVar = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'AE_LDB_CHECK_MONTH');
                if (aeLdbCheckMonthVar != null) {
                  this.AeLdbCheckMonth = aeLdbCheckMonthVar.envValue;
                }


            }


 // return a collectionsUnit list
 getCollectionsUnitListWithMicroData(units: Unit[]): CollectionsUnit[] {
  // check if cache data is avaiable and if not its first time load of collections and do createCollectiosnData.
  if(this.collectionsUnitListCache != null) {
    return this.collectionsUnitListCache;
  } else {
    return units.map(unit => this.createCollectionsData(unit));
  }
}

  // main method that transforms and processes the data from the server to a viewmodel + each
  // microdata view model wil be run through the edit errors/screening  errors whuile on first load
  createCollectionsData(unit: Unit, collectionsUnit: CollectionsUnit = null) {
    this.currentSeletectedCase  = this.caseListService.getCaseDetails();

    // map the DTO unit to Viewmodel if not already mapped
    if (collectionsUnit == null) {
      collectionsUnit  = this.mapUnitsDtoToUnitsViewModel(unit);
    }

    // prepare child objects of collections unit - microdata mapings
    collectionsUnit.CesMicroData =
          this.mapMicroDataDtoToMicroDataViewModel(unit.ScreeningParameters, unit.QUIData, unit.MPayStat, unit.ScheduleType, unit.CesMicroDataList, unit.AeLdbRc);


    // // set which ones are marked as historical data
    // this.markMicroDataRowsAsHistorical(collectionsUnit);

    return collectionsUnit;
  }


  // STEP 2: from teh list of units returned from server we build viewmodels and all its child microdata in STEP 3 etc.,
  // mapping - takes Unit Dto returns  view model type collectionsUnit
  mapUnitsDtoToUnitsViewModel(unit: Unit): CollectionsUnit {

    console.log('map units DTO called');

    // now, create unit viewmodel and add the mcirodata along with other unit information mapped
    const collectionsUnit: CollectionsUnit = {
      DispositionCode: unit.DispositionCode,
        DisplayValue: `${unit.StateCode} ${unit.ReportNum}   ${unit.PrimaryName} ___________ ${unit.DispositionCode}`,
        UnitId: unit.StateCode + unit.ReportNum,
        ReportNum: unit.ReportNum,
        StateCode: unit.StateCode,
        SampleStopDate: unit.SampleStopDate,
        Location: unit.Location,
        EditableStateAddress: this.lookupService.isCES ?
          unit.Addresses.find(a => a.AddressType === AddressType.PrimaryEditableAddress).State :
          unit.Addresses.find(a => a.AddressType === AddressType.UITaxAddress).State,
        PrimaryName: unit.PrimaryName,
        MPayStat: unit.MPayStat,
        IsMultiPayRoll: unit.MultiPayrollStatus,
        EmployeeType: unit.ScheduleType,
        ResponseCode: unit.RespCode,
        AeLdbRC: unit.AeLdbRc,
        QUIData: unit.QUIData,
        // CesMicroData: this.mapMicroDataDtoToMicroDataViewModel(unit.ScreeningParameters, unit.QUIData, unit.ScheduleType, unit.CesMicroDataList, unit.AeLdbRc),
        // CesMicroDataPayGroups: this.currentSelectedUnitCesMultiPayMicroRowGroups,
        ScreeningParameters: unit.ScreeningParameters,
    } as CollectionsUnit;

    // console.log(JSON.stringify(collectionsUnit.CesMicroDataPayGroups));
    return collectionsUnit;
  }


/*--------------------------------------------------------------------------------------- microdata related methods ---------------------------------------------------------------------------------*/

  // STEP 3: builds viewmodel for each microrow in a unit
  mapMicroDataDtoToMicroDataViewModel(screeningParams: ScreeningParametersDto, quiData: QuiData, mpayStat: string, scheduleType: string, cesMicroDataList: CollectionsCesMicroDataDto[], aeLdbRC: string): CollectionsCesMicroData[] {
    let microDataViewModelList: CollectionsCesMicroData[] = [];
    let prevMicrodataViewModel: CollectionsCesMicroData = null;

    if (cesMicroDataList != null && cesMicroDataList.length > 0) {


      // reverse order the array from oldest month-year to newest (reason - while building viewmodel for a microrow we need its prev month's microrow.
      // easier to build your prev micro first before move to newer micro rows).
      cesMicroDataList.reverse();

      console.log('map ces microdata for unit is called');

      console.log('ces micro from server and mapping : ' + JSON.stringify(cesMicroDataList));


        // foreach microdata from the server in DTO
      cesMicroDataList.forEach(microRow => {

          // do not include rows that are newer than collection month
          if (this.canSkipMicroRow(microRow.RefMM, microRow.RefYY)) {
            return;
          }

          // create new view model object
          let currentMonthMicrodataViewModel = new CollectionsCesMicroData();

          // get mapped microdata row
          currentMonthMicrodataViewModel = this.getMappedMicroDataOrMultiPayAsViewModel(microRow);

          // get mapped multipay group viewmodels
          currentMonthMicrodataViewModel.CesMultiPayGroups = this.getMappedMultiPayDtoToViewModelFor(microRow);

          // add employee type
          currentMonthMicrodataViewModel.EmployeeType = scheduleType;

          // set what cells are allowed for data collection
          this.disableMicroDataCellsForDataCollectionByEmployeeType(currentMonthMicrodataViewModel, mpayStat, scheduleType);

           // and add multipay from perv microrows
          if (prevMicrodataViewModel != null) {
            // extract multipaygroups prev month's pay groups - shallow copy
            const prevPayGroup1MicroRow = {...prevMicrodataViewModel.CesMultiPayGroups.find(a => a.PayGroupIndex === 1)
                                                  .cesMultiPayMicroRows.find(a => a.RefMM === prevMicrodataViewModel.RefMM && a.RefYY === prevMicrodataViewModel.RefYY)};
            currentMonthMicrodataViewModel.CesMultiPayGroups.find(a => a.PayGroupIndex === 1)
                                                  .cesMultiPayMicroRows.push(prevPayGroup1MicroRow);
            const prevPayGroup2MicroRow = {...prevMicrodataViewModel.CesMultiPayGroups.find(a => a.PayGroupIndex === 2)
                                                .cesMultiPayMicroRows.find(a => a.RefMM === prevMicrodataViewModel.RefMM && a.RefYY === prevMicrodataViewModel.RefYY)};
            currentMonthMicrodataViewModel.CesMultiPayGroups.find(a => a.PayGroupIndex === 2)
                                                  .cesMultiPayMicroRows.push(prevPayGroup2MicroRow);
            this.setCorrectPrLoppCmLoppForMultiPay(currentMonthMicrodataViewModel, prevPayGroup1MicroRow, prevPayGroup2MicroRow);

          }


          // caluclate/screen/check for edits etc.,
          this.processMicroDataRow(screeningParams, quiData, scheduleType, currentMonthMicrodataViewModel, prevMicrodataViewModel, aeLdbRC);

          // recalcualte RC under these conditions
          if (this.canRecalculateRC(prevMicrodataViewModel, currentMonthMicrodataViewModel)) {
                this.recalculateLpFactorsAndResponseCode(prevMicrodataViewModel, currentMonthMicrodataViewModel);
              }

          // set current becomes prev month microview model
          prevMicrodataViewModel = currentMonthMicrodataViewModel;

          // add to the main array of mcirodata to be sent to HTML on load
          microDataViewModelList.push(currentMonthMicrodataViewModel);

          // make sure to clear the referencing memory
          currentMonthMicrodataViewModel = null;
      });
      // reverse back to original order of descending time as per requirement
      microDataViewModelList.reverse();
      cesMicroDataList.reverse();

    }


    console.log(microDataViewModelList);

    // set the processed microdata list to the selected unit for later retrieval
    if (this.currentSelectedUnit != null) {
      // this.currentSelectedUnit.CesMicroData = microDataViewModelList;
      // also set the list to the list of units in collection service
      this.collectionUnitListVm.find(a => a.UnitId === this.currentSelectedUnit.UnitId).CesMicroData = microDataViewModelList;
    }
    return microDataViewModelList;
  }


  // STEP 4: builds multipay for each microrow
  getMappedMultiPayDtoToViewModelFor(currentMicroRowDto: CollectionsCesMicroDataDto) {
      // for each unit - we need mutlipay object with 2 groups
      const payGroupsArray = new Array<CollectionsMutliPayMicroDataGroup>();
      // add 2 paygroups - these object gets mapped with data during mapping each microrow
      payGroupsArray.push(new CollectionsMutliPayMicroDataGroup(1));
      payGroupsArray.push(new CollectionsMutliPayMicroDataGroup(2));


      // now get the mapped multi for this current microdata and push that to the patgroupArray var
      if (currentMicroRowDto.CesMultiPay != null && currentMicroRowDto.CesMultiPay.length > 0) {

        payGroupsArray.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows.push(this.getMappedMicroDataOrMultiPayAsViewModel(currentMicroRowDto.CesMultiPay[0]));
        payGroupsArray.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows.push(this.getMappedMicroDataOrMultiPayAsViewModel(currentMicroRowDto.CesMultiPay[1]));
        // TODO: remove th3 6 lines of code - after fix to teh server -sending these values correctly
        payGroupsArray.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].RefMM = currentMicroRowDto.RefMM;
        payGroupsArray.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].RefYY = currentMicroRowDto.RefYY;
        payGroupsArray.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].RefMMYY = currentMicroRowDto.RefMM + currentMicroRowDto.RefYY;
        payGroupsArray.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].RefMM = currentMicroRowDto.RefMM;
        payGroupsArray.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].RefYY = currentMicroRowDto.RefYY;
        payGroupsArray.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].RefMMYY = currentMicroRowDto.RefMM + currentMicroRowDto.RefYY;
        // currentMicroRowDto.CesMultiPay.forEach(multiPayRow => {
        //   console.log(JSON.stringify(currentMicroRowDto));
        //   console.log(JSON.stringify(multiPayRow));
        //   // TODO: once we fix the server side - to send the paygroup number we uncomment this
        //   payGroupsArray.find(a => a.PayGroupIndex === multiPayRow.PayGroupIndex)
        //                         .cesMultiPayMicroRows.push(this.getMappedMicroDataOrMultiPayAsViewModel(multiPayRow));
        //   // TODO: then add previous months' same paygroup here
        // });
      } else { //  else part - where no multipay from DB
        payGroupsArray.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows.push(this.getEmptyMultiPayFor(currentMicroRowDto));
        payGroupsArray.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows.push(this.getEmptyMultiPayFor(currentMicroRowDto));
      }

      return payGroupsArray;
  }


  // dtermines which cells are opne for data collection
  disableMicroDataCellsForDataCollectionByEmployeeType(currentMonthMicrodataViewModel: CollectionsCesMicroData, mpayStat: string,  employeeType: string ) {
    // set microdata data cell enable or disabled based on sched_type
    currentMonthMicrodataViewModel.DisallowAeRowDataCollection = false;
    currentMonthMicrodataViewModel.DisallowPwCellDataCollection = false;
    currentMonthMicrodataViewModel.DisallowPwRowDataCollection = false;
    currentMonthMicrodataViewModel.DisallowPwOTDataCollection = false;
    currentMonthMicrodataViewModel.DisallowAeOTDataCollection = false;
    currentMonthMicrodataViewModel.DisallowAeCellDataCollection = false;
    currentMonthMicrodataViewModel.DisableOTOnEmployeeType = false;

    if (employeeType === 'G' || employeeType === 'S') {
      console.log('employee type G/S= ' + employeeType);
      currentMonthMicrodataViewModel.DisallowAeRowDataCollection = true;
      currentMonthMicrodataViewModel.DisallowAeOTDataCollection = true;
      currentMonthMicrodataViewModel.DisallowPwRowDataCollection = true;
      currentMonthMicrodataViewModel.DisallowPwOTDataCollection = true;
      if (employeeType === 'G') {
        console.log('employee type G = ' + employeeType);
        currentMonthMicrodataViewModel.DisallowPwCellDataCollection = true;
      }
    } else if (employeeType === 'A' || employeeType === 'B' || employeeType === 'E') {
      currentMonthMicrodataViewModel.DisallowAeOTDataCollection = true;
      currentMonthMicrodataViewModel.DisallowPwOTDataCollection = true;
    }

    console.log('Pw rows -' + currentMonthMicrodataViewModel.DisallowPwRowDataCollection);
    console.log('Ae rows -' + currentMonthMicrodataViewModel.DisallowAeRowDataCollection);
    console.log('Pw cell -' + currentMonthMicrodataViewModel.DisallowPwCellDataCollection);
    console.log('Pw OT -' + currentMonthMicrodataViewModel.DisallowPwOTDataCollection);
    console.log('Ae rows -' + currentMonthMicrodataViewModel.DisallowAeOTDataCollection);
    console.log('Ae cell -' + currentMonthMicrodataViewModel.DisallowAeCellDataCollection);


  }


   // method to check if microrow in question should be included in the table UI
   canSkipMicroRow(refMM: string, refYY: string) {
    const microRowMonthYear = moment({year: +refYY, month: +refMM, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});
    if (microRowMonthYear.isAfter(this.collectionYearMonthMoment)) {
      return true;
    }
    // set if this row is historical
    if (microRowMonthYear.isBefore(this.cutOffYearMonthMoment)) {
      return true; // do not include
    }
    return false;
  }


  checkForGoodDC(unitDispCode) {
    if (!(checkCesCodeType(unitDispCode, 'NonResponse') || checkCesCodeType(unitDispCode, 'Final'))) {
      this.showMicroDataGridOnGoodDCSubject.next(true);
      return;
    } else {
      if (checkCesCodeType(unitDispCode, 'Refusal') && this.currentSeletectedCase.CONV_REF_CODE != null && this.currentSeletectedCase.CONV_REF_CODE !== '') {
        this.showMicroDataGridOnGoodDCSubject.next(true);
        return;
      }
    }
    this.showMicroDataGridOnGoodDCSubject.next(false);
  }

  // reuse - single method to map and retrun either microdatarow object or multipay object - since they both are
  // same excpt multipay has subset of properties
  getMappedMicroDataOrMultiPayAsViewModel(microRow: CollectionsCesMicroDataDto | CesMultiPay) {
    // create new view model object
    const currentMonthMicrodataViewModel = new CollectionsCesMicroData();

    if (microRow != null) {
      console.log('inside my new get map reusalbe code');
      // reusability of this method allows me to pass eitehr the microrow or multipay row and get a mapped object
      // map properties that are both common to microrow and multipay row
      currentMonthMicrodataViewModel.RefYY = microRow.RefYY;
      currentMonthMicrodataViewModel.RefMM = microRow.RefMM;
      currentMonthMicrodataViewModel.RefMMYY = microRow.RefMM + microRow.RefYY;
      // mapping micro entries
          // AE values
      currentMonthMicrodataViewModel.TotalWorkers = microRow.TotalWorkers;
      currentMonthMicrodataViewModel.TotalOvertime = microRow.TotalOvertime;
      currentMonthMicrodataViewModel.TotalWomenWorkers = microRow.TotalWomenWorkers;
      currentMonthMicrodataViewModel.TotalWorkerHours = microRow.TotalWorkerHours;
      currentMonthMicrodataViewModel.TotalWorkerPayrolls = microRow.TotalWorkerPayrolls;
      currentMonthMicrodataViewModel.TotalCommisions =  microRow.TotalCommisions;

      // PW values
      currentMonthMicrodataViewModel.TotalNonSUpervisoryCommisions =  microRow.TotalNonSUpervisoryCommisions;
      currentMonthMicrodataViewModel.TotalNonSupervisoryOvertime = microRow.TotalNonSupervisoryOvertime;
      currentMonthMicrodataViewModel.TotalNonSupervisoryWokers =  microRow.TotalNonSupervisoryWokers;
      currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours = microRow.TotalNonSupervisoryWorkerHours;
      currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls = microRow.TotalNonSupervisoryWorkerPayrolls;

      currentMonthMicrodataViewModel.PayFrequency = this.lookupService.getLOPPByCode(microRow.PayFrequency);
      currentMonthMicrodataViewModel.CommisionPayFrequncy = this.lookupService.getLOPPByCode(microRow.CommisionPayFrequncy);

      // if microrow map some additional properties
      if (this.isCollectionMicroRowType(microRow)) {
        console.log('CollectionsCesMicroDataDto');
        // mapping Lp factors
        currentMonthMicrodataViewModel.CmLp = microRow.CmLp;
        currentMonthMicrodataViewModel.PrLp = microRow.PrLp;



        currentMonthMicrodataViewModel.TransactionCode = microRow.TransactionCode;
        currentMonthMicrodataViewModel.EDSC = microRow.EDSC;
        currentMonthMicrodataViewModel.ExportDateTime = microRow.ExportDateTime;
        // default value is false in the DB
        currentMonthMicrodataViewModel.ExportFlag = microRow.ExportFlag === 'T' ? true : false;
        currentMonthMicrodataViewModel.GME = microRow.GME;
        currentMonthMicrodataViewModel.GMECc = microRow.GMECc;
        currentMonthMicrodataViewModel.GoodDate = microRow.GoodDate;
        currentMonthMicrodataViewModel.InterviewerUserId = microRow.InterviewerUserId;
        currentMonthMicrodataViewModel.PRO_FACTOR = microRow.PRO_FACTOR;
        currentMonthMicrodataViewModel.SaveDate = microRow.SaveDate;
        currentMonthMicrodataViewModel.Closing = microRow.Closing;
        currentMonthMicrodataViewModel.UpdateDateTime = microRow.UpdateDateTime;


        // mapping strings to dropdown values for selectable by user
        currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, microRow.ResponseCode);
        currentMonthMicrodataViewModel.EmployementShift1 = this.lookupService.getExplanationCodeByCode(true, microRow.EmploymentShift1);
        currentMonthMicrodataViewModel.EmployementShift2 = this.lookupService.getExplanationCodeByCode(true, microRow.EmployementShift2);

        // finally set dates for Ratios fields
        currentMonthMicrodataViewModel.RatioExportDateTime = currentMonthMicrodataViewModel.ExportDateTime;
        currentMonthMicrodataViewModel.RatioGoodDate = currentMonthMicrodataViewModel.GoodDate;
      } else {
        console.log('CesMultiPay');
        currentMonthMicrodataViewModel.PayGroupIndex = microRow.PayGroupIndex;
      }
    }
    return currentMonthMicrodataViewModel;
  }

  // setCollectionDataDirty() {
  //   this.isCollectionDataDirty = true;
  // }

  // getCollectionDataDirty(): boolean {
  //   return this.isCollectionDataDirty;
  // }

  // method to set RC=90 and clear all screening errors
  // when the user forces by entering comments
  clearScreeningErrors(currentMonthMicrodataViewModel: CollectionsCesMicroData) {

    currentMonthMicrodataViewModel.CesScreeningErrorScripts.clear();
    currentMonthMicrodataViewModel.MicroDataRatioContextError.clearErrors();

    // set the expkantion code appropriately to the row CC1
    // set RC 90
    currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '90');

    // get a reference to the array item in the selected Unit
    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.CesMicroData.findIndex(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);

    // enable CC2 dropdown for users to select
    currentMonthMicrodataViewModel.disableEmployementShift2 = false;

    // replace the prev item in the list with the newly processed item for that refmm and refyy
    this.currentSelectedUnit.CesMicroData.splice(index, 1, currentMonthMicrodataViewModel);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;

    // emit the changes to microdata list processed
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.CesMicroData);
  }

   // called ONLY when user edits the values on screen - when entering data for microrow.
  // This is not called on initial load of Unit's microdata on collectinos page.
  processCurrentEditedMicroDataRow(currentMonthMicrodataViewModel: CollectionsCesMicroData): void {
    // get prev microdata row
    const prevPeriod = this.getPrevPeriod(+currentMonthMicrodataViewModel.RefYY, +currentMonthMicrodataViewModel.RefMM);
    const prevMonthMicrodataViewModel = this.currentSelectedUnit.CesMicroData.find(a => +a.RefMM === prevPeriod.refMM && +a.RefYY === prevPeriod.refYY);

    // force set the RC value; because of keyboard tabbing it looses its RC
    currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, currentMonthMicrodataViewModel.ResponseCode.code);

    // start processing row
    this.processMicroDataRow(this.currentSelectedUnit.ScreeningParameters, this.currentSelectedUnit.QUIData, this.currentSelectedUnit.EmployeeType, currentMonthMicrodataViewModel, prevMonthMicrodataViewModel, this.currentSelectedUnit.AeLdbRC);

    console.log('can reclaculate 90');
    // recalcualte RC under these conditions

    if (this.canRecalculateRC(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel)) {
      console.log('YES, can reclaculate 90');
      this.recalculateLpFactorsAndResponseCode(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel);
    }

    // get a reference to the array item in the selected Unit
    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.CesMicroData.findIndex(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);

    // when running this method always set flag to disable CC2 dropdown
    currentMonthMicrodataViewModel.disableEmployementShift2 = true;

    // replace the prev item in the list with the newly processed item for that refmm and refyy
    this.currentSelectedUnit.CesMicroData.splice(index, 1, currentMonthMicrodataViewModel);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;


    // emit the changes to microdata list processed
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.CesMicroData);
  }


  // method to calcualte ratios for this micro row month, check for edit error, screens for ratio errors
  processMicroDataRow(screeningParameters: ScreeningParametersDto, quiData: QuiData, scheduleType: string,
                      currentMonthMicrodataViewModel: CollectionsCesMicroData,
                      prevMonthMicrodataViewModel: CollectionsCesMicroData, aeLdbRC: string) {



                        // sets ValidationContext errors "MicroDataCellContextError" object
    this.editScreenService.setEditScreenErrors(currentMonthMicrodataViewModel, scheduleType);

    // calucalte the ratios first for current month
    this.microRatioService.calculateMicroRatios(currentMonthMicrodataViewModel);

    // if no errors then perform screening errors for ratios
    if (!currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors()) {

      // perform LdbChecks for new companies and find any errors
      this.ldbCheckService.aeLdbChecks(currentMonthMicrodataViewModel, quiData, screeningParameters, this.AeLdbCheckMonth,
                                            +this.collectionMonth, +this.collectionYear, this.currentSeletectedCase.START_DATE, aeLdbRC);
      // set aeLdbYearago for future reference
      this.setAeLdbYearAgo(currentMonthMicrodataViewModel.AeLdbYearAgo);
      if (!currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.isAeLdbTestError) {
        // check we have ratios calculated
        if (currentMonthMicrodataViewModel.areRatiosAvailable) {
          // check if screening is possible - if CC1 is set to some code, then skip screening
          if (currentMonthMicrodataViewModel.EmployementShift1.code == null) {
            // perform ratio minmax screening
            this.microRatioService.performRatioMinMaxScreening(currentMonthMicrodataViewModel, screeningParameters);

            // no need to check if there is error in minmax before running otm
            this.microRatioService.performRatioOtmScreening(currentMonthMicrodataViewModel, prevMonthMicrodataViewModel, screeningParameters, scheduleType);

            //  perform otmscreenings if no minmax errors and prev month available
            // if (!currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() && prevMonthMicrodataViewModel != null) {
            //     this.microRatioService.performRatioOtmScreening(currentMonthMicrodataViewModel, prevMonthMicrodataViewModel, screeningParameters, scheduleType);
            // }
          }
        }
      } else {
         // determine if the NAICS code exists
         const hasValidUnitNAICS = this.isNceNAICSCodeValid();
         // emit observable ldb error as true to component so ti can dispaly a dialog
         this.toggleAeLdbError(true);

         // emit observable to show or hide notice
         this.onLdbErrorIsUnitNAICSValidSubject.next(hasValidUnitNAICS);
      }
    }
  }


  setAeLdbErrorSkip(AeLdbRCSelected: ExplCode) {
    // this.canSkipAeLebCheck = canSkip;

    // set the current units AELD RC to selected explnation code RC
    this.currentSelectedUnit.AeLdbRC = AeLdbRCSelected.code;

    // hide the EDB check error popup
    this.toggleAeLdbError(false);
  }

  setAeLdbYearAgo(aeLdbYearAgo: string | number) {
    this.aeLdbYearAgo = aeLdbYearAgo;
  }

  getAeLdbYearAgo() {
    return this.aeLdbYearAgo;
  }

  isNceNAICSCodeValid() {
    const codes = this.lookupService.getNENAICSCodes();

    if (this.currentSelectedUnit != null && this.currentSelectedUnit.NaicsCode != null) {
      const foundCode = codes.find(a => a === this.currentSelectedUnit.NaicsCode);
      if (foundCode) {
        return true;
      } else {
        return false;
      }
    }
  }

  toggleAeLdbError(show: boolean) {
    this.hasLdbErrorSubject.next(show);
  }

  // setAeLdbErrorSkip(canSkip: boolean) {
  //   this.canSkipAeLebCheck = canSkip;
  // }

  canRecalculateRC(prevMonthMicrodataViewModel: CollectionsCesMicroData, currentMonthMicrodataViewModel: CollectionsCesMicroData): boolean {
    let hasNoEditOrScreeningOrOtmErrorsButPrevNonResponsive = false;
    let hasNoEditOrScreeningOrOtmErrorsButNonResponsive = false;
    let hasNoEditOrScreeningOrOtmErrorsButPrevSuccess = false;
    //  Edit Error Fonud but RESP_CODE is not set to 11 yet
    const hasEditErrorWithNoRC11: boolean = currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors()
                                                  && currentMonthMicrodataViewModel.ResponseCode.code !== '11';

    // Screening Error Found but RESP_CODE is not set to 12 yet
    const hasScreeningErrorsWithNoRC12 = (currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() ||
                                            currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.hasOtmErrors()) &&
                                            (currentMonthMicrodataViewModel.ResponseCode.code !== '12');

    // If Edit Error and Screening Error are fixed but RESP_CODE is not set to 00/81/82/90 yet
    const hasNoScreeningOrEditOrOtmErrorsWithNoRC = (!currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors() &&
                                                  !currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() &&
                                                  !currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.hasOtmErrors()) &&
                                                  (currentMonthMicrodataViewModel.ResponseCode.code === '12' || currentMonthMicrodataViewModel.ResponseCode.code === '11');

    // Production bug fix - whenn atleast AE value is entered - allow to change RC
    const hasTotalWorkersReported = this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers);

    if (prevMonthMicrodataViewModel != null) {
            // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrOtmErrorsButPrevNonResponsive =  (!currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors() &&
          !currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() &&
          !currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.hasOtmErrors()) &&
          (currentMonthMicrodataViewModel.ResponseCode.code !== '82') &&
          (prevMonthMicrodataViewModel.ResponseCode.code === '81' || prevMonthMicrodataViewModel.ResponseCode.code === '82');

          // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrOtmErrorsButNonResponsive =  (!currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors() &&
            !currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() &&
            !currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.hasOtmErrors()) &&
            (currentMonthMicrodataViewModel.ResponseCode.code !== '81') && (prevMonthMicrodataViewModel.ResponseCode.code === '00');

          // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrOtmErrorsButPrevSuccess =  (!currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors() &&
            !currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios() &&
            !currentMonthMicrodataViewModel.MicroDataRatioOtmContextError.hasOtmErrors()) &&
              (currentMonthMicrodataViewModel.ResponseCode.code !== '00') && (prevMonthMicrodataViewModel.ResponseCode.code === '90');


    }

    // recalcualte RC under these conditions
    return hasEditErrorWithNoRC11 || hasScreeningErrorsWithNoRC12 || hasNoScreeningOrEditOrOtmErrorsWithNoRC || hasNoEditOrScreeningOrOtmErrorsButPrevNonResponsive ||
           hasNoEditOrScreeningOrOtmErrorsButNonResponsive || hasNoEditOrScreeningOrOtmErrorsButPrevSuccess || hasTotalWorkersReported;
}



  recalculateLpFactorsAndResponseCode(prevMicrodataViewModel: CollectionsCesMicroData, currentMonthMicrodataViewModel: CollectionsCesMicroData) {
    // set PrLp and CmLp
    currentMonthMicrodataViewModel.PrLp = currentMonthMicrodataViewModel.RatioPrLp;
    currentMonthMicrodataViewModel.CmLp = currentMonthMicrodataViewModel.RatioCmLp;

    // set RC
    this.setMicroDataRC(prevMicrodataViewModel, currentMonthMicrodataViewModel);

    console.log(`RC set ${currentMonthMicrodataViewModel.RefMMYY}` + currentMonthMicrodataViewModel.ResponseCode.code);


    // set ratio errors to EDSC
    const errors = new Array<string>();
    let finalErrors = new Array<string>();
    currentMonthMicrodataViewModel.CesInterviewErrorScripts.forEach(err => errors.push(err));
    currentMonthMicrodataViewModel.CesScreeningErrorScripts.forEach(err => errors.push(err));
    currentMonthMicrodataViewModel.CesOtmScreeningErrorScripts.forEach(err => errors.push(err));

    // remove duplicates
    if (errors.length > 0) {
     const uniqueSet = new Set(errors);
     finalErrors = [...uniqueSet];
    }
    currentMonthMicrodataViewModel.EDSC = finalErrors.join(';');
    console.log('errors ' + currentMonthMicrodataViewModel.EDSC);
  }


  setMicroDataRC(prevMicrodataViewModel: CollectionsCesMicroData, currentMonthMicrodataViewModel: CollectionsCesMicroData, ) {
    // TODO: calcualte prev micro
    const prevMicro = null;
    const caseStartDate = this.currentSeletectedCase.START_DATE;

    // check if RC on the microdata now is UserAssigned type
    if (currentMonthMicrodataViewModel.ResponseCode != null && (currentMonthMicrodataViewModel.ResponseCode.code !== '15')
                                                            && (currentMonthMicrodataViewModel.ResponseCode.code !== '16')
                                                            && (currentMonthMicrodataViewModel.ResponseCode.code !== '17')) {

        // TODO: seriously remove this line after test
        // currentMonthMicrodataViewModel.aeLdbCheckError = false;


        // and some of the values are reported
        if (this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalCommisions)  ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkerHours) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalOvertime) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkerPayrolls) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWokers) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSUpervisoryCommisions) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryOvertime) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWomenWorkers)) {
              // edit errors
              if (currentMonthMicrodataViewModel.MicroDataCellContextError.hasEditErrors()) {
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '11');
                currentMonthMicrodataViewModel.GoodDate = null;
                currentMonthMicrodataViewModel.RatioGoodDate = null;
              } else if (currentMonthMicrodataViewModel.aeLdbCheckError) { // AE LDB test failed
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '12');
                currentMonthMicrodataViewModel.GoodDate = null;
                currentMonthMicrodataViewModel.RatioGoodDate = null;
              } else if (currentMonthMicrodataViewModel.MicroDataRatioContextError.hasScreeningMinMaxErrorsForRatios()) { // has screening errors
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '12');
                currentMonthMicrodataViewModel.RatioGoodDate = null;
                currentMonthMicrodataViewModel.GoodDate = null;
              } else {
                console.log('YES, set 90');
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '90');
                let goodDate: Date = null;
                // if multi unit call this
                if(this.unitService.IsMultiUnitCollectionCase()) {
                  goodDate = this.getGoodDateForMultiUnitCase(currentMonthMicrodataViewModel);
                } else {
                  goodDate = this.getGoodDateFOrSingleUnitCase(currentMonthMicrodataViewModel);
                }
                if(goodDate == null) {
                  currentMonthMicrodataViewModel.RatioGoodDate = currentMonthMicrodataViewModel.GoodDate;
                } else {
                  currentMonthMicrodataViewModel.RatioGoodDate = goodDate;
                }
              }
          } else {
              if (prevMicrodataViewModel == null || (prevMicrodataViewModel != null && prevMicrodataViewModel.ResponseCode == null)) {
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '00');
              } else {
                    if (prevMicrodataViewModel.ResponseCode.code === '00') {
                      currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, getAdjustedDelinquentCode(caseStartDate, '00'));
                    } else if (prevMicrodataViewModel.ResponseCode.code === '81') {
                      currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, getAdjustedDelinquentCode(caseStartDate, '81'));
                    } else if (prevMicrodataViewModel.ResponseCode.code === '82') {
                      currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, getAdjustedDelinquentCode(caseStartDate, '82'));
                    } else if (checkCesCodeType(prevMicrodataViewModel.ResponseCode.code, 'Pending') && checkCesCodeType(prevMicrodataViewModel.ResponseCode.code, 'UserAssigned')) {
                      currentMonthMicrodataViewModel.ResponseCode = prevMicrodataViewModel.ResponseCode;
                    } else {
                      currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '00');
                    }
            }
          }
    }
  }




  // microgrid toolbar drop down calls this on unit changed
  onCollectionsUnitChanged(unit: CollectionsUnit ) {
    // emit data to the observable to trigger http call
    if (unit != null) {
      // before switching the unit, make sure to set the previous selected unit's processed microdata list to the main backing array
      // we will use this final array viewmodel when save
      if (this.currentSelectedUnit != null) {
        this.collectionUnitListVm.find(a => a.UnitId === this.currentSelectedUnit.UnitId).CesMicroData = this.currentSelectedUnit.CesMicroData;
      }

      // now swtich to the current user selected unit
      this.currentSelectedUnit = unit;
      console.log('collection service - on collection changed unit: ', unit.UnitId);

      // show or hide micro data grid if DISP Code is invalid
      this.checkForGoodDC(this.currentSelectedUnit.DispositionCode);

      // notifies micro data grid component that unit is changed
      //this.onCollectionUnitChangedSubject.next(unit);
      this.getProcessedMicroDataOnUnitSelectionChanged(unit);

      // on successul opening of microdata - emit string
      // 'pint' to allow entering values in main collection grid
      this.noCharInputRegExOnMultiPaySubject.next('pint');
    }
    console.log('calling  checkCollectionsUnitListHasDropUnits');
    // this.caseSummaryElement.setFocus();
    this.checkCollectionsUnitListHasDropUnits(this.collectionUnitListVm);
  }



  getProcessedMicroDataOnUnitSelectionChanged(unit: CollectionsUnit)  {
    // set an empty array
    let microDataRows: CollectionsCesMicroData[] = [];

    // find the selected unit from the list of units
    // this.currentSelectedUnit = this.collectionUnitListVm.find(a => a.UnitId === unit.UnitId);

    // check if we have the microdata already
    if (this.currentSelectedUnit != null) {
      if (this.currentSelectedUnit.CesMicroData != null && this.currentSelectedUnit.CesMicroData.length > 0) {
        console.log('on selection changed unit set and seding microdata now - ' + JSON.stringify(this.currentSelectedUnit.CesMicroData));

        const params = new HttpParams().set('stateCode', unit.StateCode).set('reptNum', unit.ReportNum);
        this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params)
        .pipe(
          map((result: CollectionsCesMicroDataDto[]) => {
              // add to the cloned unit list from unitService - Important
              if (this.unitService.pristineClonedUnit != null && unit != null) {
                this.unitService.pristineClonedUnit.find(a => a.unitPK === unit.UnitId).CesMicroDataList = _.cloneDeep(result);
                console.log('setting pristine swtiching cesmicrolist ' + JSON.stringify(this.unitService.pristineClonedUnit));
              }
            })
          );


        this.IsUnitSwitching = true;
        // the ces microdata is ready and should be emitted through behavior subject so component can react to it
        this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.CesMicroData);

        this.showRolloverReminderMessage(this.currentSelectedUnit.CesMicroData);

        // emit screening parameter for display
        this.onCollectionUnitChangedScreeningParamsSubject.next(this.currentSelectedUnit.ScreeningParameters);
        return;
      } else { // ces micro data is not avaiable so make an http call to get the microdata for this unit
        // setup the http params
        const params = new HttpParams().set('stateCode', unit.StateCode).set('reptNum', unit.ReportNum);
        this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params)
        .pipe(
          map((result: CollectionsCesMicroDataDto[]) => {
              // add to the cloned unit list from unitService - Important
              if (this.unitService.pristineClonedUnit != null && unit != null) {
                let pristineClonedUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === unit.UnitId);
                pristineClonedUnit.CesMicroDataList = _.cloneDeep(result);
                console.log('setting unit swtiching cesmicrolist ' + JSON.stringify(this.unitService.pristineClonedUnit));
              }
              // map microdatadto to view model and calcualte ratios
              microDataRows = this.mapMicroDataDtoToMicroDataViewModel(unit.ScreeningParameters, unit.QUIData, unit.MPayStat, unit.EmployeeType, result, unit.AeLdbRC);
              this.currentSelectedUnit.CesMicroData = microDataRows;
              // this.currentSelectedUnit.CesMicroDataPayGroups = this.currentSelectedUnitCesMultiPayMicroRowGroups;
              // set the retreived and processed microdata to our unit list cache
              this.collectionUnitListVm.find(a => a.UnitId === unit.UnitId).CesMicroData = microDataRows;
              return microDataRows;
          }),
          catchError((err: TcwError) => {
            return throwError(err);
          })
        ).subscribe(data => {

          this.IsUnitSwitching = true;
          // emitting this mcirodata rows to components
          this.onCollectionUnitChangedMicroDataSubject.next(data);

          // emit screening parameter for display
          this.onCollectionUnitChangedScreeningParamsSubject.next(this.currentSelectedUnit.ScreeningParameters);

          this.showRolloverReminderMessage(data);
           // also set the default multipayheader RC when a unit is selected -
          // this RC value should be collection month's micro row RC and should change to what ever row selected by the user as they close and open mutlipay
          const microData = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === this.collectionYear && a.RefMM === this.collectionMonth);
          if (microData) {
            this.MultiPayHeaderTextRC = microData.ResponseCode.code;
          }

        });
        return;
      }

    }

    // return an empty observable to grid component to satisfy RxJs's mapping. What we return here is not improtant per this code.
    this.onCollectionUnitChangedMicroDataSubject.next(microDataRows);
  }


  showRolloverReminderMessage(cesMicroData: CollectionsCesMicroData[]) {
    // also emit data that shows if the case has any rollover reminders
    if (this.rolloverService.isTdeEligible(cesMicroData, this.collectionYear, this.collectionMonth)) {
      // emit true or false to show toast - for ces
      this.onRolloverReminderSubject.next({ title: 'Web Rollover Reminder', reminderMsg: 'WEB Rollover is eligible for this Case.'});
    }

    if (this.rolloverService.isFirstTimeRollover()) {
      // emit true or false to show toast - for ces
      this.onRolloverReminderSubject.next({ title: 'First Time Rollover Reminder', reminderMsg: 'This reporter is new to WEB.'});
    }
  }



  // Prasad - Prod Fix - Drop unit logic
checkCollectionsUnitListHasDropUnits(units: CollectionsUnit[]) {
  let listOfDropUnits: DropUnit[] = [];

  // check if drop unit exists
  _.each(units, u => {
    if(this.unitService.isDropUnit(u,  this.collectionYear, this.collectionMonth)) {
      listOfDropUnits.push({ StateCode: u.StateCode, ReportNum: u.ReportNum, UINumber: u.UiNumber })
    }
  });

  if(listOfDropUnits != null && listOfDropUnits.length > 0) {
    //build message
    const message = this.buildDropUnitReminderMessage(listOfDropUnits);

    // emit observable to show message
    this.onDropUnitReminderSubject.next(message);
  }
}


// Prasad - Prod Fix - Drop unit logic
buildDropUnitReminderMessage(listOfDropUnits: DropUnit[]) {
  let message = null; // empty string
   // form the drop unit message
  if (listOfDropUnits != null && listOfDropUnits.length > 0) {
    message = `<div>
                  <p> The following State-UIs contain drop units: <p>
                  <table>
                    <th>StateCode</th><th></th><th>UI NUmber </th>`;
    message += `<tr>${listOfDropUnits.map(dropUnit => `<td>${dropUnit.StateCode}</td><td></td><td>${dropUnit.UINumber}</td>`)}</tr>`;
    message += `</table></div>`;
  }
  return message;
}

  /*-----------------------------------------------------------------------------------end microdata related methods -------------------------------------------------------*/





  /*-----------------------------------------------------------------------------------multipay related methods ----------------------------------------------------------------*/

  isCurrentUnitMultiPay() {
    return this.currentSelectedUnit.MPayStat === 'T';
  }

  // emit/push data to teh dialog opened
  emitMultiPay(unit: CollectionsUnit) {
    if (unit != null) { //  if passed in unit si not null, then we have currentSelected unit set
      // set mpay stat after opening multipay dialog (dialog opening is initated by microgrid toolbar component which then calls this method)
      this.currentSelectedUnit.MPayStat = 'T';

      // // on successul opening of multi pay - emit string with regex that will restrict entering values in main collection grid
      // this.noCharInputRegExOnMultiPaySubject.next('^\d');

     // double check if the user has selected a microrow and set its month and year - important for mutlipay to show
      if (this.currentUserSelectedMicroRowYear == null || this.currentUserSelectedMicroRowMonth == null) {
        this.currentUserSelectedMicroRowYear = this.collectionYear;
        this.currentUserSelectedMicroRowMonth = this.collectionMonth;
      }

      // find the multipay groups for current microrow
      this.currentSelectedUnitCesMultiPayMicroRowGroups = this.currentSelectedUnit.CesMicroData
          .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
          .CesMultiPayGroups;

      console.log('emitting multipaay from collections ' + JSON.stringify(this.currentSelectedUnitCesMultiPayMicroRowGroups));

      // emit the data
      this.onCollectionUnitChangedMultiPayDataSubject.next(this.currentSelectedUnitCesMultiPayMicroRowGroups);
      console.log('after emitting multipaay from collections ' + JSON.stringify(this.currentSelectedUnitCesMultiPayMicroRowGroups));

    }
  }

  // set MPaystat flag and unlocks the main collection grid for editing
  deleteMultiPayroll() {
    this.currentSelectedUnit.MPayStat = 'F';

     // on delete of the multipay unlock back to entering values in main collection grid
    this.noCharInputRegExOnMultiPaySubject.next('pint');

    // emit observable to enable save/close/cancel button
    this.uiConfigService.setCaseSaveFeaturesReadOnly(false);
  }

  setCorrectPrLoppCmLoppForMultiPay(currentMicro: CollectionsCesMicroData, prevMicroGroup1Row: CollectionsCesMicroData, prevMicroGroup2Row: CollectionsCesMicroData) {
    try {
      // note - we alrea always only editing the first item in the array - second item in both groups are there just for comparison and always not editable
      if (currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].PayFrequency == null) {
        currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].PayFrequency = prevMicroGroup1Row.PayFrequency;
      }
      if (currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].CommisionPayFrequncy == null) {
        currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows[0].PayFrequency = prevMicroGroup1Row.CommisionPayFrequncy;
      }
      if (currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].PayFrequency == null) {
        currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].PayFrequency = prevMicroGroup2Row.PayFrequency;
      }
      if (currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].CommisionPayFrequncy == null) {
        currentMicro.CesMultiPayGroups.find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows[0].PayFrequency = prevMicroGroup2Row.CommisionPayFrequncy;
      }
    } catch (error) {
      // this is recoverable error and not should bring down the page - so the error is logged and swallowed
      console.log('Cannot successfuly set Previous PrLopp and CmLopp for multpay');
    }


  }


  getEmptyMultiPayFor(microdata: CollectionsCesMicroDataDto): CollectionsCesMicroData {
    const multiPayRow = new CollectionsCesMicroData();
    multiPayRow.RefYY = microdata.RefYY;
    multiPayRow.RefMM = microdata.RefMM;
    multiPayRow.RefMMYY = microdata.RefMM + microdata.RefYY;

    multiPayRow.TotalNonSupervisoryWorkerPayrolls = null;
    multiPayRow.TotalNonSUpervisoryCommisions = null;
    multiPayRow.TotalNonSupervisoryOvertime = null;
    multiPayRow.TotalNonSupervisoryWokers = null;
    multiPayRow.TotalNonSupervisoryWorkerHours = null;

    multiPayRow.TotalCommisions = null;
    multiPayRow.TotalWomenWorkers = null;
    multiPayRow.TotalWorkerHours = null;
    multiPayRow.TotalWorkerPayrolls = null;
    multiPayRow.TotalOvertime = null;
    multiPayRow.TotalWorkers = null;

    multiPayRow.CommisionPayFrequncy = this.lookupService.getLOPPByCode('');
    multiPayRow.PayFrequency = this.lookupService.getLOPPByCode('');

    return multiPayRow;
  }


  isMultiPayRow(refMM: string, refYY: string) {
    const microRowMonthYear = moment({year: +refYY, month: +refMM, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});
    if (microRowMonthYear.isSame(this.collectionYearMonthMoment)) {
      return true;
    } else {
      const pervMonthYearMoment = (moment().month(+this.collectionMonth).year(+this.collectionYear)).subtract(1, 'months');
      if (microRowMonthYear.isSame(pervMonthYearMoment)) {
        return true;
      }
    }
    return false;
  }


  // Meaning of ParentMUltirrow - the row that was touched or edited from one of the pay group tables
  processParentMultiPayRow(currentParentPayGroupRow: CollectionsCesMicroData,
                           parentPayGroupNumber: number) {
     // find the index for current paygroup row
     const indexToReplace = this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
                .CesMultiPayGroups.find(a => a.PayGroupIndex === parentPayGroupNumber)
                .cesMultiPayMicroRows.findIndex(a => a.RefMM === currentParentPayGroupRow.RefMM && a.RefYY === currentParentPayGroupRow.RefYY);

    // run edit checks for newly edited values
     this.editScreenService.setEditScreenErrors(currentParentPayGroupRow, this.currentSelectedUnit.EmployeeType);

    // replace old  with paygroup with the validated-edit-checked paygroup row
     this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
        .CesMultiPayGroups.find(a => a.PayGroupIndex === parentPayGroupNumber)
        .cesMultiPayMicroRows.splice(indexToReplace, 1, currentParentPayGroupRow);
  }


  // Meaning of sibling multirow = any row from other paygroup that was not touched
  processSiblingMultiPayRow(currentParentPayGroupRow: CollectionsCesMicroData,
                            parentPayGroupNumber: number, editedCellObject: MicroDataCellObject) {
      // sibling is the other pay group (if parent 1 then sibling 2 vice versa) in teh pay group array
      // multi pay group array has only 2 paygroup items
      const indexToReplace = this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
                                 .CesMultiPayGroups.find(a => a.PayGroupIndex !== parentPayGroupNumber)
                                 .cesMultiPayMicroRows.findIndex(a => a.RefMM === currentParentPayGroupRow.RefMM && a.RefYY === currentParentPayGroupRow.RefYY);

      // extract the existing sibling row - we want the same month's row as parent's but from the other pay group
      const currentSiblingPayGroupRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
                                            .CesMultiPayGroups.find(a => a.PayGroupIndex !== parentPayGroupNumber)
                                            .cesMultiPayMicroRows.find(a => a.RefMM === currentParentPayGroupRow.RefMM && a.RefYY === currentParentPayGroupRow.RefYY);

      // run edit checks comparing parent with sibling row - a different set of edit check rules
      this.multiPayService.setEditScreenMultiPayErrors(currentSiblingPayGroupRow, currentParentPayGroupRow, editedCellObject);

     // replace the row  with validated-edit-checked row
      this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear)
                              .CesMultiPayGroups.find(a => a.PayGroupIndex !== parentPayGroupNumber)
                              .cesMultiPayMicroRows.splice(indexToReplace, 1, currentSiblingPayGroupRow);
  }


  processCurrentEditedPayGroupMicroDataRow(currentParentPayGroupRow: CollectionsCesMicroData,
                                           parentPayGroupNumber: number, editedCellObject: MicroDataCellObject) {

        this.processParentMultiPayRow(currentParentPayGroupRow, parentPayGroupNumber);
        this.processSiblingMultiPayRow(currentParentPayGroupRow, parentPayGroupNumber, editedCellObject);

        this.onCollectionUnitChangedMultiPayDataSubject
          .next(this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear).CesMultiPayGroups);
   }


  sendPp1Pp2UpdatesToNotes(collectionMonthMicroData: CollectionsCesMicroData) {
    if (collectionMonthMicroData != null) {
        // extract and set paygroup 1 & 2 microdata for multipayservice state
      const multiPayMicroDataGroup1 = this.currentSelectedUnit.CesMicroData
      .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear).CesMultiPayGroups
      .find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows
      .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

      const multiPayMicroDataGroup2 = this.currentSelectedUnit.CesMicroData
          .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear).CesMultiPayGroups
          .find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows
          .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

       // update the notes service with latest PrLopps
      this.tcwNotesService.setPrlpForNotesFromCollections(null, multiPayMicroDataGroup1.PayFrequency, multiPayMicroDataGroup2.PayFrequency);
    }
  }



  setNormalizedMultiPayForCollectionMonth() {

    // on successul opening of multi pay - emit string with regex that will restrict entering values in main collection grid
    this.noCharInputRegExOnMultiPaySubject.next('^\d');

    // get the microdata for the collections month and year
    const collectionMonthMicroData = this.currentSelectedUnit.CesMicroData.find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

    // if the user opened and updated multipay microrow that is of collection month/year then notify notes and update pp1/pp2
    if (this.currentUserSelectedMicroRowMonth === this.collectionMonth && this.currentUserSelectedMicroRowYear === this.collectionYear) {
      this.sendPp1Pp2UpdatesToNotes(collectionMonthMicroData);
    }


    // extract and set paygroup 1 & 2 microdata for multipayservice state
    this.multiPayService.multiPayMicroDataGroup1 = this.currentSelectedUnit.CesMicroData
                                .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear).CesMultiPayGroups
                                .find(a => a.PayGroupIndex === 1).cesMultiPayMicroRows
                                .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

    this.multiPayService.multiPayMicroDataGroup2 = this.currentSelectedUnit.CesMicroData
                                .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear).CesMultiPayGroups
                                .find(a => a.PayGroupIndex === 2).cesMultiPayMicroRows
                                .find(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

    // start normalization process of MUlti pay group data
    const normalizedCollectionMonthMultiPayRow = this.multiPayService.normalizePayGroupMicroData(collectionMonthMicroData);

    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.CesMicroData.findIndex(a => a.RefMM === this.currentUserSelectedMicroRowMonth && a.RefYY === this.currentUserSelectedMicroRowYear);

    // replace the prev item in the list with the newly normalized  micro row on collections page
    this.currentSelectedUnit.CesMicroData.splice(index, 1, normalizedCollectionMonthMultiPayRow);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;

    console.log('normalized data anout to emit ' + JSON.stringify(this.currentSelectedUnit.CesMicroData));

    // emit observable to enable save/close/cancel button
    this.uiConfigService.setCaseSaveFeaturesReadOnly(false);

    // emit the changes to microdata collections main page
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.CesMicroData);
  }


  setCollectionNoteActions() { // this didn't help - so comment this code for now. Because its a UI requirements flaw to have notes editable both in collections and in popup.
  // will need to address that later.

    // this.onCollectionNoteActionsSubject.next(true);
  }

  /*---------------------------------------------------------------------------------------------end multipay related methods ----------------------------------------------------------------*/

// helper method to get the collection month microdata from the array of microdata
getCollectionMonthMicroData(cesMicroDataList: CollectionsCesMicroData[]): CollectionsCesMicroData {
  return cesMicroDataList.find(a => a.RefYY === this.collectionYear && a.RefMM === this.collectionMonth);
}



/*------------------------------------------------------------------------------------------------------helper methods ----------------------------------------------------------------*/
onCaseDetailsDestroy() {
  this.collectionsUnitListCache = null;
}


onDestroyCollections() {
  // on collection destroys(swthichng tabs) save data entries to cache
  this.collectionsUnitListCache = _.cloneDeep(this.collectionUnitListVm);
  console.log('cache - ' + JSON.stringify(this.collectionsUnitListCache));

  // this.saveToCacheCollectionDataSubject.next(collectionDataCache);
  // this.currentSelectedUnitCesMultiPayMicroRowGroups = null;
}


  onDestroyMultiPay() {
    console.log('on destroy ' + JSON.stringify(this.currentSelectedUnitCesMultiPayMicroRowGroups));
    // console.log('on setroy ' + JSON.stringify(this.currentSelectedUnit.CesMicroDataPayGroups));
  }


  isNumber(value: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
  }

 isCollectionMicroRowType(microRow: CollectionsCesMicroDataDto | CesMultiPay): microRow is CollectionsCesMicroDataDto {
    return (microRow as CollectionsCesMicroDataDto).CesMultiPay !== undefined;
 }

  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '';
  }

  getPrevPeriod(refYY: number, refMM: number): PreviousPeriod {
    let prevMonth = 0;
    let prevYear = 0;
    try {
        if (refMM !== null && refYY != null) {
          if (refMM === 1) {
              prevMonth = 12;
              prevYear = (refYY - 1);
            } else {
              prevYear = refYY;
              prevMonth = refMM;
              prevMonth = (prevMonth - 1);
          }
        }
      } catch (e) {
        return null;
    }
    const prev: PreviousPeriod = { refYY: prevYear, refMM: prevMonth };
    return prev;
  }


  getCurrentUnitSchedType(): string {
    return this.currentSelectedUnit != null ? this.currentSelectedUnit.EmployeeType : null;
  }

/*---------------------------------------------end helper methods ---------------------------------------------*/

  // for single unit
  getGoodDateFOrSingleUnitCase(currentMicroRow: CollectionsCesMicroData) {
        // get the right micro row to compare
      if(this.unitService.pristineClonedUnit == null || this.currentSelectedUnit == null) {
        return null;
      } else {
        try{
          const currentPristineUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === this.currentSelectedUnit.UnitId);
          if(currentPristineUnit != null) {
            const pristineMicroRow = currentPristineUnit.CesMicroDataList
                        .find(a => a.RefMM === currentMicroRow.RefMM && a.RefYY === currentMicroRow.RefYY);

            const newGoodDate = this.getTodayAsGoodDateIfMicroDataChanged(currentMicroRow, pristineMicroRow);

            return newGoodDate != null ? newGoodDate : pristineMicroRow.GoodDate;

            // if (pristineMicroRow != null) {

            //     const now: Date = new Date();
            //     const newGoodDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRow.TotalWorkers)) {
            //       console.log('TotalWorkers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRow.TotalWomenWorkers)) {
            //       console.log('TotalWomenWorkers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRow.TotalWorkerPayrolls)) {
            //       console.log('TotalWorkerPayrolls changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRow.TotalWorkerHours)) {
            //       console.log('TotalWorkerHours changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRow.TotalCommisions)) {
            //       console.log('TotalCommisions changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRow.TotalOvertime)) {
            //       console.log('TotalOvertime changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRow.TotalNonSUpervisoryCommisions)) {
            //       console.log('TotalNonSUpervisoryCommisions changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRow.TotalNonSupervisoryOvertime)) {
            //       console.log('TotalNonSupervisoryOvertime changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRow.TotalNonSupervisoryWokers)) {
            //       console.log('TotalNonSupervisoryWokers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRow.TotalNonSupervisoryWorkerHours)) {
            //       console.log('TotalNonSupervisoryWorkerHours changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRow.TotalNonSupervisoryWorkerPayrolls)) {
            //       console.log('TotalNonSupervisoryWorkerPayrolls changed ');
            //       return newGoodDate;
            //     }

            //     // compare each cell value
            //     const cc2StrVal: string = currentMicroRow.EmployementShift2 ? null : currentMicroRow.EmployementShift2.code;
            //     if (pristineMicroRow.EmployementShift2 !== cc2StrVal) {
            //       console.log('EmployementShift2 changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     const cc1StrVal: string = currentMicroRow.EmployementShift1 ? null : currentMicroRow.EmployementShift1.code;
            //     if (pristineMicroRow.EmploymentShift1 !== cc1StrVal) {
            //       console.log('EmploymentShift1 changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRow.PrLp)) {
            //       console.log('PrLp changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRow.CmLp)) {
            //       console.log('CmLp changed ');
            //       return newGoodDate;
            //     }
            // }

          }
        }
        catch(e) {
          console.log('Could not find good date from server micro row');
          return null;
        }
      }
  }

  // for multi unit case
  getGoodDateForMultiUnitCase(currentMicroRow: CollectionsCesMicroData) {
    // get the right micro row to compare
    let pristineMicroRow: CollectionsCesMicroDataDto = null;
    if(this.unitService.pristineClonedUnit == null || this.currentSelectedUnit == null) {
      return null;
    } else {
      try{
        const currentPristineUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === this.currentSelectedUnit.UnitId);
        if(currentPristineUnit != null) {
          if(currentPristineUnit.CesMicroDataList == null) {
            return  this.fetchMicroDataGoodDateForUnit(currentMicroRow);
          } else {
            pristineMicroRow = currentPristineUnit.CesMicroDataList
                      .find(a => a.RefMM === currentMicroRow.RefMM && a.RefYY === currentMicroRow.RefYY);

            const newGoodDate = this.getTodayAsGoodDateIfMicroDataChanged(currentMicroRow, pristineMicroRow);

            return newGoodDate != null ? newGoodDate : pristineMicroRow.GoodDate;
            // if (pristineMicroRow != null) {

            //     const now: Date = new Date();
            //     const newGoodDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRow.TotalWorkers)) {
            //       console.log('TotalWorkers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRow.TotalWomenWorkers)) {
            //       console.log('TotalWomenWorkers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRow.TotalWorkerPayrolls)) {
            //       console.log('TotalWorkerPayrolls changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRow.TotalWorkerHours)) {
            //       console.log('TotalWorkerHours changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRow.TotalCommisions)) {
            //       console.log('TotalCommisions changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRow.TotalOvertime)) {
            //       console.log('TotalOvertime changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRow.TotalNonSUpervisoryCommisions)) {
            //       console.log('TotalNonSUpervisoryCommisions changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRow.TotalNonSupervisoryOvertime)) {
            //       console.log('TotalNonSupervisoryOvertime changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRow.TotalNonSupervisoryWokers)) {
            //       console.log('TotalNonSupervisoryWokers changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRow.TotalNonSupervisoryWorkerHours)) {
            //       console.log('TotalNonSupervisoryWorkerHours changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRow.TotalNonSupervisoryWorkerPayrolls)) {
            //       console.log('TotalNonSupervisoryWorkerPayrolls changed ');
            //       return newGoodDate;
            //     }

            //     // compare each cell value
            //     const cc2StrVal: string = currentMicroRow.EmployementShift2 ? null : currentMicroRow.EmployementShift2.code;
            //     if (pristineMicroRow.EmployementShift2 !== cc2StrVal) {
            //       console.log('EmployementShift2 changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     const cc1StrVal: string = currentMicroRow.EmployementShift1 ? null : currentMicroRow.EmployementShift1.code;
            //     if (pristineMicroRow.EmploymentShift1 !== cc1StrVal) {
            //       console.log('EmploymentShift1 changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRow.PrLp)) {
            //       console.log('PrLp changed ');
            //       return newGoodDate;
            //     }
            //     // compare each cell value
            //     if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRow.CmLp)) {
            //       console.log('CmLp changed ');
            //       return newGoodDate;
            //     }
            // }
            // return pristineMicroRow.GoodDate;
          }
        }
      }
      catch(e) {
        console.log('Could not find good date from server micro row');
        return null;
      }
    }
  }


  // in multi unit case we need to fetch from the server to get teh single source of truth copy to compare to
  // systems fails otherwise.
  fetchMicroDataGoodDateForUnit(currentMicroRow: CollectionsCesMicroData): Date {
    let pristineMicroRow: CollectionsCesMicroDataDto = null;
    const currentPristineUnit = this.unitService.pristineClonedUnit.find(a => a.unitPK === this.currentSelectedUnit.UnitId);
    if(currentPristineUnit.CesMicroDataList == null) {
      const params = new HttpParams().set('stateCode', this.currentSelectedUnit.StateCode).set('reptNum', this.currentSelectedUnit.ReportNum);
      this.tcwHttpService.httpGet<CollectionsCesMicroDataDto[]>('/api/CesMicroData', params)
      .subscribe((result: CollectionsCesMicroDataDto[]) => {
            // add to the cloned unit list from unitService - Important
            currentPristineUnit.CesMicroDataList = _.cloneDeep(result);
            pristineMicroRow = currentPristineUnit.CesMicroDataList
                .find(a => a.RefMM === currentMicroRow.RefMM && a.RefYY === currentMicroRow.RefYY);

            const newGoodDate = this.getTodayAsGoodDateIfMicroDataChanged(currentMicroRow, pristineMicroRow);

            return newGoodDate != null ? newGoodDate : pristineMicroRow.GoodDate;
            // if (pristineMicroRow != null) {

            //       const now: Date = new Date();
            //       const newGoodDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRow.TotalWorkers)) {
            //         console.log('TotalWorkers changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRow.TotalWomenWorkers)) {
            //         console.log('TotalWomenWorkers changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRow.TotalWorkerPayrolls)) {
            //         console.log('TotalWorkerPayrolls changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRow.TotalWorkerHours)) {
            //         console.log('TotalWorkerHours changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRow.TotalCommisions)) {
            //         console.log('TotalCommisions changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRow.TotalOvertime)) {
            //         console.log('TotalOvertime changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRow.TotalNonSUpervisoryCommisions)) {
            //         console.log('TotalNonSUpervisoryCommisions changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRow.TotalNonSupervisoryOvertime)) {
            //         console.log('TotalNonSupervisoryOvertime changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRow.TotalNonSupervisoryWokers)) {
            //         console.log('TotalNonSupervisoryWokers changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRow.TotalNonSupervisoryWorkerHours)) {
            //         console.log('TotalNonSupervisoryWorkerHours changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRow.TotalNonSupervisoryWorkerPayrolls)) {
            //         console.log('TotalNonSupervisoryWorkerPayrolls changed ');
            //         return newGoodDate;
            //       }

            //       // compare each cell value
            //       const cc2StrVal: string = currentMicroRow.EmployementShift2 ? null : currentMicroRow.EmployementShift2.code;
            //       if (pristineMicroRow.EmployementShift2 !== cc2StrVal) {
            //         console.log('EmployementShift2 changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       const cc1StrVal: string = currentMicroRow.EmployementShift1 ? null : currentMicroRow.EmployementShift1.code;
            //       if (pristineMicroRow.EmploymentShift1 !== cc1StrVal) {
            //         console.log('EmploymentShift1 changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRow.PrLp)) {
            //         console.log('PrLp changed ');
            //         return newGoodDate;
            //       }
            //       // compare each cell value
            //       if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRow.CmLp)) {
            //         console.log('CmLp changed ');
            //         return newGoodDate;
            //       }
            // }
            // return pristineMicroRow.GoodDate;
          }
        );
    }
    return null;
  }

  // common code that all 3 above methods use to determine if data changed
  getTodayAsGoodDateIfMicroDataChanged(currentMicroRow: CollectionsCesMicroData, pristineMicroRow: CollectionsCesMicroDataDto){
    if (pristineMicroRow != null) {

      const now: Date = new Date();
      const newGoodDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalWorkers, currentMicroRow.TotalWorkers)) {
        console.log('TotalWorkers changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalWomenWorkers, currentMicroRow.TotalWomenWorkers)) {
        console.log('TotalWomenWorkers changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalWorkerPayrolls, currentMicroRow.TotalWorkerPayrolls)) {
        console.log('TotalWorkerPayrolls changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalWorkerHours, currentMicroRow.TotalWorkerHours)) {
        console.log('TotalWorkerHours changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalCommisions, currentMicroRow.TotalCommisions)) {
        console.log('TotalCommisions changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalOvertime, currentMicroRow.TotalOvertime)) {
        console.log('TotalOvertime changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalNonSUpervisoryCommisions, currentMicroRow.TotalNonSUpervisoryCommisions)) {
        console.log('TotalNonSUpervisoryCommisions changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryOvertime, currentMicroRow.TotalNonSupervisoryOvertime)) {
        console.log('TotalNonSupervisoryOvertime changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWokers, currentMicroRow.TotalNonSupervisoryWokers)) {
        console.log('TotalNonSupervisoryWokers changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerHours, currentMicroRow.TotalNonSupervisoryWorkerHours)) {
        console.log('TotalNonSupervisoryWorkerHours changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.TotalNonSupervisoryWorkerPayrolls, currentMicroRow.TotalNonSupervisoryWorkerPayrolls)) {
        console.log('TotalNonSupervisoryWorkerPayrolls changed ');
        return newGoodDate;
      }

      // compare each cell value
      const cc2StrVal: string = currentMicroRow.EmployementShift2 ? null : currentMicroRow.EmployementShift2.code;
      if (pristineMicroRow.EmployementShift2 !== cc2StrVal) {
        console.log('EmployementShift2 changed ');
        return newGoodDate;
      }
      // compare each cell value
      const cc1StrVal: string = currentMicroRow.EmployementShift1 ? null : currentMicroRow.EmployementShift1.code;
      if (pristineMicroRow.EmploymentShift1 !== cc1StrVal) {
        console.log('EmploymentShift1 changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.PrLp,currentMicroRow.PrLp)) {
        console.log('PrLp changed ');
        return newGoodDate;
      }
      // compare each cell value
      if (this.isDifferent(pristineMicroRow.CmLp,currentMicroRow.CmLp)) {
        console.log('CmLp changed ');
        return newGoodDate;
      }
  }
  }



  isDifferent = (originalValue, newValue) => {
    const originalValueStr: string = originalValue + '';
    const newValueStr: string = newValue + '';
    console.log('comparing 2 numbers as strings ' + originalValueStr + 'and ' + newValueStr);
    if(originalValueStr === newValueStr) {
      console.log('they are same');
      return false;
    } else {
      return true;
    }
  }


}
