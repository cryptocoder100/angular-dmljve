import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';
import { ActivatedRoute, Router, ChildrenOutletContexts } from '@angular/router';
import { Case } from 'src/app/shared/models/case.model';
import { Store, ActionsSubject, Action } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';
import { ofType, Actions } from '@ngrx/effects';
import { take, tap } from 'rxjs/operators';
import { CaseDetailsService } from '../../services/case-details.service';
import { Unit } from 'src/app/shared/models/unit.model';
import { SurveyId } from 'src/app/shared/models/survey-id.enum';
import * as fromCaseList from '../../../case-list/store/caselist.reducer';
import * as CaseListActions from '../../../case-list/store/caselist.actions';
import * as fromAuth from '../../../shared/auth/store/auth.reducer';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Address, AddressType } from 'src/app/shared/models/address.model';
import { QuiMonth } from '../model/quimonth.model';
import { UnitService } from '../../services/unit.service';
import { QuiData } from 'src/app/shared/models/quidata.model';
import { DatePipe } from '@angular/common';
import { TcwConstantsService } from 'src/app/core/services/tcw-constants.service';
import { Constants } from 'src/app/shared/models/constants.model';
import { NaicsCode } from 'src/app/shared/models/naics-code.mode';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { HistoricalInfoService } from '../../services/historical-info.service';
import { StringObject } from 'src/app/shared/models/string-object.model';
import { Notes } from 'src/app/shared/models/notes.model';
import { LookupService } from 'src/app/core/services/lookup.service';
import { TcwSearchService } from 'src/app/core/services/tcw-search.service';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';
import { Status } from 'src/app/shared/models/status.model';
import { ConfirmationService } from 'primeng/api';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';

