import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { CollectionsUnit } from '../collection/models/collection-unit.model';
import { map, tap, take, catchError } from 'rxjs/operators';
import { LookupService } from 'src/app/core/services/lookup.service';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import { UnitService } from './unit.service';
import { Unit } from 'src/app/shared/models/unit.model';
import { CollectionsJoltsMicroData, CollectionsJoltsMicroDataDto, RolloverReminder } from 'src/app/shared/models/collections-microdata.model';
import { AddressType, Address } from 'src/app/shared/models/address.model';
import * as fromApp from '../../store/app.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { JoltsScreeningParametersDto, ScreeningParameters } from 'src/app/shared/models/screening-parameters-dto.model';
import { JoltsEditScreenValidationService } from './jolts-edit-screen-validation.service';
import { JoltsMicroRatioService } from './jolts-micro-ratio.service';
import { months } from 'moment';
import { QuiData } from 'src/app/shared/models/quidata.model';
import { Store } from '@ngrx/store';
import { EnvironmentDetails } from 'src/app/shared/models/environment-details.model';
import * as moment from 'moment';
import { Case } from 'src/app/shared/models/case.model';
import { HttpParams } from '@angular/common/http';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { CaseListService } from 'src/app/case-list/services/case-list.service';
import { RespCode } from 'src/app/shared/models/resp-code.model';
import { ExplCode } from 'src/app/shared/models/expl-code.model';
import { RolloverService } from './rollover.service';
import { TransferRequest } from 'src/app/shared/models/transfer-request.model';
import { MicroDataCellObject } from '../collection/models/microdata-cell-object.model';


// type to represent prev microdata month year and month
type PreviousPeriod = {
  refMM: number;
  refYY: number;
};




@Injectable({
  providedIn: 'root'
})
export class JoltsCollectionsService {

// TODO: replace this wth skipSetRc
allowToSetMicroDataRC = false;

currentSeletectedCase: Case = null;
currentSelectedUnit: CollectionsUnit = null;

currentEnvironmentVariables: EnvironmentDetails = null;
collectionYearMonthMoment: moment.Moment;
cutOffYearMonthMoment: moment.Moment;
collectionYear: string;
collectionMonth: string;

// action stream on unit changed event
onUnitChangedStartScriptSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
onUnitChangedStartScript$: Observable<string> = this.onUnitChangedStartScriptSubject.asObservable();

// action stream on unit changed event
onRolloverReminderSubject: BehaviorSubject<RolloverReminder> = new BehaviorSubject<RolloverReminder>(null);
onRolloverReminder$: Observable<RolloverReminder> = this.onRolloverReminderSubject.asObservable();


// action stream on unit changed event
onHistoricalViewToggleSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
onHistoricalViewToggle$: Observable<boolean> = this.onHistoricalViewToggleSubject.asObservable();

// action subject to notify component cahanges in microdata list
onCollectionUnitChangedScreeningParamsSubject: BehaviorSubject<JoltsScreeningParametersDto> = new BehaviorSubject<JoltsScreeningParametersDto>(null);
selectedScreeningParams$: Observable<JoltsScreeningParametersDto> = this.onCollectionUnitChangedScreeningParamsSubject.asObservable();

// subject observable to set LDB error dialog when error
hasLdbErrorSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
hasLdbError$: Observable<boolean> = this.hasLdbErrorSubject.asObservable();

// subject observable to show/hide the notice text on LDB error dialog when error
onLdbErrorIsUnitNAICSValidSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
onLdbErrorIsUnitNAICSValid$: Observable<boolean> = this.onLdbErrorIsUnitNAICSValidSubject.asObservable();

// action subject to notify component cahanges in microdata list
onCollectionUnitChangedMicroDataSubject: BehaviorSubject<CollectionsJoltsMicroData[]> = new BehaviorSubject<CollectionsJoltsMicroData[]>([]);
CollectionMicroData$: Observable<CollectionsJoltsMicroData[]> = this.onCollectionUnitChangedMicroDataSubject.asObservable();


// action stream on unit changed event
onCollectionsUnitChangedSubject: BehaviorSubject<CollectionsUnit> = new BehaviorSubject<CollectionsUnit>(null);
collectionsUnitChanged$: Observable<CollectionsUnit> = this.onCollectionsUnitChangedSubject.asObservable();

// backing variable for observable for ease of manipulation later
collectionUnitListVm: CollectionsUnit[];

currentLoggedInUser = '';
canSkipAeLebCheck = false;


// covernt and return as observable of units already prepared and stored in variable
collectionUnitListVm$: Observable<CollectionsUnit[]> = of(this.collectionUnitListVm)
    .pipe(
      map(units => units)
    );

// create a view model list Observable by mapping from the list of units[] DTOs (returned from the UnitService that calls http)
// to view model list of CollectionsUnit[]
joltsCollectionUnitListVmForDropdown$: Observable<CollectionsUnit[]> = this.unitService.units$
.pipe(
    map(units =>
      units.map(unit => this.createCollectionsData(unit))
    ),
    tap(cu => {
      console.log(JSON.stringify(cu));
      // set the genrated Vm to backing vairable for later use
      this.collectionUnitListVm = cu;

      // also set the current selected unit backing variable
      this.currentSelectedUnit = cu[0]; // first unit
    }),
  );