@Component({
  selector: 'fsms-tcw-address-enrollment',
  templateUrl: './address-enrollment.component.html',
  styleUrls: ['./address-enrollment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressEnrollmentComponent implements OnInit, OnDestroy {
  caseDetails: Case;
  caseDetailsSubject: BehaviorSubject<Case>;
  caseDetails$: Observable<Case>;
  surveyId: string;
  surveyIds = SurveyId;
  unitGridScrollHeight: { value: string };
  unitGridCollapsedHeightAE = '8vh';
  unitGridCollapsedHeightNonAE = '12vh';
  unitGridExpandedHeightAE = '45vh';
  unitGridExpandedHeightNonAE = '50vh';
  unitList: Unit[] = [];
  unitListSubject: BehaviorSubject<Unit[]>;
  unitList$: Observable<Unit[]>;
  selectedUnit: Unit;
  canCompleteAddressRefinement: boolean;
  canCompleteEnrollment: boolean;
  isUnitAddressesOpen = false;
  isQuiDataOpen = false;
  isPrimaryAddressOpen = true;
  unitPhysicalAddress: Address = new Address({ AddressType: AddressType.OriginalPhysicalAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
  unitUiTaxAddress: Address = new Address({ AddressType: AddressType.MOAAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
  unitMoaAddress: Address = new Address({ AddressType: AddressType.UITaxAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
  quiDataHeader: string;
  unitQuiMonths: QuiMonth[] = [new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }),
  new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 })];
  unitQuiAnnAvgAE = 0;
  unitIsNce = false;
  unitUiPhone = '';
  historicalInfo: { contactInfo: string, notesInfo: string } = { contactInfo: '', notesInfo: '' };
  historicalInfoSubject: BehaviorSubject<{ contactInfo: string, notesInfo: string }>;
  historicalInfo$: Observable<{ contactInfo: string, notesInfo: string }>;
  showAggregation: { value: boolean } = { value: false };
  unitRowGroupMetaData: any;
  naicsCodes: NaicsCode[];
  priorityTypes: Status[];
  isHistoricalContactInfoEnabled = false;
  isHistoricalPermanentNotesEnabled = false;
  isHistoricalPublicNotesEnabled = false;
  isCompletingAddressRefinement = false;
  isCompletingEnrollment = false;
  isReadOnlyCase = false;
  viewActive = false;
  currentUser: string;
  caseRefCodeDisabled: { value: boolean } = { value: true };
  dateVerifyUiSubject: BehaviorSubject<Date>;
  dateVerifyUi$: Observable<Date>;

  private saveSuccessSubscription: Subscription;
  private saveFailSubscription: Subscription;
  private scheduleSuccessSubscription: Subscription;
  private notesSuccessSubscription: Subscription;
  storeUserSubscription: Subscription;
  constantsSubscription: Subscription;
  caseListSub: Subscription;
  historicalSub: Subscription;
  startSub: Subscription;


  unitGridZoomed$: Observable<boolean> = this.uiConfigService.addressEnrollmentUnitGridZoomed$;

  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private activatedRoute: ActivatedRoute,
    private tcwSaveAllService: TcwSaveAllService,
    private caseDetailsService: CaseDetailsService,
    private router: Router,
    private store: Store<fromApp.AppState>,
    private unitService: UnitService,
    private tcwConstantsService: TcwConstantsService,
    private historicalInfoService: HistoricalInfoService,
    private actionsSubject$: ActionsSubject,
    private uiConfigService: UIConfigService,
    private tcwLookupService: LookupService,
    private confirmationService: ConfirmationService) {

    this.startSub = this.store.select(fromAuth.getUserEnvironment).pipe(take(1)).subscribe(userEnv => {
      this.currentUser = userEnv.currentUser.userId;
    });
  }

  ngOnInit() {



    this.caseDetails = this.caseDetailsService.getSelectedCaseDetails();
    this.caseDetailsSubject = new BehaviorSubject<Case>(this.caseDetails);
    this.caseDetails$ = this.caseDetailsSubject.asObservable();

    this.dateVerifyUiSubject = new BehaviorSubject<Date>(this.caseDetails.CASE_PERM_NOTE.UI_VERIFIED_DT);
    this.dateVerifyUi$ = this.dateVerifyUiSubject.asObservable();

    this.surveyId = this.caseDetailsService.getSurveyId();
    // this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridCollapsedHeightAE } : { value: this.unitGridCollapsedHeightNonAE };
    this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridExpandedHeightAE } : { value: this.unitGridExpandedHeightNonAE };
    // if (this.caseDetails.UNITS_CNT <= 1) {
    //   this.showAggregation = { value: true }
    // } else {
    //   this.showAggregation = { value: false }
    // }


    if (this.caseDetails.caseLock && this.caseDetails.caseLock.lockedBy) {
      const lockedByUser: string = this.caseDetails.caseLock.lockedBy;

      if (lockedByUser !== this.currentUser) {
        this.isReadOnlyCase = true;
      }
    }

    this.quiDataHeader = this.surveyId === SurveyId.J ? 'EDB' : 'QUI Data';

    this.unitList = this.unitService.getUnitList();
    this.calculateQuiDataAndSizeCodes();

    // Prasad - we set these in onInit because users want to see these accordion open by default
    // Prasad - ProductionFix D-11961 - setting the child component values to display (Location Address accordion)
    this.selectedUnit = this.unitList[0];




    this.updateUnitRowGroupMetaData();
    this.unitListSubject = new BehaviorSubject<Unit[]>(this.unitList);
    this.unitList$ = this.unitListSubject.asObservable();

    this.checkCanCompleteEnrollment();
    this.checkCaseRefusal();

    this.historicalInfo = { contactInfo: '', notesInfo: '' };
    this.historicalInfoSubject = new BehaviorSubject<{ contactInfo: string, notesInfo: string }>(this.historicalInfo);
    this.historicalInfo$ = this.historicalInfoSubject.asObservable();

    this.constantsSubscription = this.tcwConstantsService.getConstants().pipe(take(1)).subscribe((constants: Constants) => {
      this.naicsCodes = constants.NAICSCodes;
      this.priorityTypes = [{ code: '', name: '', description: '' }];
      this.priorityTypes = this.priorityTypes.concat(constants.PriorityTypes);
    }, (err: TcwError) => {
      console.error('Could not get NAICS codes');
    });

    this.storeUserSubscription = this.store.select(fromAuth.getUserEnvironment).pipe(take(1)).subscribe(userEnv => {
      if (userEnv && userEnv.environmentDetails && userEnv.environmentDetails.environmentVariables) {
        const histContactEnvVar = userEnv.environmentDetails.environmentVariables.find(env => env.envGroup === 'HISTORICAL_INFO_GRP' && env.envName === 'HISTORICAL_CONTACT_INFO');
        const histPermNotesEnvVar = userEnv.environmentDetails.environmentVariables.find(env => env.envGroup === 'HISTORICAL_INFO_GRP' && env.envName === 'HISTORICAL_PERMANENT_NOTES');
        const histPublicNotesEnvVar = userEnv.environmentDetails.environmentVariables.find(env => env.envGroup === 'HISTORICAL_INFO_GRP' && env.envName === 'HISTORICAL_PUBLIC_NOTES');

        if (histContactEnvVar) {
          this.isHistoricalContactInfoEnabled = (histContactEnvVar.envValue === 'T');
        }
        if (histPermNotesEnvVar) {
          this.isHistoricalPermanentNotesEnabled = (histPermNotesEnvVar.envValue === 'T');
        }
        if (histPublicNotesEnvVar) {
          this.isHistoricalPublicNotesEnabled = (histPublicNotesEnvVar.envValue === 'T');
        }
      }

    });

    this.saveSuccessSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SAVE_CASES_SUCCESS)).subscribe((action: CaseListActions.SaveCasesSuccess) => {
      this.onSaveSuccess(action.payload.closeOnSuccess);
    });

    this.saveFailSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SAVE_CASES_FAIL)).subscribe((action: CaseListActions.SaveCasesFail) => {
      this.onSaveFail(action.payload);
    });

    this.scheduleSuccessSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SCHEDULE_SELECTED_CASE_SUCCESS)).subscribe((action: CaseListActions.ScheduleSelectedCaseSuccess) => {
      this.onScheduleSuccess(action.payload);
    });

    this.notesSuccessSubscription = this.actionsSubject$.pipe(ofType(CaseListActions.SAVE_NOTES_SUCCESS)).subscribe((action: CaseListActions.SaveNotesSuccess) => {
      this.onNotesSuccess();
    });

    // set the unit grid height
    this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridExpandedHeightAE } : { value: this.unitGridExpandedHeightNonAE };
    this.isQuiDataOpen = true;
    this.isPrimaryAddressOpen = true;
  }

  ngOnDestroy() {
    if (this.historicalSub != null) {
      this.historicalSub.unsubscribe();
    }
    if (this.startSub != null) {
      this.startSub.unsubscribe();
    }
    if (this.constantsSubscription != null) {
      this.constantsSubscription.unsubscribe();
    }

    this.storeUserSubscription.unsubscribe();
    this.saveSuccessSubscription.unsubscribe();
    this.saveFailSubscription.unsubscribe();
    this.scheduleSuccessSubscription.unsubscribe();
    this.notesSuccessSubscription.unsubscribe();
  }

  onSaveSuccess(closeOnSuccess: boolean) {
    this.loadingSubject.next(false);
    this.setNotDirty();
    if (closeOnSuccess) {
      this.returnToCaseList();
    } else {
      if (this.isCompletingAddressRefinement || this.isCompletingEnrollment) {
        this.caseDetailsSubject.next(this.caseDetails);

        if (this.isCompletingEnrollment) {
          this.unitGridScrollHeight = (this.unitGridScrollHeight.value === this.unitGridCollapsedHeightAE) ? { value: this.unitGridCollapsedHeightNonAE } : { value: this.unitGridExpandedHeightNonAE };
          this.caseDetailsService.setHasCollection(true);
        }

        this.isCompletingAddressRefinement = false;
        this.isCompletingEnrollment = false;
      }
    }
  }

  onSaveFail(errorMessage: string) {
    this.loadingSubject.next(false);
    if (this.isCompletingAddressRefinement) {
      this.caseDetails.REPT_MODE = 'A';
      this.caseDetails.TOUCH--;
      this.caseDetailsSubject.next(this.caseDetails);
      this.isCompletingAddressRefinement = false;
    } else if (this.isCompletingEnrollment) {
      this.caseDetails.REPT_MODE = 'E';
      this.caseDetails.TOUCH--;
      this.caseDetailsSubject.next(this.caseDetails);
      this.isCompletingEnrollment = false;
    }
    console.error(errorMessage);
  }

  onScheduleSuccess(scheduleDate: Date) {
    this.caseDetails.SCHED_DATE_TIME = scheduleDate;
    this.caseDetailsSubject.next(this.caseDetails);
  }

  onNotesSuccess() {
    this.dateVerifyUiSubject.next(this.caseDetails.CASE_PERM_NOTE.UI_VERIFIED_DT);
  }

  onPriorityChanged() {
    this.tcwSaveAllService.setCaseDirty();
  }

  onPriorityCompleteClick() {
    if (this.caseDetails.PRIORITY === this.caseDetails.PRIORITY.toUpperCase()) {
      this.caseDetails.PRIORITY = this.caseDetails.PRIORITY.toLowerCase();
    } else {
      if (this.caseDetails.PRIORITY === this.caseDetails.PRIORITY.toLowerCase()) {
        this.caseDetails.PRIORITY = this.caseDetails.PRIORITY.toUpperCase();
      }
    }
    this.onPriorityChanged();
  }

  checkCaseRefusal() {
    let anyRefusal = false;
    let anyGoodDataOrNonRefusal = false;
    let firstRefusalCode = '';
    this.unitList.forEach(un => {
      if (this.tcwLookupService.isRespCodeRefusal(un.DispositionCode)) {
        firstRefusalCode = un.DispositionCode;
        anyRefusal = true;
      } else {
        if (this.tcwLookupService.isRespCodeGoodData(un.DispositionCode) || this.tcwLookupService.isRespCodeNonResponse(un.DispositionCode)) {
          anyGoodDataOrNonRefusal = true;
        }
      }
    });

    const disabled = !(anyRefusal && !anyGoodDataOrNonRefusal);
    if (this.caseRefCodeDisabled.value !== disabled) {
      this.caseRefCodeDisabled = { value: disabled };
    }

    if (disabled && this.caseDetails.REPT_COND === 'C') {
      this.caseDetails.CONV_REF_CODE = '';
      this.caseDetails.FINAL_REF_DATE = null;
      this.caseDetails.REF_CONV_DATE = new Date();
      this.caseDetails.REPT_COND = '';
      if (this.surveyId === 'J') {
        if (this.caseDetails.REPT_MODE !== 'A' && this.caseDetails.REPT_MODE !== 'E') {
          this.caseDetails.REPT_MODE_COND = 'C';
        } else {
          this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE;
        }
        if (this.caseDetails.CMI === '16') {
          this.caseDetails.REPT_MODE_COND += ('-' + 'W');
        }
      } else {
        this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE;
      }

      // this.caseDetailsService.setCaseDirty();
      this.tcwSaveAllService.setCaseDirty();
      this.caseDetailsSubject.next(this.caseDetails);
    }

    if (anyRefusal && !anyGoodDataOrNonRefusal && this.caseDetails.REPT_COND !== 'C') {
      this.caseDetails.CONV_REF_CODE = firstRefusalCode;
      this.caseDetails.INIT_REFUSE_DATE = new Date();
      this.caseDetails.FINAL_REF_DATE = null;
      this.caseDetails.REF_CONV_DATE = null;
      this.caseDetails.REPT_COND = 'C';
      if (this.surveyId === 'J') {
        if (this.caseDetails.REPT_MODE !== 'A' && this.caseDetails.REPT_MODE !== 'E') {
          this.caseDetails.REPT_MODE_COND = 'C';
        } else {
          this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE;
        }
        this.caseDetails.REPT_MODE_COND += ('-' + this.caseDetails.REPT_COND);
      } else {
        this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE + '-' + this.caseDetails.REPT_COND;
      }
      // this.caseDetailsService.setCaseDirty();
      this.tcwSaveAllService.setCaseDirty();
      this.caseDetailsSubject.next(this.caseDetails);
    }
  }

  calculateQuiDataAndSizeCodes() {
    console.log('in calculateQuiDataAndSizeCodes');
    this.unitList.forEach(un => {
      if (un.ParentChild === 'P') {
        if (!un.QUIData) {
          un.QUIData = new QuiData({});
        }
        un.QUIData.AllEmp1 = 0;
        un.QUIData.AllEmp2 = 0;
        un.QUIData.AllEmp3 = 0;
        un.QUIData.AllEmp4 = 0;
        un.QUIData.AllEmp5 = 0;
        un.QUIData.AllEmp6 = 0;
        un.QUIData.AllEmp7 = 0;
        un.QUIData.AllEmp8 = 0;
        un.QUIData.AllEmp9 = 0;
        un.QUIData.AllEmp10 = 0;
        un.QUIData.AllEmp11 = 0;
        un.QUIData.AllEmp12 = 0;
        un.QUIData.Wage1 = 0;
        un.QUIData.Wage2 = 0;
        un.QUIData.Wage3 = 0;
        un.QUIData.Wage4 = 0;
        un.QUIData.AnnualAvgEmployees = 0;

        const childList: Unit[] = this.unitList.filter(child => child.ParentChild === 'C' && child.ReportWithStateCode === un.ReportWithStateCode);
        childList.forEach(child => {
          if (child.QUIData) {
            if (child.QUIData.AllEmp1) { (un.QUIData.AllEmp1 as number) += child.QUIData.AllEmp1 };
            if (child.QUIData.AllEmp2) { (un.QUIData.AllEmp2 as number) += child.QUIData.AllEmp2 };
            if (child.QUIData.AllEmp3) { (un.QUIData.AllEmp3 as number) += child.QUIData.AllEmp3 };
            if (child.QUIData.AllEmp4) { (un.QUIData.AllEmp4 as number) += child.QUIData.AllEmp4 };
            if (child.QUIData.AllEmp5) { (un.QUIData.AllEmp5 as number) += child.QUIData.AllEmp5 };
            if (child.QUIData.AllEmp6) { (un.QUIData.AllEmp6 as number) += child.QUIData.AllEmp6 };
            if (child.QUIData.AllEmp7) { (un.QUIData.AllEmp7 as number) += child.QUIData.AllEmp7 };
            if (child.QUIData.AllEmp8) { (un.QUIData.AllEmp8 as number) += child.QUIData.AllEmp8 };
            if (child.QUIData.AllEmp9) { (un.QUIData.AllEmp9 as number) += child.QUIData.AllEmp9 };
            if (child.QUIData.AllEmp10) { (un.QUIData.AllEmp10 as number) += child.QUIData.AllEmp10 };
            if (child.QUIData.AllEmp11) { (un.QUIData.AllEmp11 as number) += child.QUIData.AllEmp11 };
            if (child.QUIData.AllEmp12) { (un.QUIData.AllEmp12 as number) += child.QUIData.AllEmp12 };
            if (child.QUIData.Wage1) { (un.QUIData.Wage1 as number) += child.QUIData.Wage1 };
            if (child.QUIData.Wage2) { (un.QUIData.Wage2 as number) += child.QUIData.Wage2 };
            if (child.QUIData.Wage3) { (un.QUIData.Wage3 as number) += child.QUIData.Wage3 };
            if (child.QUIData.Wage4) { (un.QUIData.Wage4 as number) += child.QUIData.Wage4 };
            if (child.QUIData.AnnualAvgEmployees) { (un.QUIData.Wage4 as number) += child.QUIData.AnnualAvgEmployees };
          }
        });
      }
    });

    this.unitList.forEach(un => {
      if (un.QUIData && un.QUIData.AnnualAvgEmployees) {
        if (un.QUIData.AnnualAvgEmployees < 5) {
          un.ESSizeCode = '1';
        } else if (un.QUIData.AnnualAvgEmployees < 10) {
          un.ESSizeCode = '2';
        } else if (un.QUIData.AnnualAvgEmployees < 20) {
          un.ESSizeCode = '3';
        } else if (un.QUIData.AnnualAvgEmployees < 50) {
          un.ESSizeCode = '4';
        } else if (un.QUIData.AnnualAvgEmployees < 100) {
          un.ESSizeCode = '5';
        } else if (un.QUIData.AnnualAvgEmployees < 250) {
          un.ESSizeCode = '6';
        } else if (un.QUIData.AnnualAvgEmployees < 500) {
          un.ESSizeCode = '7';
        } else if (un.QUIData.AnnualAvgEmployees < 1000) {
          un.ESSizeCode = '8';
        } else {
          un.ESSizeCode = '9';
        }
      }
    });
  }

  updateUnitRowGroupMetaData() {
    this.unitRowGroupMetaData = {};
    for (let i = 0; i < this.unitList.length; i++) {
      const rowData = this.unitList[i];
      const reptWith = rowData.ReportWithStateCode;
      if (i === 0) {
        this.unitRowGroupMetaData[reptWith] = { index: 0, size: 1 };
      } else {
        const previousRowData = this.unitList[i - 1];
        const previousRowGroup = previousRowData.ReportWithStateCode;
        if (reptWith === previousRowGroup) {
          this.unitRowGroupMetaData[reptWith].size++;
        } else {
          this.unitRowGroupMetaData[reptWith] = { index: i, size: 1 };
        }
      }
    }
  }

  onCanCompleteAddressRefinementChanged(event: boolean) {
    this.canCompleteAddressRefinement = event;
  }

  selectedUnitChanged(event: Unit) {
    if (!event.editablePhysicalAddress) {
      event.editablePhysicalAddress = new Address({ AddressType: AddressType.PrimaryEditableAddress });
    }

    this.selectedUnit = event;
    // calcualte and set QUI-data
    this.calculateQuiMonths();

    // set panels   open
    this.isUnitAddressesOpen = false;
    this.isQuiDataOpen = true;
    this.isPrimaryAddressOpen = true;
  }

  dispCodeChanged(event: string) {
    const unit: Unit | undefined = this.unitList.find(u => u.unitPK === this.selectedUnit.unitPK);
    if (unit) {
      unit.DispositionCode = event;
      if (this.caseDetails.REPT_MODE !== 'A' && this.caseDetails.REPT_MODE !== 'E') {
        unit.ExportFlag = 'T';
      }
      this.setUnitRespCode(unit);
    }

    this.selectedUnit.TimeOfActivityDateTime = new Date();
    this.unitListSubject.next(this.unitList);
    this.checkCanCompleteEnrollment();
    this.checkCaseRefusal();
    this.unitService.setUnitDirty(this.selectedUnit.unitPK);
  }

  dispCodeAssignedAllUnits(event: string) {
    this.unitList.forEach(u => {
      if (u.ParentChild !== 'C') {
        u.DispositionCode = event;
      }
      if (this.caseDetails.REPT_MODE !== 'A' && this.caseDetails.REPT_MODE !== 'E') {
        u.ExportFlag = 'T';
      }
      this.setUnitRespCode(u);
      u.TimeOfActivityDateTime = new Date();
    });
    this.unitListSubject.next(this.unitList);
    this.checkCanCompleteEnrollment();
    this.checkCaseRefusal();
    this.unitService.setAllUnitsDirty();
  }

  setUnitRespCode(unit: Unit) {
    unit.RespCode = this.unitService.calculateUnitRespCode(unit, this.caseDetails.REPT_MODE);
  }

  onUnitDetailsChanged() {
    this.selectedUnit.TimeOfActivityDateTime = new Date();
    if (this.caseDetails.REPT_MODE !== 'A' && this.caseDetails.REPT_MODE !== 'E') {
      this.selectedUnit.ExportFlag = 'T';
    }
    this.selectedUnit.ExportFlag = 'T';
    this.unitListSubject.next(this.unitList);
    this.unitService.setUnitDirty(this.selectedUnit.unitPK);
  }

  onCaseDetailsChanged() {
    // this.caseDetailsService.setCaseDirty();
    this.tcwSaveAllService.setCaseDirty();
  }

  onCaseRefCodeChanged() {
    this.caseDetails.REF_CONV_DATE = null;
    if (this.caseDetails.CONV_REF_CODE) {
      this.caseDetails.INIT_REFUSE_DATE = new Date();
    } else {
      this.caseDetails.FINAL_REF_DATE = new Date();
    }
    this.onCaseDetailsChanged();
  }

  checkCanCompleteEnrollment() {
    if (this.surveyId === SurveyId.J) {
      this.canCompleteEnrollment = (this.unitList.findIndex(u => u.DispositionCode !== '99') === -1);
    } else {
      this.canCompleteEnrollment = (this.unitList.findIndex(u => !u.DispositionCode || u.DispositionCode === '00') === -1);
    }
  }

  onTabClose(event: any) {
    // If case details closed, zoom in on Unit Grid
    if (event.index === 0) {
      // this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridExpandedHeightAE } : { value: this.unitGridExpandedHeightNonAE };
      this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridExpandedHeightAE } : { value: this.unitGridExpandedHeightNonAE };
    }
  }

  onTabOpen(e: any) {
    // If case details opened, zoom out of Unit Grid
    if (e.index === 0) {
      // this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridCollapsedHeightAE } : { value: this.unitGridCollapsedHeightNonAE };
      this.unitGridScrollHeight = (this.caseDetails.REPT_MODE === 'A' || this.caseDetails.REPT_MODE === 'E') ? { value: this.unitGridExpandedHeightAE } : { value: this.unitGridExpandedHeightAE };
    }
  }

  onUnitTabOpen(e: any) {
    switch (e.index) {
      case 0: case 2:
        // Get Unit Addresses
        let addr: Address | undefined = this.selectedUnit.Addresses.find(addr => addr.AddressType === AddressType.OriginalPhysicalAddress);
        if (addr) {
          this.unitPhysicalAddress = addr;
        } else {
          this.unitPhysicalAddress = new Address({ AddressType: AddressType.OriginalPhysicalAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
        }

        addr = this.selectedUnit.Addresses.find(addr => addr.AddressType === AddressType.MOAAddress);
        if (addr) {
          this.unitMoaAddress = addr;
        } else {
          this.unitMoaAddress = new Address({ AddressType: AddressType.OriginalPhysicalAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
        }

        addr = this.selectedUnit.Addresses.find(addr => addr.AddressType === AddressType.UITaxAddress);
        if (addr) {
          this.unitUiTaxAddress = addr;
        } else {
          this.unitUiTaxAddress = new Address({ AddressType: AddressType.UITaxAddress, Address1: '', City: '', State: '', ZipCode: '', AuxillaryZipCode: '', ZipType: '' });
        }
        // Get QUI Data
        this.calculateQuiMonths();
        break;
      case 1:
        // Prasad - Prodfix - D-11961 Get QUI Data
        this.calculateQuiMonths();
        break;
      case 4:
        // Get Historical Info
        this.updateHistoricalInfo();
        break;
      // case 6:
      //   // Get QUI Data
      //   this.calculateQuiMonths();

      //   break;
      default:
        break;
    }
  }

  calculateQuiMonths() {
    if(this.selectedUnit == null) {
      return;
    }
    this.unitUiPhone = this.selectedUnit.Phone;
    this.unitQuiAnnAvgAE = 0;
    this.unitQuiMonths = [new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }),
    new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 }), new QuiMonth({ AllEmp: 0 })];
    this.unitIsNce = false;

    const naicsCode = this.naicsCodes.find(naics => naics.code === this.selectedUnit.NAICS);
    if (naicsCode) {
      this.unitIsNce = naicsCode.isNCE;
    }

    if (this.selectedUnit.QUIData) {
      this.unitQuiAnnAvgAE = 0;
      if (this.selectedUnit.QUIData.AnnualAvgEmployees) {
        this.unitQuiAnnAvgAE = this.selectedUnit.QUIData.AnnualAvgEmployees;
      }

      const refQYear = Number(this.selectedUnit.QUIData.RefQYear);
      const refQtr = Number(this.selectedUnit.QUIData.RefQtr);

      if (!isNaN(refQYear) && !isNaN(refQtr) && refQtr >= 1 && refQtr <= 4) {
        const monthNumber = refQtr * 3;

        const pipe = new DatePipe('en-US');
        const date12: Date = new Date(refQYear, monthNumber - 1);
        const date11: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 1) / 12) - 1), ((((monthNumber - 1) + 12) - 1) % 12 + 1) - 1, 1);
        const date10: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 2) / 12) - 1), ((((monthNumber - 1) + 12) - 2) % 12 + 1) - 1, 1);
        const date9: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 3) / 12) - 1), ((((monthNumber - 1) + 12) - 3) % 12 + 1) - 1, 1);
        const date8: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 4) / 12) - 1), ((((monthNumber - 1) + 12) - 4) % 12 + 1) - 1, 1);
        const date7: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 5) / 12) - 1), ((((monthNumber - 1) + 12) - 5) % 12 + 1) - 1, 1);
        const date6: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 6) / 12) - 1), ((((monthNumber - 1) + 12) - 6) % 12 + 1) - 1, 1);
        const date5: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 7) / 12) - 1), ((((monthNumber - 1) + 12) - 7) % 12 + 1) - 1, 1);
        const date4: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 8) / 12) - 1), ((((monthNumber - 1) + 12) - 8) % 12 + 1) - 1, 1);
        const date3: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 9) / 12) - 1), ((((monthNumber - 1) + 12) - 9) % 12 + 1) - 1, 1);
        const date2: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 10) / 12) - 1), ((((monthNumber - 1) + 12) - 10) % 12 + 1) - 1, 1);
        const date1: Date = new Date(refQYear + (Math.floor((((monthNumber - 1) + 12) - 11) / 12) - 1), ((((monthNumber - 1) + 12) - 11) % 12 + 1) - 1, 1);

        let quiMonths: QuiMonth[] = [];
        quiMonths = [];

        if (this.surveyId === SurveyId.J) {
          if (refQtr === 1) {
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date12, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp3, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp3_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date11, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp2, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp2_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date10, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp1, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp1_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date9, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp12, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp12_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date8, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp11, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp11_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date7, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp10, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp10_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date6, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp9, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp9_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date5, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp8, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp8_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date4, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp7, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp7_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date3, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp6, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp6_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date2, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp5, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp5_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date1, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp4, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp4_Imp }));
          } else if (refQtr === 2) {
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date12, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp6, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp6_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date11, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp5, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp5_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date10, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp4, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp4_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date9, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp3, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp3_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date8, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp2, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp2_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date7, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp1, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp1_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date6, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp12, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp12_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date5, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp11, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp11_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date4, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp10, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp10_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date3, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp9, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp9_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date2, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp8, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp8_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date1, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp7, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp7_Imp }));
          } else if (refQtr === 3) {
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date12, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp9, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp9_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date11, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp8, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp8_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date10, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp7, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp7_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date9, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp6, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp6_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date8, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp5, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp5_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date7, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp4, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp4_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date6, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp3, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp3_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date5, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp2, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp2_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date4, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp1, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp1_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date3, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp12, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp12_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date2, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp11, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp11_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date1, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp10, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp10_Imp }));
          } else {
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date12, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp12, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp12_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date11, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp11, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp11_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date10, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp10, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp10_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date9, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp9, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp9_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date8, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp8, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp8_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date7, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp7, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp7_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date6, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp6, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp6_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date5, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp5, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp5_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date4, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp4, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp4_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date3, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp3, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp3_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date2, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp2, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp2_Imp }));
            quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date1, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp1, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp1_Imp }));
          }

        } else {
          quiMonths.push(new QuiMonth({
            MonthAndYear: pipe.transform(date12, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp12, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp12_Imp,
            Wage: this.selectedUnit.QUIData.Wage4, Wage_Imp: this.selectedUnit.QUIData.Wage4_Imp, Comment: this.selectedUnit.QUIData.Comment4_LDB
          }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date11, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp11, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp11_Imp }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date10, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp10, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp10_Imp }));
          quiMonths.push(new QuiMonth({
            MonthAndYear: pipe.transform(date9, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp9, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp9_Imp,
            Wage: this.selectedUnit.QUIData.Wage3, Wage_Imp: this.selectedUnit.QUIData.Wage3_Imp, Comment: this.selectedUnit.QUIData.Comment3_LDB
          }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date8, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp8, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp8_Imp }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date7, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp7, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp7_Imp }));
          quiMonths.push(new QuiMonth({
            MonthAndYear: pipe.transform(date6, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp6, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp6_Imp,
            Wage: this.selectedUnit.QUIData.Wage2, Wage_Imp: this.selectedUnit.QUIData.Wage2_Imp, Comment: this.selectedUnit.QUIData.Comment2_LDB
          }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date5, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp5, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp5_Imp }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date4, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp4, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp4_Imp }));
          quiMonths.push(new QuiMonth({
            MonthAndYear: pipe.transform(date3, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp3, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp3_Imp,
            Wage: this.selectedUnit.QUIData.Wage1, Wage_Imp: this.selectedUnit.QUIData.Wage1_Imp, Comment: this.selectedUnit.QUIData.Comment1_LDB
          }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date2, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp2, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp2_Imp }));
          quiMonths.push(new QuiMonth({ MonthAndYear: pipe.transform(date1, 'MMM yyyy') as string, AllEmp: this.selectedUnit.QUIData.AllEmp1, AllEmp_Imp: this.selectedUnit.QUIData.AllEmp1_Imp }));
        }

        this.unitQuiMonths = quiMonths;
      }


    }
  }

  onShowAggregationChanged(event: boolean) {
    this.showAggregation = { value: event };

    this.unitList.sort((a, b) => a.DispositionCode > b.DispositionCode ? -1 : 1).sort((a, b) => a.ReportWithStateCode < b.ReportWithStateCode ? -1 : 1);
    this.updateUnitRowGroupMetaData();
    this.unitListSubject.next(this.unitList);
  }

  // Validation done in the Unit Grid page.  Assumed at this point that the list of Unit IDs is appropriate
  onMakeUnitsSingle(event: string[]) {
    event.forEach(unitIdCes => {
      const singleUnit: Unit | undefined = this.unitList.find(un => un.unitIdCES === unitIdCes);
      if (singleUnit) {
        const parentUnit: Unit | undefined = this.unitList.find(un => un.unitIdCES === singleUnit.ReportWithStateCode);
        if (parentUnit) {
          singleUnit.DispositionCode = parentUnit.DispositionCode;
        } else {
          singleUnit.DispositionCode = '99';
        }

        singleUnit.ParentChild = 'S';
        singleUnit.ReportWithStateCode = singleUnit.unitIdCES;
      }
    });

    const oldActiveUnitsCount: number = this.caseDetails.ACTIVE_UNITS_COUNT;
    let activeUnitsCount = 0;
    this.unitList.forEach(un => {
      if (un.ParentChild !== 'C') {
        if (un.DispositionCode === '00' || un.DispositionCode === '99') {
          activeUnitsCount++;
        }
        if (un.ParentChild === 'P') {
          if (this.unitList.findIndex(un2 => un2.ReportWithStateCode === un.unitPK && un2.unitPK !== un.unitPK) === -1) {
            un.ParentChild = 'S';
          }
        }
      }
    });

    if (activeUnitsCount !== oldActiveUnitsCount) {
      this.caseDetails.ACTIVE_UNITS_COUNT = activeUnitsCount;
      this.caseDetailsSubject.next(this.caseDetails);
      // this.caseDetailsService.setCaseDirty();
      this.tcwSaveAllService.setCaseDirty();
    }

    this.unitList.sort((a, b) => a.DispositionCode > b.DispositionCode ? -1 : 1).sort((a, b) => a.ReportWithStateCode < b.ReportWithStateCode ? -1 : 1);
    this.calculateQuiDataAndSizeCodes();
    this.updateUnitRowGroupMetaData();
    this.unitListSubject.next(this.unitList);
    this.unitService.setAllUnitsDirty();
  }

  // Validation done in the Unit Grid page.  Assumed at this point that the parameters are appropriate
  onAggregateUnits(event: { parent: string, children: string[] }) {
    const parentUnit: Unit | undefined = this.unitList.find(un => un.unitIdCES === event.parent);
    if (parentUnit) {
      parentUnit.ParentChild = 'P';
      parentUnit.DispositionCode = '99';
    }

    console.log('in  enrollment' + 'parent' + parent);

    event.children.forEach(child => {
      console.log('in  enrollment' + 'each child' + child);
      const childUnit: Unit | undefined = this.unitList.find(un => un.unitIdCES === child);
      if (childUnit) {
        if (childUnit.ParentChild === 'P') {
          this.unitList.forEach(un2 => {
            if (un2.ReportWithStateCode === childUnit.unitIdCES && un2.ParentChild === 'C') {
              un2.ReportWithStateCode = event.parent;
            }
          });
        }
        childUnit.ReportWithStateCode = event.parent;
        childUnit.ParentChild = 'C';
        childUnit.DispositionCode = '74';
      }
    });

    console.log('done looping through chhild');



    const oldActiveUnitsCount: number = this.caseDetails.ACTIVE_UNITS_COUNT;
    let activeUnitsCount = 0;
    this.unitList.forEach(un => {
      if (un.DispositionCode === '00' || un.DispositionCode === '99') {
        activeUnitsCount++;
      }
    });

    if (activeUnitsCount !== oldActiveUnitsCount) {
      this.caseDetails.ACTIVE_UNITS_COUNT = activeUnitsCount;
      this.caseDetailsSubject.next(this.caseDetails);
      // this.caseDetailsService.setCaseDirty();
      console.log('count chagned -s set case ');
      this.tcwSaveAllService.setCaseDirty();
    }


    this.unitList.sort((a, b) => a.DispositionCode > b.DispositionCode ? -1 : 1).sort((a, b) => a.ReportWithStateCode < b.ReportWithStateCode ? -1 : 1);
    this.calculateQuiDataAndSizeCodes();

    this.updateUnitRowGroupMetaData();
    this.unitListSubject.next(this.unitList);
    this.unitService.setAllUnitsDirty();
    console.log('all done end of enrollment with units change ');
  }

  doAddressEnrollmentSave(closeOnSuccess: boolean, isCompleteAddressRefinement: boolean, isCompleteEnrollment: boolean) {
    const unitsToSave: Unit[] = [];
    this.unitList.forEach(un => {
      if (this.unitService.dirtyUnitPKs.findIndex(pk => un.unitPK === pk) !== -1) {
        unitsToSave.push(new Unit(un));
      }
    });

    this.loadingSubject.next(true);
    this.store.dispatch(new CaseListActions.SaveCases({ casesToSave: [new Case(this.caseDetails)], unitsToSave, microdataToSave: [], auditCaseNum: this.caseDetails.CASE_NUM, closeOnSuccess, isCompleteAddressRefinement, isCompleteEnrollment, isNrpComplete: false, currentSelectedUnitId: null }));

  }

  completeAddressRefinement(closeOnSuccess: boolean) {
    this.confirmationService.confirm({
      message: `Are you sure you want to complete Address Refinement for this case?`,
      header: 'Confirmation Needed',
      icon: 'pi pi-question-circle',
      accept: () => {
        this.caseDetails.REPT_MODE = 'E';
        if (this.caseDetails.REPT_COND) {
          this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE + '-' + this.caseDetails.REPT_MODE_COND;
        } else {
          this.caseDetails.REPT_MODE_COND = this.caseDetails.REPT_MODE;
        }

        const oldActiveUnitsCount: number = this.caseDetails.ACTIVE_UNITS_COUNT;
        let activeUnitsCount = 0;
        this.unitList.forEach(un => {
          if (un.DispositionCode === '00' || un.DispositionCode === '99') {
            activeUnitsCount++;
          }

          let isUnitChanged = false;

          const oldRespCode = un.RespCode;
          this.setUnitRespCode(un);
          if (un.RespCode !== oldRespCode) {
            isUnitChanged = true;
          }

          if (un.INT_AR !== this.currentUser) {
            un.INT_AR = this.currentUser;
            isUnitChanged = true;
          }
          if (un.INT_DATA !== this.currentUser) {
            un.INT_DATA = this.currentUser;
            isUnitChanged = true;
          }

          if (isUnitChanged) {
            un.TimeOfActivityDateTime = new Date();
            this.unitService.setUnitDirty(un.unitPK);
          }
        });

        this.caseDetails.ACTIVE_UNITS_COUNT = activeUnitsCount;
        if (activeUnitsCount > 1) {
          this.caseDetails.MULTI_FLAG = 'T';
        } else {
          this.caseDetails.MULTI_FLAG = 'F';
        }

        this.caseDetails.RESP_CODE = this.caseDetailsService.calculateCaseRespCode(this.unitList.map(un => un.RespCode));
        this.caseDetails.INT = this.currentUser;
        this.caseDetails.DATE_TIME = new Date();
        this.caseDetails.TOUCH++;

        this.onCaseDetailsChanged();
        this.unitListSubject.next(this.unitList);

        this.isCompletingAddressRefinement = true;
        this.doAddressEnrollmentSave(closeOnSuccess, true, false);

      }
    });

  }

  completeEnrollment(closeOnSuccess: boolean) {
    this.caseDetails.REPT_MODE = 'C';
    this.caseDetails.REPT_MODE_COND = 'C';
    this.caseDetails.REPT_COND = '';

    const oldActiveUnitsCount: number = this.caseDetails.ACTIVE_UNITS_COUNT;
    let activeUnitsCount = 0;

    this.unitList.forEach(un => {
      if (un.DispositionCode === '00' || un.DispositionCode === '99') {
        activeUnitsCount++;
      }

      un.EnrollmentDispCode = un.DispositionCode;
      un.ExportFlag = 'T';

      let isUnitChanged = false;

      const oldRespCode = un.RespCode;
      this.setUnitRespCode(un);
      if (un.RespCode !== oldRespCode) {
        isUnitChanged = true;
      }

      if (un.INT_SOL !== this.currentUser) {
        un.INT_SOL = this.currentUser;
        isUnitChanged = true;
      }
      if (un.INT_DATA !== this.currentUser) {
        un.INT_DATA = this.currentUser;
        isUnitChanged = true;
      }
      if (this.surveyId === 'J' && un.RespCode !== '18') {
        un.RespCode = '18';
        isUnitChanged = true;
      }

      if (isUnitChanged) {
        un.TimeOfActivityDateTime = new Date();
        this.unitService.setUnitDirty(un.unitPK);
      }
    });

    this.caseDetails.ACTIVE_UNITS_COUNT = activeUnitsCount;
    if (activeUnitsCount > 1) {
      this.caseDetails.MULTI_FLAG = 'T';
    } else {
      this.caseDetails.MULTI_FLAG = 'F';
    }

    this.caseDetails.RESP_CODE = this.caseDetailsService.calculateCaseRespCode(this.unitList.map(un => un.RespCode));
    this.caseDetails.INT = this.currentUser;
    this.caseDetails.DATE_TIME = new Date();
    this.caseDetails.TOUCH++;

    this.onCaseDetailsChanged();
    this.unitListSubject.next(this.unitList);

    this.isCompletingEnrollment = true;
    this.doAddressEnrollmentSave(closeOnSuccess, false, true);
  }

  updateHistoricalInfo() {
    this.historicalInfo = { contactInfo: '', notesInfo: '' };

    if (!this.isHistoricalContactInfoEnabled) {
      this.historicalInfo = { contactInfo: 'Historical Contacts are disabled.', notesInfo: '' };
    } else {
      this.historicalInfo = { contactInfo: 'Loading...', notesInfo: '' };
      this.historicalSub = this.historicalInfoService.getHistoricalContactInfo(this.caseDetails.CASE_NUM).subscribe((data: StringObject) => {
        this.historicalInfo = { contactInfo: data.stringData, notesInfo: '' };
        this.historicalInfoSubject.next(this.historicalInfo);
      }, (error: TcwError) => {
        this.historicalInfo = { contactInfo: 'Error getting historical contact info.', notesInfo: '' };
        this.historicalInfoSubject.next(this.historicalInfo);
      });
    }

    if (!this.isHistoricalPublicNotesEnabled && !this.isHistoricalPermanentNotesEnabled) {
      this.historicalInfo = { contactInfo: this.historicalInfo.contactInfo, notesInfo: 'Historical Case Notes are disabled.\n\nHistorical Permanent Notes are disabled.' };
      this.historicalInfoSubject.next(this.historicalInfo);
    } else {
      this.historicalInfo = { contactInfo: this.historicalInfo.contactInfo, notesInfo: 'Loading...' };
      this.historicalInfoSubject.next(this.historicalInfo);
      let histNotesInfo = 'Case Notes:\n';

      if (!this.isHistoricalPublicNotesEnabled) {
        histNotesInfo = 'Historical Case Notes are disabled.';
      }

      this.historicalInfoService.getHistoricalNotes(this.caseDetails.CASE_NUM, this.isHistoricalPublicNotesEnabled, this.isHistoricalPermanentNotesEnabled).subscribe((savedNotes: Notes[]) => {
        let isPermanentNote = false;
        if (savedNotes) {
          savedNotes.forEach(sn => {
            if (!isPermanentNote && sn.IS_PUBLIC === 2) {
              histNotesInfo += '\n\nPermanent Note:\n';
              isPermanentNote = true;
            }
            histNotesInfo += (sn.NOTE + '\n');
          });
        }

        if (!isPermanentNote) {
          histNotesInfo += '\n\nPermanent Note:\n';
        }

        if (!this.isHistoricalPermanentNotesEnabled) {
          histNotesInfo += 'Historical Permanent Notes are disabled.';
        }

        this.historicalInfo = { contactInfo: this.historicalInfo.contactInfo, notesInfo: histNotesInfo };
        this.historicalInfoSubject.next(this.historicalInfo);
      }, (error: TcwError) => {
        this.historicalInfo = { contactInfo: this.historicalInfo.contactInfo, notesInfo: 'Error getting historical notes.' };
        this.historicalInfoSubject.next(this.historicalInfo);
      });
    }

  }

  setNotDirty() {
    // this.caseDetailsService.setCaseNotDirty();
    this.tcwSaveAllService.setCaseNotDirty();
    this.unitService.setAllUnitsNotDirty();
  }

  returnToCaseList(): void {
    let currentCaseListUser = '';
    this.caseListSub = this.store.select(fromCaseList.getCaseListState).pipe(take(1)).subscribe(caseListState => {
      currentCaseListUser = caseListState.userId;

    });
    this.router.navigate(['/case-list', currentCaseListUser]);
  }
}