  constructor(private unitService: UnitService,
              private lookupService: LookupService,
              private caseListService: CaseListService,
              private tcwHttpService: TcwHttpService,
              private rolloverService: RolloverService,
              private store: Store<fromApp.AppState>,
              private editChecksAndScreeningService: JoltsEditScreenValidationService,
              private joltsMicroRatioService: JoltsMicroRatioService) {
                 // get all environment variables
                 this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
                  this.currentEnvironmentVariables = authState.userEnvironment.environmentDetails;
                  this.currentLoggedInUser = authState.userEnvironment.currentUser.userId;
                });



                 this.collectionYear = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_YEAR').envValue;
                 this.collectionMonth = this.currentEnvironmentVariables.environmentVariables.find(a => a.envName === 'CURRENT_MONTH').envValue;
                 this.collectionYearMonthMoment = moment({year: +this.collectionYear, month: +this.collectionMonth, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});
                    // this.collectionYearMonthMoment = moment().month(+this.collectionMonth).year(+this.collectionYear);

                    // (moment().month(+this.collectionMonth).year(+this.collectionYear))
                 this.cutOffYearMonthMoment = (moment({year: +this.collectionYear, month: +this.collectionMonth, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0})).subtract(18, 'months');

                //  this.cutOffYearMonthMoment = moment({year: +cutOffMomemt.year, month: +cutOffMomemt.month, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});

          }


  // main method that transforms and processes the data from the server to validated viewmodel
  createCollectionsData(unit: Unit, collectionsUnit: CollectionsUnit = null) {
    this.currentSeletectedCase  = this.caseListService.getCaseDetails();
    // map the DTO unit to Viewmodel if not already mapped
    if (collectionsUnit == null) {
      collectionsUnit  = this.mapUnitsDtoToUnitsViewModel(unit);
      // this.currentSelectedUnit = collectionsUnit;
    }

    // prepare child objects of collections unit - microdata mapings
    collectionsUnit.JoltsMicroData =
          this.mapMicroDataDtoToMicroDataViewModel(unit.JoltsScreeningParameters, unit.JoltsMicroDataList, unit.QUIData, unit.AeLdbRc, collectionsUnit.SizeCode);

    // calculate ratios on load
    collectionsUnit.JoltsMicroData.forEach(currentMicroData => {
      const prevPeriod = this.getPrevPeriod(+currentMicroData.RefYY, +currentMicroData.RefMM);
      const prevMicrodata = collectionsUnit.JoltsMicroData.find(a => +a.RefMM === prevPeriod.refMM && +a.RefYY === prevPeriod.refYY);
      this.processMicroDataRow(collectionsUnit.JoltsScreeningParameters, currentMicroData, prevMicrodata, collectionsUnit.QUIData, collectionsUnit.AeLdbRC, collectionsUnit.SizeCode);
      const index = collectionsUnit.JoltsMicroData.findIndex(a => a.RefYY === currentMicroData.RefYY && a.RefMM === currentMicroData.RefMM);
      collectionsUnit.JoltsMicroData.splice(index, 1, currentMicroData);
    });


    // // set which ones are marked as historical data
    // this.markMicroDataRowsAsHistorical(collectionsUnit);

    return collectionsUnit;
  }


  getInterviewStartScript(): string {
    let script = '';
    // this.currentSeletectedCase  = this.caseListService.getCaseDetails();
    // we want access to trascripts only in thsi method -we will create and destroy it
    const interviewTranscripts: Map<string, string> = this.lookupService.getInterviewScripts(false);
    if (this.currentSeletectedCase != null) {
      script = interviewTranscripts.get('start').replace('{0}', `${this.currentSeletectedCase.CON_FIRST} ${this.currentSeletectedCase.CON_LAST}`);
    } else {
      script = interviewTranscripts.get('start').replace('{1}', this.currentLoggedInUser);
    }
    script = script.replace('{1}', this.currentLoggedInUser);
    script = script.replace('{2}', this.currentSelectedUnit.UiNumber);
    script = script.replace('{3}', this.currentSelectedUnit.EditableStateAddress);

    let allUnitAddressStrings = '';
    // for mulit units we want to build strings with address for each unit
    if (this.collectionUnitListVm != null) {
      this.collectionUnitListVm.forEach(unit => {
        let fullAddressString = ``;
        // for each unit get the address string
        if (unit.OriginalPhysicalAddress != null) {
          fullAddressString = `Unit - ${unit.OriginalPhysicalAddress.Address1},
                                     ${unit.OriginalPhysicalAddress.City},
                                     ${unit.OriginalPhysicalAddress.State},
                                     ${unit.OriginalPhysicalAddress.ZipCode}`;
        } else {
          fullAddressString = `Unit - ${unit.EditablePhyiscalAddress.Address1},
                                ${unit.EditablePhyiscalAddress.City},
                                ${unit.EditablePhyiscalAddress.State},
                                ${unit.EditablePhyiscalAddress.ZipCode}`;
        }
        allUnitAddressStrings = allUnitAddressStrings + `<br>` + fullAddressString;
      });
    }
    script = script.replace('{4}', allUnitAddressStrings);
    return script;
  }





  // mapping - takes Unit Dto returns collectionsUnit view model
  mapUnitsDtoToUnitsViewModel(unit: Unit): CollectionsUnit {

    // form an ISO standard string of mmyyyy for momment js


     // now, create unit viewmodel and add the mcirodata at the last
    const collectionsUnit: CollectionsUnit = {
      DispositionCode: unit.DispositionCode,
      DisplayValue: `${unit.StateCode} ${unit.ReportNum}   ${unit.PrimaryName} ___________ ${unit.RespCode}`,
      UnitId: unit.StateCode + unit.ReportNum,
      ReportNum: unit.ReportNum,
      StateCode: unit.StateCode,
      JoltsLocation: unit.JoltsLocation,
      NaicsCode: unit.NAICS,
      ContactFirstName: unit.PrimaryContact,
      InterviewerUserId: unit.InterviewerUserId,
      SizeCode: unit.ESSizeCode,
      UiNumber: unit.UiNumber,
      CMIJolts: unit.CMICes, // we are setting JoltsCMI correctly though it says "CMICes", its actually beloong to jotls. Its just the naming that's misleading. DB table column is named that way in JOLTS unfortunantely
      Location: unit.Location,
      OriginalPhysicalAddress: this.cleanUpAddress(unit.Addresses.find(a => a.AddressType === AddressType.OriginalPhysicalAddress)),
      EditablePhyiscalAddress: this.cleanUpAddress(unit.Addresses.find(a => a.AddressType === AddressType.PrimaryEditableAddress)),
      EditableStateAddress: this.lookupService.isCES ?
        unit.Addresses.find(a => a.AddressType === AddressType.PrimaryEditableAddress).State :
        unit.Addresses.find(a => a.AddressType === AddressType.UITaxAddress).State,
      PrimaryName: unit.PrimaryName,
      MPayStat: unit.MPayStat,
      IsMultiPayRoll: unit.MultiPayrollStatus,
      ResponseCode: unit.RespCode,
      EmployeeType: unit.ScheduleType,
      QUIData: unit.QUIData,
      // JoltsMicroData: microdataList,
      JoltsScreeningParameters: unit.JoltsScreeningParameters,
      HistoricalCutoffMonth: this.cutOffYearMonthMoment.month(),
      HistoricalCutoffYear: this.cutOffYearMonthMoment.year()
    } as CollectionsUnit;

    return collectionsUnit;
  }

  // Cleaning up the address info
  cleanUpAddress(unMappedAddress: Address): Address {
    let addr: Address = {...unMappedAddress};
    if (unMappedAddress != null) {
      addr.Address1 = addr.Address1 != null ? addr.Address1.trim() : '';
      addr.State = addr.State != null ? addr.State.trim() : '';
      addr.City = addr.City != null ? addr.City.trim() : '';
      addr.ZipCode = addr.ZipCode != null ? addr.ZipCode.trim() : '';
    }
    return addr;
  }

  mapMicroDataDtoToMicroDataViewModel(screeningParams: JoltsScreeningParametersDto, joltsMicroDataList: CollectionsJoltsMicroDataDto[],
                                      quiData: QuiData, unitAeLdbRC: string, sizeCode: string): CollectionsJoltsMicroData[] {


    let microDataViewModelList: CollectionsJoltsMicroData[] = [];
    let prevMonthMicrodataViewModel: CollectionsJoltsMicroData = null;

    if (joltsMicroDataList != null && joltsMicroDataList.length > 0) {
         // reverse order the array from oldest month-year to newest (reason - while building viewmodel for a microrow we need its prev month's microrow.
      // easier to build your prev micro first before move to newer micro rows).
        joltsMicroDataList.reverse();

        // foreach microdata from the server in DTO
        joltsMicroDataList.forEach(microRow => {
          // create new view model object
          let currentMonthMicrodataViewModel = new CollectionsJoltsMicroData();

          // const microRowMonthYear = moment({year: +microRow.RefYY, month: +microRow.RefMM, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0});
          const microRowMonthYear: moment.Moment = moment({year: +microRow.RefYY, month: +microRow.RefMM, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0}).subtract(0, 'months');

          // do not include rows that are newer than collection month
          if (microRowMonthYear.isAfter(this.collectionYearMonthMoment)) {
            return true;
          }

          // set if this row is historical
          if (microRowMonthYear.isBefore(this.cutOffYearMonthMoment)) {
            currentMonthMicrodataViewModel.IsHistorical = true;
          } else { // momentjs cannot handle this - doing it wrong - so had to manually handle it
            if (+microRow.RefYY < this.cutOffYearMonthMoment.year()) {
              currentMonthMicrodataViewModel.IsHistorical = true;
            } else if (+microRow.RefYY === this.cutOffYearMonthMoment.year() && +microRow.RefMM < this.cutOffYearMonthMoment.month()) {
              currentMonthMicrodataViewModel.IsHistorical = true;
            } else {
              currentMonthMicrodataViewModel.IsHistorical = null; // other rows - not applicable
            }
          }

          //   // get the prev month microentries and ratios.
          if (microDataViewModelList.length > 0) {
              prevMonthMicrodataViewModel = microDataViewModelList[microDataViewModelList.length - 1];
          }
          // mapping current month and year
          currentMonthMicrodataViewModel.RefMM = microRow.RefMM;
          currentMonthMicrodataViewModel.RefYY = microRow.RefYY;
          currentMonthMicrodataViewModel.RefMMYY = microRow.RefMM + microRow.RefYY;
          currentMonthMicrodataViewModel.unitAeLdbRC = unitAeLdbRC;


          // mapping micro entries
          // AE values
          currentMonthMicrodataViewModel.TotalWorkers = currentMonthMicrodataViewModel.TotalWorkersPrevValue = microRow.TotalEmployees;
          currentMonthMicrodataViewModel.JobOpenings = currentMonthMicrodataViewModel.JobOpeningsPrevValue = microRow.JobOpenings;
          currentMonthMicrodataViewModel.LayoffsAndDischarges = currentMonthMicrodataViewModel.LayoffsAndDischargesPrevValue = microRow.LayoffsAndDischarges;
          currentMonthMicrodataViewModel.NewHires = currentMonthMicrodataViewModel.NewHiresPrevValue = microRow.NewHires;
          currentMonthMicrodataViewModel.OtherSeperation = currentMonthMicrodataViewModel.OtherSeperationPrevValue = microRow.OtherSeperation;
          currentMonthMicrodataViewModel.Quits = currentMonthMicrodataViewModel.QuitsPrevValue = microRow.Quits;
          currentMonthMicrodataViewModel.TotalSeperation = currentMonthMicrodataViewModel.TotalSeperationPrevValue = microRow.TotalSeperation;

          // map derivatives
          currentMonthMicrodataViewModel.NetTurn = microRow.NetTurn;
          currentMonthMicrodataViewModel.CummulativeDifference = microRow.CummulativeDifference;
          currentMonthMicrodataViewModel.CummulativeDifferenceInDB = microRow.CummulativeDifference;
          currentMonthMicrodataViewModel.Difference = microRow.Difference;
          currentMonthMicrodataViewModel.TotalEmployeeChange = microRow.TotalEmployeeChange;

          currentMonthMicrodataViewModel.ReEditCode = this.lookupService.getReEditCodeByCode(microRow.ReEditCode);
          currentMonthMicrodataViewModel.ReportNum = microRow.ReportNum;
          currentMonthMicrodataViewModel.ResetCummulativeDifference = microRow.ResetCummulativeDifference;
          currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, microRow.ResponseCode);
          currentMonthMicrodataViewModel.UpdateDateTime = microRow.UpdateDateTime;
          currentMonthMicrodataViewModel.ExportFlag = microRow.ExportFlag ? 'T' : 'F';
          currentMonthMicrodataViewModel.ExportDateTime = microRow.ExportDateTime;
          currentMonthMicrodataViewModel.InterviewerUserId = microRow.InterviewerUserId;
          currentMonthMicrodataViewModel.Notes = microRow.Notes;
          currentMonthMicrodataViewModel.StateCode = microRow.StateCode;
          currentMonthMicrodataViewModel.Status = microRow.Status;
          currentMonthMicrodataViewModel.ValidatedDateTime = microRow.ValidatedDateTime; // this gets changed if there is no good date already
          currentMonthMicrodataViewModel.GoodDate = microRow.ValidatedDateTime; // this good date is only for display - this never gets changed on the UI
          currentMonthMicrodataViewModel.VerifyUi = ' '; // TODO: find out why verify UI is not coming from the server


          currentMonthMicrodataViewModel.TransactionCode = microRow.TransactionCode;
          currentMonthMicrodataViewModel.EDSC = microRow.EDSC;
          currentMonthMicrodataViewModel.ExportDateTime = microRow.ExportDateTime;

          // mapping strings to dropdown values for selectable by user
          currentMonthMicrodataViewModel.CodeComment1 = this.unitService.getExplanationCodeForCollections(false).find(a => a.code === microRow.CodeComment1);
          currentMonthMicrodataViewModel.CodeComment2 = this.unitService.getExplanationCodeForCollections(false).find(a => a.code === microRow.CodeComment2);
          currentMonthMicrodataViewModel.AP = this.lookupService.getJoltsApCodes().find(a => a.code === microRow.AP);

          if (this.currentSelectedUnit != null) {

            // caluclate/screen/check for edits etc.,
            // this.processMicroDataRow(screeningParams, currentMonthMicrodataViewModel, prevMonthMicrodataViewModel, quiData, unitAeLdbRC, sizeCode);
          }



          // recalcualte RC under these conditions
          // if (this.canRecalculateRC(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel)) {
          //       this.recalculateLpFactorsAndResponseCode(currentMonthMicrodataViewModel);
          //     }

           // set current becomes prev month microview model
          prevMonthMicrodataViewModel = currentMonthMicrodataViewModel;

           // add to the main array of mcirodata to be sent to HTML on load
          microDataViewModelList.push(currentMonthMicrodataViewModel);

           // make sure to clear the referencing memory
          currentMonthMicrodataViewModel = null;
      });
        // reverse back to original order of descending time
        microDataViewModelList.reverse();
        joltsMicroDataList.reverse();
    }

    console.log(microDataViewModelList);

    // set the processed microdata list to the selected unit for later retrieval
    if (this.currentSelectedUnit != null) {
      // this.currentSelectedUnit.CesMicroData = microDataViewModelList;
      // also set the list to the list of units in collection service
      this.collectionUnitListVm.find(a => a.UnitId === this.currentSelectedUnit.UnitId).JoltsMicroData = microDataViewModelList;
    }

    return microDataViewModelList;
  }




  processCurrentEditedMicroDataRow(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    // retain current value state each time user edits
    this.retainCurrentMicroDataValues(currentMonthMicrodataViewModel);


    const prevPeriod = this.getPrevPeriod(+currentMonthMicrodataViewModel.RefYY, +currentMonthMicrodataViewModel.RefMM);
    let prevMonthMicrodataViewModel: CollectionsJoltsMicroData = null;
    // run the checks
    if (this.currentSelectedUnit != null) {
      prevMonthMicrodataViewModel = this.currentSelectedUnit.JoltsMicroData.find(a => +a.RefMM === prevPeriod.refMM && +a.RefYY === prevPeriod.refYY);
      this.processMicroDataRow(this.currentSelectedUnit.JoltsScreeningParameters, currentMonthMicrodataViewModel, prevMonthMicrodataViewModel,
        this.currentSelectedUnit.QUIData, this.currentSelectedUnit.AeLdbRC, this.currentSelectedUnit.SizeCode);


    }

     // Spcial case in setting EDSC error values
     // RC was forced to be 11 during the import process, then RC should not recalcuate even when no EditError Found.
    if (currentMonthMicrodataViewModel.ResponseCode != null && currentMonthMicrodataViewModel.ResponseCode.code === '11') {
      if (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors() && currentMonthMicrodataViewModel.Notes != null) {
      // EDSC does not change and RC does not change. We just return and alter none of these for this current micro
      return;
      }
    }

    // recalcualte RC under these conditions
    if (this.canRecalculateRC(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel)) {
      this.recalculateLpFactorsAndResponseCode(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel);
    }

    // get a reference to the array item in the selected Unit
    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.JoltsMicroData.findIndex(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);

    // replace the prev item in the list with the newly processed item for that refmm and refyy
    this.currentSelectedUnit.JoltsMicroData.splice(index, 1, currentMonthMicrodataViewModel);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;


     // now update derivativeIndicators for all rows if any changes
    this.currentSelectedUnit.JoltsMicroData.forEach(currentMicro => {
      const idx = this.currentSelectedUnit.JoltsMicroData.findIndex(a => a.RefYY === currentMicro.RefYY && a.RefMM === currentMicro.RefMM);
      const prevYearMonth = this.getPrevPeriod(+currentMicro.RefYY, +currentMicro.RefMM);
      const prevMicroRow = this.currentSelectedUnit.JoltsMicroData.find(a => +a.RefMM === prevYearMonth.refMM && +a.RefYY === prevYearMonth.refYY);

      if (prevMicroRow != null) {
        this.joltsMicroRatioService.prevMonthlyMicrodataViewModel = prevMicroRow;
        this.joltsMicroRatioService.recalculateDerivedIndicators(currentMicro, false); // reclcualte NetTurn and diff but not cummDiff. We will calculate that seperately
        this.currentSelectedUnit.JoltsMicroData.splice(idx, 1, currentMicro);
      }
    });

    // update cummulative value for months more recent relative to the current row being processed
    this.updateCummulativeDifferenceOtherMonths();



    // emit the changes to microdata list processed
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.JoltsMicroData);
  }

  retainCurrentMicroDataValues(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    if (currentMonthMicrodataViewModel) {
      currentMonthMicrodataViewModel.TotalWorkersPrevValue = currentMonthMicrodataViewModel.TotalWorkers;
      currentMonthMicrodataViewModel.JobOpeningsPrevValue = currentMonthMicrodataViewModel.JobOpenings;
      currentMonthMicrodataViewModel.NewHiresPrevValue = currentMonthMicrodataViewModel.NewHires;
      currentMonthMicrodataViewModel.LayoffsAndDischargesPrevValue = currentMonthMicrodataViewModel.LayoffsAndDischarges;
      currentMonthMicrodataViewModel.QuitsPrevValue = currentMonthMicrodataViewModel.Quits;
      currentMonthMicrodataViewModel.OtherSeperationPrevValue = currentMonthMicrodataViewModel.OtherSeperation;
      currentMonthMicrodataViewModel.TotalSeperationPrevValue = currentMonthMicrodataViewModel.TotalSeperation;
    }
  }


  updateCummulativeDifferenceOtherMonths() {
    let tempCummDifference: number | string = null;
    let firstRowWithValues = true;
    if (this.currentSelectedUnit != null && this.currentSelectedUnit.JoltsMicroData != null) {
      // update cumm diff for each month starting from the last (oldest month - backwards) that has values
      for (let i = this.currentSelectedUnit.JoltsMicroData.length; i >= 0; i--) {
        if (this.currentSelectedUnit.JoltsMicroData[i] != null && this.currentSelectedUnit.JoltsMicroData[i].Difference != null) {
          if (firstRowWithValues) {
            this.currentSelectedUnit.JoltsMicroData[i].CummulativeDifference = +this.currentSelectedUnit.JoltsMicroData[i].Difference;
            tempCummDifference = +this.currentSelectedUnit.JoltsMicroData[i].CummulativeDifference;
            firstRowWithValues = false;
          } else if (tempCummDifference != null) {
            tempCummDifference = +tempCummDifference + +this.currentSelectedUnit.JoltsMicroData[i].Difference;
            if (+tempCummDifference !== 0) {
              this.currentSelectedUnit.JoltsMicroData[i].CummulativeDifference =  tempCummDifference;
            }
          }
        } else {
          tempCummDifference = null; // reset if a row found with no values
          firstRowWithValues = true;
        }
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

  setRcOnUserSelection(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    // set RC 90
    currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '90');

     // get a reference to the array item in the selected Unit
    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.JoltsMicroData.findIndex(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);

    // replace the prev item in the list with the newly processed item for that refmm and refyy
    this.currentSelectedUnit.JoltsMicroData.splice(index, 1, currentMonthMicrodataViewModel);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;

    // emit the changes to microdata list processed
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.JoltsMicroData);
  }




  clearScreeningErrors(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {

    currentMonthMicrodataViewModel.JoltsEditScreeningErrorScripts.clear();
    currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.clearErrors();
    currentMonthMicrodataViewModel.JoltsRatioScreeningErrorScripts.clear();
    currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.clearErrors();

    // set RC 90
    currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(true, '90');

    if (currentMonthMicrodataViewModel.GoodDate == null) {
      const now: Date = new Date();
      currentMonthMicrodataViewModel.ValidatedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }


    // get a reference to the array item in the selected Unit
    // let microRow = this.currentSelectedUnit.CesMicroData.find(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);
    const index = this.currentSelectedUnit.JoltsMicroData.findIndex(a => a.RefYY === currentMonthMicrodataViewModel.RefYY && a.RefMM === currentMonthMicrodataViewModel.RefMM);

    // replace the prev item in the list with the newly processed item for that refmm and refyy
    this.currentSelectedUnit.JoltsMicroData.splice(index, 1, currentMonthMicrodataViewModel);
    // this.currentSelectedUnit.CesMicroData[index] = currentMonthMicrodataViewModel;

    // emit the changes to microdata list processed
    this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.JoltsMicroData);
  }



  toggleAeLdbError(show: boolean) {
    this.hasLdbErrorSubject.next(show);
  }

  isNceNAICSCodeValid() {
    const codes = this.lookupService.getNENAICSCodes();

    if (this.currentSelectedUnit.NaicsCode != null) {
      const foundCode = codes.find(a => a === this.currentSelectedUnit.NaicsCode);
      if (foundCode) {
        return true;
      } else {
        return false;
      }
    }
  }


  // method to calcualte ratios for this micro row month, check for edit error, screens for ratio errors
  processMicroDataRow(screeningParameters: JoltsScreeningParametersDto,
                      currentMonthMicrodataViewModel: CollectionsJoltsMicroData,
                      prevMonthMicrodataViewModel: CollectionsJoltsMicroData, quiData: QuiData, unitAeLdbRC: string, sizeCode: string) {
      // sets ValidationContext errors "MicroDataCellContextError" object
      this.editChecksAndScreeningService.setEditCheckErrors(currentMonthMicrodataViewModel);

      // set appropriate micro rows
      this.joltsMicroRatioService.currentMonthlyMicrodataViewModel = currentMonthMicrodataViewModel;
      this.joltsMicroRatioService.prevMonthlyMicrodataViewModel = prevMonthMicrodataViewModel;
      // calucalte the ratios first for current month
      this.joltsMicroRatioService.calculateJoltsMicroRatios(currentMonthMicrodataViewModel);


      // if no errors then perform screening errors for ratios
      if (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors()) {

          this.joltsMicroRatioService.joltsLdbChecks(currentMonthMicrodataViewModel,
                                              screeningParameters, quiData, this.currentSeletectedCase.START_DATE, unitAeLdbRC);
          // currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.isAeLdbTestError = false;
          if (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.isAeLdbTestError) {
              // check if screening is possible - if CodeComment is set to (null,empty string) or
              // when CODE_COMMENT is a number and this number is 83, otherwise
              if (currentMonthMicrodataViewModel.CodeComment1 == null ||
                  (currentMonthMicrodataViewModel.CodeComment1 != null && currentMonthMicrodataViewModel.CodeComment1.code == null)) {
                  // || (currentMonthMicrodataViewModel.CodeComment1 != null && currentMonthMicrodataViewModel.CodeComment1.code === '83')) {
                    // perform ratio screening
                    this.joltsMicroRatioService.currentMonthlyMicrodataViewModel = currentMonthMicrodataViewModel;
                    this.joltsMicroRatioService.prevMonthlyMicrodataViewModel = prevMonthMicrodataViewModel;
                    // call screening
                    this.joltsMicroRatioService.screenJoltsRatiosForErrors(screeningParameters, sizeCode);
              } else {
                // Prasad - 09/25 - Users requestes this be remvoed - do not append CC's to original Notes
                // currentMonthMicrodataViewModel.Notes += ' CC:' + currentMonthMicrodataViewModel.CodeComment1.code;
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


  canRecalculateRC(prevMonthMicrodataViewModel: CollectionsJoltsMicroData, currentMonthMicrodataViewModel: CollectionsJoltsMicroData): boolean {
    // before we check to see if we even can set RC or change RC, we have special case where we simply go ahead and set RC
    // 1. even when no data entry is done for that month but there are screening errors (because of over the month changes)
     // special condition - where even when no data reported for that month but tehre is a screening error
    // if (!this.joltsMicroDataReported(currentMonthMicrodataViewModel) && currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors()) {
    //   currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '12');
    // }



    let hasNoEditOrScreeningOrScreeningEditErrorsButPrevNonResponsive = false;
    let hasNoEditOrScreeningOrScreeningEditErrorsButNonResponsive = false;
    let hasNoEditOrScreeningOrScreeningEditErrorsButPrevSuccess = false;
    //  Edit Error Fonud but RESP_CODE is not set to 11 yet
    const hasEditErrorWithNoRC11: boolean = currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors()
                                                  && currentMonthMicrodataViewModel.ResponseCode.code !== '11';

    // Screening Error Found but RESP_CODE is not set to 12 yet
    const hasScreeningErrorsWithNoRC12 = (currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors() ||
                                            currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) &&
                                            (currentMonthMicrodataViewModel.ResponseCode.code !== '12');

    // If Edit Error and Screening Error are fixed but RESP_CODE is not set to 00/81/82/90 yet
    const hasNoScreeningOrEditOrOtmErrorsWithNoRC = (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors() &&
                                                  !currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors() &&
                                                  !currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) &&
                                                  (currentMonthMicrodataViewModel.ResponseCode.code === '12' || currentMonthMicrodataViewModel.ResponseCode.code === '11');

    if (prevMonthMicrodataViewModel != null) {
            // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrScreeningEditErrorsButPrevNonResponsive =  (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors() &&
          !currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors() &&
          !currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) &&
          (currentMonthMicrodataViewModel.ResponseCode.code !== '82') && (prevMonthMicrodataViewModel.ResponseCode.code === '81' || prevMonthMicrodataViewModel.ResponseCode.code === '82');

          // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrScreeningEditErrorsButNonResponsive =  (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors() &&
            !currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors() &&
            !currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) &&
            (currentMonthMicrodataViewModel.ResponseCode.code !== '81') && (prevMonthMicrodataViewModel.ResponseCode.code === '00');

          // If No Edit Error and Screening Error, but delinquine RC is not correct.
         hasNoEditOrScreeningOrScreeningEditErrorsButPrevSuccess =  (!currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors() &&
          !currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors() &&
          !currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) &&
          (currentMonthMicrodataViewModel.ResponseCode.code !== '00') && (prevMonthMicrodataViewModel.ResponseCode.code === '90');
    }

    // recalcualte RC under these conditions
    return currentMonthMicrodataViewModel != null || hasEditErrorWithNoRC11 || hasScreeningErrorsWithNoRC12 || hasNoScreeningOrEditOrOtmErrorsWithNoRC || hasNoEditOrScreeningOrScreeningEditErrorsButPrevNonResponsive ||
            hasNoEditOrScreeningOrScreeningEditErrorsButNonResponsive || hasNoEditOrScreeningOrScreeningEditErrorsButPrevSuccess;
}


  recalculateLpFactorsAndResponseCode(prevMonthMicrodataViewModel: CollectionsJoltsMicroData, currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    // set RC
    this.setMicroDataRC(prevMonthMicrodataViewModel, currentMonthMicrodataViewModel);

    // set ratio errors to EDSC
    const errors = new Array<string>();
    let finalErrors = new Array<string>();
    currentMonthMicrodataViewModel.JoltsEditScreeningErrorScripts.forEach(err => errors.push(err));
    currentMonthMicrodataViewModel.JoltsRatioScreeningErrorScripts.forEach(err => errors.push(err));

    // remove duplicates
    if (errors.length > 0) {
    const uniqueSet = new Set(errors);
    finalErrors = [...uniqueSet];
    }
    currentMonthMicrodataViewModel.EDSC = finalErrors.join(';');
    console.log('errors ' + currentMonthMicrodataViewModel.EDSC);
  }


  setMicroDataRC(prevMicrodataViewModel: CollectionsJoltsMicroData, currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    // TODO: calcualte prev micro
    const prevMicro = null;
    const caseStartDate = this.currentSeletectedCase.START_DATE;

    if (currentMonthMicrodataViewModel != null) {

      // if (this.lookupService.isRespCodeUserAssigned(currentMonthMicrodataViewModel.ResponseCode.code) &&
      //    (this.isResponseCodeAvailable(currentMonthMicrodataViewModel.ResponseCode) && currentMonthMicrodataViewModel.ResponseCode.code !== '18') &&
      //     !this.lookupService.isRespCodeRefusal(currentMonthMicrodataViewModel.ResponseCode.code)) {
      //       return;
      // }

      if (this.lookupService.isRespCodeRefusal(currentMonthMicrodataViewModel.ResponseCode.code) &&
         !this.joltsMicroDataReported(currentMonthMicrodataViewModel)) {
        return;
      }




      // Scenario 2 - If scenario 1 fails - go ahead and set the RC for this micro row.
      // check if RC on the microdata now is UserAssigned type
      if (currentMonthMicrodataViewModel.ResponseCode != null && prevMicrodataViewModel != null) {
        // follow the happy path - some of the values are reported
        if (this.joltsMicroDataReported(currentMonthMicrodataViewModel)) {
            // edit errors
            if (currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.hasEditErrors()) { // had edit errors
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '11');
            } else if (currentMonthMicrodataViewModel.JoltsMicroDataCellEditContextError.isAeLdbTestError) { // has LDB check errors
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '12');
            }  else if (currentMonthMicrodataViewModel.JoltsMicroDataCellEditScreeningError.hasEditScreeningErrors()) { // has edit screening errors
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '12');
            } else if (currentMonthMicrodataViewModel.JoltsMicroDataCellRatioScreeningError.hasScreeningErrors()) { // has screening errors
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '12');
            } else { // no errors - successfully collected
                currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '90');
                // if (currentMonthMicrodataViewModel.ValidatedDateTime == null) {
                //   const now: Date = new Date();
                //   currentMonthMicrodataViewModel.ValidatedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                // }
                // check if only TE is reported, then change 90 to 91
                if (this.joltsOnlyTotalEmployeeReported(currentMonthMicrodataViewModel)) {
                  currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '91');
                }
            }
        } else if (this.currentSelectedUnit.ResponseCode === '18') {
            // set RC when  unit resp code of 18
            this.setJoltsRCWhenUnitRespCode18(prevMicrodataViewModel, currentMonthMicrodataViewModel);
        } else {
          if (prevMicrodataViewModel != null) {
            if (!this.isResponseCodeAvailable(prevMicrodataViewModel.ResponseCode)) {
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '00');
            } else if (this.isResponseCodeAvailable(prevMicrodataViewModel.ResponseCode) && prevMicrodataViewModel.ResponseCode.code === '00') {
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '81');
            } else if (this.isResponseCodeAvailable(prevMicrodataViewModel.ResponseCode) && prevMicrodataViewModel.ResponseCode.code === '81') {
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '82');
            } else if (this.isResponseCodeAvailable(prevMicrodataViewModel.ResponseCode) && prevMicrodataViewModel.ResponseCode.code === '82') {
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '82');
            } else if (this.lookupService.isRespCodeUserAssigned(prevMicrodataViewModel.ResponseCode.code) ||
                      this.lookupService.isRespCodeOutOfBusiness(prevMicrodataViewModel.ResponseCode.code) ||
                      this.lookupService.isRespCodePendingFollowup(prevMicrodataViewModel.ResponseCode.code) ||
                      this.lookupService.isRespCodeRefusal(prevMicrodataViewModel.ResponseCode.code) ||
                      this.lookupService.isRespCodeDuplicate(prevMicrodataViewModel.ResponseCode.code)) {
              // set previous micro row RC to current micro
              currentMonthMicrodataViewModel.ResponseCode = prevMicrodataViewModel.ResponseCode;
            } else if (this.lookupService.isRespCodeMaximumCalls(prevMicrodataViewModel.ResponseCode.code) ||
                      this.lookupService.isRespCodeCannotLocate(prevMicrodataViewModel.ResponseCode.code)) {
              // set previous micro row RC to current micro
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '81');
            } else {
              currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '00');
            }
          } else {  // scenario 3 - if prev micro unavailable set RC to 00
            currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '00');
          }

        }
      }
    }
  }


  setJoltsRCWhenUnitRespCode18(prevMicrodataViewModel: CollectionsJoltsMicroData, currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    if (prevMicrodataViewModel.ResponseCode != null) {
      if (this.lookupService.isRespCodeUserAssigned(prevMicrodataViewModel.ResponseCode.code) ||
          this.lookupService.isRespCodeOutOfBusiness(prevMicrodataViewModel.ResponseCode.code) ||
          this.lookupService.isRespCodePendingFollowup(prevMicrodataViewModel.ResponseCode.code) ||
          this.lookupService.isRespCodeRefusal(prevMicrodataViewModel.ResponseCode.code) ||
          this.lookupService.isRespCodeDuplicate(prevMicrodataViewModel.ResponseCode.code)) {
            // set previous micro row RC to current micro
            currentMonthMicrodataViewModel.ResponseCode = prevMicrodataViewModel.ResponseCode;
      } else if (this.lookupService.isRespCodeMaximumCalls(prevMicrodataViewModel.ResponseCode.code) ||
                 this.lookupService.isRespCodeCannotLocate(prevMicrodataViewModel.ResponseCode.code)) {
            // set previous micro row RC to current micro
            currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '81');
      } else {
        // set previous micro row RC to current micro
        currentMonthMicrodataViewModel.ResponseCode = this.lookupService.getResponseCodeByCode(false, '18');
      }
    }
  }


  isResponseCodeAvailable(respCode: RespCode): boolean {
    return (respCode != null && respCode.code != null);
  }

  joltsMicroDataReported(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    return this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.JobOpenings)  ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.LayoffsAndDischarges) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.NewHires) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.Quits) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.TotalSeperation) ||
          this.isReportedAndValid(currentMonthMicrodataViewModel.OtherSeperation);
  }

  joltsOnlyTotalEmployeeReported(currentMonthMicrodataViewModel: CollectionsJoltsMicroData) {
    return this.isReportedAndValid(currentMonthMicrodataViewModel.TotalWorkers) &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.JobOpenings)  &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.LayoffsAndDischarges) &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.NewHires) &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.Quits) &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.TotalSeperation) &&
          !this.isReportedAndValid(currentMonthMicrodataViewModel.OtherSeperation);
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


  // onCollectionsUnitChanged(unit: CollectionsUnit ) {
  //   // emit data to the observable to trigger http call
  //   if (unit != null) {
  //     this.currentSelectedUnit = unit;
  //     this.onCollectionsUnitChangedSubject.next(unit);
  //   }
  // }

  // microgrid toolbar drop down calls this on unit changed
  onCollectionsUnitChanged(unit: CollectionsUnit ) {
    // emit data to the observable to trigger http call
    if (unit != null) {
      // before switching the unit, make sure to set the previous selected unit's processed microdata list to the main backing array
      // we will use this final array viewmodel when save
      if (this.currentSelectedUnit != null) {
        this.collectionUnitListVm.find(a => a.UnitId === this.currentSelectedUnit.UnitId).JoltsMicroData = this.currentSelectedUnit.JoltsMicroData;
      }

      // now swtich to the current user selected unit
      this.currentSelectedUnit = unit;
      console.log('collection service - on collection changed unit: ', unit.UnitId);

      // notifies micro data grid component that unit is changed
      this.getProcessedMicroDataOnUnitSelectionChanged(unit);

      // finally emit the start script for the JOLTS unit
      this.onUnitChangedStartScriptSubject.next(this.getInterviewStartScript());
    }
  }


  getProcessedMicroDataOnUnitSelectionChanged(unit: CollectionsUnit)  {
    // set an empty array
    let microDataRows: CollectionsJoltsMicroData[] = [];



    // check if we have the microdata already
    if (this.currentSelectedUnit != null) {
      if (this.currentSelectedUnit.JoltsMicroData != null && this.currentSelectedUnit.JoltsMicroData.length > 0) {
        // the ces microdata is ready and should be emitted through behavior subject so component can react to it
        this.onCollectionUnitChangedMicroDataSubject.next(this.currentSelectedUnit.JoltsMicroData);

        console.log('starting rollover reminder');
          // also emit data that shows if the case has any rollover reminders
        if (this.rolloverService.isTdeEligible(this.currentSelectedUnit.JoltsMicroData, this.collectionYear, this.collectionMonth)) {
            console.log('tde eligible');
            // emit true or false to show toast - for jolts
            this.onRolloverReminderSubject.next({ title: 'Self-Report Rollover Reminder', reminderMsg: 'The case is eligible for Rollover to Self-Reporting mode.'});
        }

        // emit screening parameter for display
        this.onCollectionUnitChangedScreeningParamsSubject.next(this.currentSelectedUnit.JoltsScreeningParameters);
        return;
      } else { // ces micro data is not avaiable so make an http call to get the microdata for this unit
        // setup the http params
        const params = new HttpParams().set('stateCode', unit.StateCode).set('reptNum', unit.ReportNum);
        this.tcwHttpService.httpGet<CollectionsJoltsMicroDataDto[]>('/api/JoltsMicroData', params)
        .pipe(
          map((result: CollectionsJoltsMicroDataDto[]) => {
              // map microdatadto to view model and calcualte ratios
              microDataRows = this.mapMicroDataDtoToMicroDataViewModel(unit.JoltsScreeningParameters, result, unit.QUIData, unit.AeLdbRC, unit.SizeCode);
              this.currentSelectedUnit.JoltsMicroData = microDataRows;
              // this.currentSelectedUnit.CesMicroDataPayGroups = this.currentSelectedUnitCesMultiPayMicroRowGroups;
              // set the retreived and processed microdata to our unit list cache
              this.collectionUnitListVm.find(a => a.UnitId === unit.UnitId).JoltsMicroData = microDataRows;
              return microDataRows;
          }),
          catchError((err: TcwError) => {
            return throwError(err);
          })
        ).subscribe(data => {
          // emitting this mcirodata rows to components
          this.onCollectionUnitChangedMicroDataSubject.next(data);

          // emit screening parameter for display
          this.onCollectionUnitChangedScreeningParamsSubject.next(this.currentSelectedUnit.JoltsScreeningParameters);

          console.log('starting rollover reminder');
          // also emit data that shows if the case has any rollover reminders
          if (this.rolloverService.isTdeEligible(data, this.collectionYear, this.collectionMonth)) {
            console.log('tde eligible');
            // emit true or false to show toast - for jolts
            this.onRolloverReminderSubject.next({ title: 'Self-Report Rollover Reminder', reminderMsg: 'The case is eligible for Rollover to Self-Reporting mode.'});
          }
        });
        return;
      }

    }
    // return an empty observable to grid component to satisfy RxJs's mapping.
    // What we return here is not improtant per this code.
    this.onCollectionUnitChangedMicroDataSubject.next(microDataRows);
  }


  onReportingRollOverCallComplete() {

  }

  onHistoricalViewToggle(showHistorical) {
    this.onHistoricalViewToggleSubject.next(showHistorical);
  }


  isNumber(value: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
  }



  isReportedAndValid(microDataValue: string | number): boolean {
    return this.joltsMicroRatioService.isValuePositiveOrZero(microDataValue);
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

  getNextPeriod(refYY: number, refMM: number): PreviousPeriod {
    let nextMonth = 0;
    let nextYear = 0;
    try {
        if (refMM !== null && refYY != null) {
          if (refMM === 12) {
              nextMonth = 1;
              nextYear = (refYY + 1);
            } else {
              nextYear = refYY;
              nextMonth = refMM;
              nextMonth = (nextMonth + 1);
          }
        }
      } catch (e) {
        return null;
    }
    // probably need to change the naming for the PreviousPeriod class sicne its now being used to find next month
    const next: PreviousPeriod = { refYY: nextYear, refMM: nextMonth };
    return next;
  }
}
