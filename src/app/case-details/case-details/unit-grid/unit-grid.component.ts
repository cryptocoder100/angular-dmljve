import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { Case } from 'src/app/shared/models/case.model';
import { Unit } from 'src/app/shared/models/unit.model';
import { SurveyId } from '../../../shared/models/survey-id.enum';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { Address } from 'src/app/shared/models/address.model';
import * as _ from 'lodash';
// import { aggregateButtonAnimation, aggregateButtonAnimation1 } from '../../../shared/animations/buttonAnimations';
import { AggregrationService } from '../../services/aggregration.service';

enum AggregationSteps {
  None,
  MakeSingleSelectChildren,
  AggregateSelectChildren,
  AggregateSelectParent
}

class GridColumn {
  public field: keyof Unit | keyof Address;
  header: string;
  width: string;
  filterWidth: string;
}

@Component({
  selector: 'fsms-tcw-unit-grid',
  templateUrl: './unit-grid.component.html',
  styleUrls: ['./unit-grid.component.css'],
  // animations: [aggregateButtonAnimation, aggregateButtonAnimation1],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitGridComponent implements OnInit, AfterViewInit, AfterContentChecked {

  @Input() surveyId: string;
  @Input() caseDetails: Case;
  @Input() scrollHeight: { value: string };
  @Input() unitList$: Observable<Unit[]>;
  @Input() rowGroupMetaData: any;
  @Input() showAggregation: { value: boolean };
  @Output() showAggregationChanged = new EventEmitter<boolean>();
  @Output() selectedUnitChanged = new EventEmitter<Unit>();
  @Output() makeUnitsSingle = new EventEmitter<string[]>();
  @Output() aggregateUnits = new EventEmitter<{ parent: string, children: string[] }>();
  selectionMode = 'single';
  disableRowSelection = false;

  selectedUnit: Unit | Unit[] | null;
  unitList: Unit[];
  surveyIds = SurveyId;
  gridCols: GridColumn[];
  aggregationStep: AggregationSteps = AggregationSteps.None;
  aggregationSteps = AggregationSteps;
  aggregationStateCode: string;
  childUnitIdsToAggregate: string[];
  stateCodeToAggregate: string;
  enableSetStatewide: boolean;
  enableShowAggregation: boolean;
  canShowStateWideAggregationDialog = false;
  aggregatableUINList: string[];
  startSetStateWideSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  startSetStateWide$: Observable<boolean> = this.startSetStateWideSubject.asObservable();

  showOnlyActiveUnitsSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  showOnlyActiveUnits$: Observable<boolean> = this.showOnlyActiveUnitsSubject.asObservable();
  // animationState = 'show';
  // animationState1 = 'hide';
  // state = 'inactive';
  hideChildrenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  hideChildren$: Observable<boolean> = this.hideChildrenSubject.asObservable();

  @ViewChild('beginSetStateWide', { read: ElementRef, static: false}) beginSetStateWideElement: ElementRef;

  // observable to show list of UI numbers on statewide dialog
  stateWideUINumbersList$: Observable<string[]> = this.aggregrationService.stateWideAggregatableUINumbers$
    .pipe(
      map(uiList => {
        this.aggregatableUINList = uiList;
        return uiList;
      })
    );
  // array of selected UI Numbers for statewide aggregation
  selectedStateWideUINumbersList: string[] = [];

  constructor(private uiConfigService: UIConfigService,
    private cd: ChangeDetectorRef,
    private aggregrationService: AggregrationService) { }



  ngAfterContentChecked() {
    this.cd.detectChanges();
  }


  ngOnInit() {

    this.setGridCols();

    this.unitList$.pipe(take(1)).subscribe(unitList => {
      this.selectedUnit = unitList[0];
      unitList.forEach(u => console.log(u.isActiveUnit));
      // let the component set the unitList at the service level - to maintain state (unitList is passed as input to this compoennt)
      this.aggregrationService.currentUnitList = unitList;
      this.enableShowAggregation = (this.caseDetails.UNITS_CNT <= 1) ? false : true;
      // check if the set-statewide can be enabled
      const canDoStateWide = this.aggregrationService.canDoStateWideAggregate();
      this.enableSetStatewide = !this.showAggregation.value && this.surveyId === this.surveyIds.C && canDoStateWide;
      // Prasad ProdFix - D-11961 emit an event to update the quidata and location address on teh right panel
      this.selectedUnitChanged.emit(this.selectedUnit as Unit);
    });
  }

  setDialogFocus() {
    this.startSetStateWideSubject.next(true);
  }


  ngAfterViewInit() {
    // Prasad - startSetStatWide is an observable that emits true/false when the
    // dialog shows. We then set the focus on the desired element using @ViewChild
    // property
    this.startSetStateWide$
      .subscribe(onShowSetStateWide => {
          console.log('subscribed');
          if (onShowSetStateWide) {
            const elem = this.beginSetStateWideElement.nativeElement as HTMLElement;
            elem.focus();
          }
        }
      );
    }

    fillUnitGrid(e) {
      this.uiConfigService.zoomAddressEnrollmentUnitGrid(e.checked);
    }

    onShowActiveUnitsChanged(e) {
      this.showOnlyActiveUnitsSubject.next(e.checked);

    }

    onShowChildrenChanged(e){
      this.hideChildrenSubject.next(e.checked);
    }


  isStatewideInComplete() {
    // compare the selected UI number for aggregation with the list of all uinumber needed to be aggr
    if (this.aggregatableUINList != null && this.selectedStateWideUINumbersList != null) {
      if (this.aggregatableUINList.length > 0 && (this.aggregatableUINList.length === this.selectedStateWideUINumbersList.length)) {
        // we have aggrenated all UI numbers that was selected and thats the same number of ui numbers in total we need to do.
        // so set the statewide disabled
        this.uiConfigService.ShowSuccessToast('Statewide aggregation reporting is complete!');
        return false;

      } else {
        this.uiConfigService.ShowInfoToast('Statewide aggregation reporting is partially complete based on UI_Numbers selected.');
        return true; // users did not select all the UI numbers - keep button active.
      }
    }
  }


  // event handler for on cilck on set-statewide button
  onShowStatewideDialog() {
    // call into service to determine a list of aggregratables and emit value as observable
    this.aggregrationService.getAggregatableUnitListForStateWide();
    this.canShowStateWideAggregationDialog = true;
  }

  // event handler for on click aggregateUnits button
  onAggregateStateWideUnits() {
    let returnObject: any;

    try {
      this.selectedStateWideUINumbersList.forEach(uiNumber => {
        // get the parent and children list for statewide aggr
        returnObject = this.aggregrationService.getParentAndChildUnitsByUiNumber(uiNumber);

        // emit @output event to parent component  - address-enrollment (where aggregation ahppens)
        this.aggregateUnits.emit({ parent: returnObject.parentSingleUnitId, children: returnObject.childUnitIdsList });
      });
    } catch (error) {
      this.uiConfigService.SetErrorDialogMessage('Error Ocurred. Please try again by returning to case list and re-opening the case.');
      this.enableSetStatewide = true;
    }

    // close staewide dialog
    this.canShowStateWideAggregationDialog = false;

    // decide if we need to keep set-statewide button active (if user has not completed all the UINumber aggregation)
    this.enableSetStatewide = this.isStatewideInComplete();

    // remove the ones that was alredy aggr
    this.selectedStateWideUINumbersList.forEach(completeUin => {
      const indexToRemove = this.aggregatableUINList.findIndex(u => u === completeUin);
      this.aggregatableUINList.splice(indexToRemove, 1);
    });

    // clear the selected list as well
    this.selectedStateWideUINumbersList = [];
  }


  trackBy(index: number, item: Unit) {
    return item.unitPK;
  }

  onRowSelect(event: any) {
    this.selectedUnitChanged.emit(this.selectedUnit as Unit);
  }

  private setGridCols(): void {
    if (this.surveyId === this.surveyIds.J) {
      this.gridCols = [
        { field: 'DispositionCode', header: 'DC', width: '50px', filterWidth: '35px' },
        { field: 'unitIdJOLTS', header: 'Unit ID', width: '100px', filterWidth: '85px' },
        { field: 'CaseNum', header: 'Case Num', width: '100px', filterWidth: '85px' },
        { field: 'AggregateCode', header: 'Agg', width: '100px', filterWidth: '85px' },
        { field: 'SelectionPanel', header: 'Panel #', width: '100px', filterWidth: '85px' },
        { field: 'NAICS', header: 'NAICS', width: '100px', filterWidth: '85px' },
        { field: 'OwnershipCode', header: 'OWN', width: '100px', filterWidth: '85px' },
        { field: 'ScheduleType', header: 'Form', width: '100px', filterWidth: '85px' },
        { field: 'ESSizeCode', header: 'Size', width: '100px', filterWidth: '85px' },
        { field: 'AnnualAvgEmployees', header: 'Av Ann AE', width: '100px', filterWidth: '85px' },
        { field: 'UiNumber', header: 'UI Number', width: '100px', filterWidth: '85px' },
        { field: 'UIRun', header: 'RUN', width: '100px', filterWidth: '85px' },
        { field: 'EINumber', header: 'EI Number', width: '100px', filterWidth: '85px' },
        { field: 'MetroStatisticalArea', header: 'MSA', width: '100px', filterWidth: '85px' },
        { field: 'CountyCode', header: 'Cnty Cd', width: '100px', filterWidth: '85px' },
        { field: 'CityCode', header: 'City Cd', width: '100px', filterWidth: '85px' },
        { field: 'SampleCode', header: 'Samp Code', width: '100px', filterWidth: '85px' },
        { field: 'SampleWeight', header: 'Samp Wt', width: '100px', filterWidth: '85px' },
        { field: 'SubSampleFlag', header: 'Sub Sample Flag', width: '100px', filterWidth: '85px' },
        { field: 'CMICes', header: 'CMI', width: '50px', filterWidth: '35px' },
        { field: 'MEEI', header: 'MEEI', width: '50px', filterWidth: '35px' },
        { field: 'LiabilityEndDate', header: 'End of Liability Date', width: '100px', filterWidth: '85px' },
        { field: 'PrimaryName', header: 'Company', width: '100px', filterWidth: '85px' },
        { field: 'SecondaryName', header: 'Secondary Name', width: '100px', filterWidth: '85px' },
        { field: 'JoltsLocation', header: 'Location', width: '100px', filterWidth: '85px' },
        { field: 'PrimaryContact', header: 'Contact Name', width: '100px', filterWidth: '85px' },
        { field: 'Address1', header: 'Address', width: '100px', filterWidth: '85px' },
        { field: 'City', header: 'City', width: '100px', filterWidth: '85px' },
        { field: 'State', header: 'State', width: '100px', filterWidth: '85px' },
        { field: 'ZipCode', header: 'Zip', width: '100px', filterWidth: '85px' },
        { field: 'AuxillaryZipCode', header: 'Zip Aux', width: '100px', filterWidth: '85px' },
        { field: 'ZipType', header: 'Zip Type', width: '100px', filterWidth: '85px' },
        { field: 'Phone', header: 'Phone Number', width: '100px', filterWidth: '85px' }
      ];
    } else {
      this.gridCols = [
        { field: 'DispositionCode', header: 'DC', width: '50px', filterWidth: '35px' },
        { field: 'unitIdCES', header: 'Unit ID', width: '100px', filterWidth: '85px' },
        { field: 'ReportWithStateCode', header: 'Report With', width: '100px', filterWidth: '85px' },
        { field: 'ParentChild', header: 'P/C', width: '50px', filterWidth: '35px' },
        { field: 'PanelNum', header: 'Panel#', width: '50px', filterWidth: '35px' },
        { field: 'NAICS', header: 'NAICS', width: '100px', filterWidth: '85px' },
        { field: 'OwnershipCode', header: 'OWN', width: '50px', filterWidth: '35px' },
        { field: 'ScheduleType', header: 'Form', width: '50px', filterWidth: '35px' },
        { field: 'ESSizeCode', header: 'Size', width: '50px', filterWidth: '35px' },
        { field: 'SampleStopDate', header: 'Drop Month', width: '100px', filterWidth: '85px' },
        { field: 'OfferDate', header: 'Offer Date', width: '100px', filterWidth: '85px' },
        { field: 'AnnualAvgEmployees', header: 'Av Ann AE', width: '100px', filterWidth: '85px' },
        { field: 'UiNumber', header: 'UI Number', width: '100px', filterWidth: '85px' },
        { field: 'UIRun', header: 'RUN', width: '100px', filterWidth: '85px' },
        { field: 'EINumber', header: 'EI Number', width: '100px', filterWidth: '85px' },
        { field: 'MetroStatisticalArea', header: 'MSA', width: '60px', filterWidth: '45px' },
        { field: 'CountyCode', header: 'Cnty Cd', width: '60px', filterWidth: '45px' },
        { field: 'CityCode', header: 'City Cd', width: '60px', filterWidth: '45px' },
        { field: 'SubSampleFlag', header: 'Sub Sample Flag', width: '100px', filterWidth: '85px' },
        { field: 'CMICes', header: 'CMI', width: '50px', filterWidth: '35px' },
        { field: 'MEEI', header: 'MEEI', width: '50px', filterWidth: '35px' },
        { field: 'PrimaryName', header: 'Company', width: '100px', filterWidth: '85px' },
        { field: 'SecondaryName', header: 'Secondary Name', width: '100px', filterWidth: '85px' },
        { field: 'Location', header: 'Location', width: '100px', filterWidth: '85px' },
        { field: 'PrimaryContact', header: 'Contact Name', width: '100px', filterWidth: '85px' },
        { field: 'Address1', header: 'Address', width: '100px', filterWidth: '85px' },
        { field: 'City', header: 'City', width: '100px', filterWidth: '85px' },
        { field: 'State', header: 'State', width: '100px', filterWidth: '85px' },
        { field: 'ZipCode', header: 'Zip', width: '100px', filterWidth: '85px' },
        { field: 'AuxillaryZipCode', header: 'Zip Aux', width: '100px', filterWidth: '85px' },
        { field: 'ZipType', header: 'Zip Type', width: '100px', filterWidth: '85px' },
        { field: 'Phone', header: 'Phone Number', width: '100px', filterWidth: '85px' }
      ];
    }
  }

  displayData(col: GridColumn, rowData: Unit) {
    const dataObj: Unit = rowData;
    if (col.field === 'LiabilityEndDate') {
      if (!dataObj[col.field]) {
        return null;
      }
      const pipe = new DatePipe('en-US');
      return pipe.transform(dataObj[col.field], 'MMM dd, yyyy h:mm a');
    } else if (col.field === 'SampleStopDate' || col.field === 'OfferDate') {
      if (!dataObj[col.field]) {
        return null;
      }
      const pipe = new DatePipe('en-US');
      return pipe.transform(dataObj[col.field], 'MM/yyyy');
    } else {
      if (col.field === 'Address1' || col.field === 'City' || col.field === 'State' || col.field === 'ZipCode' || col.field === 'AuxillaryZipCode' || col.field === 'ZipType') {
        if (dataObj.editablePhysicalAddress) {
          return dataObj.editablePhysicalAddress[col.field];
        } else {
          return '';
        }
      } else {
        return dataObj[col.field as keyof Unit];
      }
    }
  }


  onShowAggregation() {
    // this.animationState = 'show';
    // this.animationState1 = 'hide';
    // this.state = 'active';
    this.showAggregationChanged.emit(true);
    this.disableRowSelection = true;
    this.selectedUnit = null;
  }


  onHideAggregation() {
    // this.animationState = 'hide';
    // this.animationState1 = 'show';
    this.showAggregationChanged.emit(false);
    this.selectedUnit = null;
    this.disableRowSelection = false;
    this.selectionMode = 'single';
    this.aggregationStep = AggregationSteps.None;
  }

  onClickAggregateUnits() {
    this.disableRowSelection = false;
    this.selectionMode = 'multiple';
    this.aggregationStep = AggregationSteps.AggregateSelectChildren;
  }

  onClickMakeUnitsSingle() {
    this.disableRowSelection = false;
    this.selectionMode = 'multiple';
    this.aggregationStep = AggregationSteps.MakeSingleSelectChildren;
  }

  onCancelAggregationStep() {
    switch (this.aggregationStep) {
      case AggregationSteps.AggregateSelectParent:
        this.aggregationStep = AggregationSteps.AggregateSelectChildren;
        this.selectedUnit = null;
        this.selectionMode = 'multiple';
        this.disableRowSelection = false;
        break;
      case AggregationSteps.MakeSingleSelectChildren:
      case AggregationSteps.AggregateSelectChildren:
      default:
        this.aggregationStep = AggregationSteps.None;
        this.selectedUnit = null;
        this.selectionMode = 'single';
        this.disableRowSelection = true;
        break;
    }
  }

  onClickSelectChildUnits() {
    const unitList: Unit[] = this.selectedUnit as Unit[];
    if (!unitList || unitList.length < 1) {
      this.uiConfigService.SetErrorDialogMessage('You must select at least 1 Child Unit');
      return;
    }

    switch (this.aggregationStep) {
      case AggregationSteps.MakeSingleSelectChildren:

        let i = 0;
        this.aggregationStateCode = '';
        const unitIdsToMakeSingle: string[] = [];

        while (i < unitList.length) {
          if (unitList[i].ParentChild !== 'C') {
            i = unitList.length;
            this.uiConfigService.SetErrorDialogMessage('Each Child Unit must have P/C = C');
            return;
          }
          unitIdsToMakeSingle.push(unitList[i].unitIdCES);
          i++;
        }

        this.makeUnitsSingle.emit(unitIdsToMakeSingle);
        this.aggregationStep = AggregationSteps.None;
        this.selectedUnit = null;
        this.selectionMode = 'single';
        this.disableRowSelection = true;
        break;
      case AggregationSteps.AggregateSelectChildren:
        let j = 0;
        this.aggregationStateCode = '';
        this.childUnitIdsToAggregate = [];

        while (j < unitList.length) {
          if (!this.aggregationStateCode) {
            this.aggregationStateCode = unitList[j].StateCode;
          } else {
            if (unitList[j].StateCode !== this.aggregationStateCode) {
              j = unitList.length;
              this.aggregationStateCode = '';
              this.uiConfigService.SetErrorDialogMessage('Each Child Unit must have the same State Code');
              return;
            }
          }

          this.childUnitIdsToAggregate.push(unitList[j].unitIdCES);
          j++;
        }

        this.stateCodeToAggregate = unitList[0].StateCode;
        this.aggregationStep = AggregationSteps.AggregateSelectParent;
        this.selectedUnit = null;
        this.selectionMode = 'single';
        this.disableRowSelection = false;
        break;
      default:
        break;
    }
  }

  onClickSelectParentUnit() {
    const selectedUnit: Unit = this.selectedUnit as Unit;
    if (!this.childUnitIdsToAggregate || this.childUnitIdsToAggregate.length < 1) {
      this.uiConfigService.SetErrorDialogMessage('There are no Child Units to aggregate');
      return;
    }

    if (!selectedUnit) {
      this.uiConfigService.SetErrorDialogMessage('You must select a Parent Unit');
      return;
    }

    if (selectedUnit.ParentChild === 'C') {
      this.uiConfigService.SetErrorDialogMessage('Parent Unit must have a P/C of P or S');
      return;
    }

    if (selectedUnit.StateCode !== this.stateCodeToAggregate) {
      this.uiConfigService.SetErrorDialogMessage('Parent State must match Child States');
      return;
    }

    let parentDifferent = true;
    if (this.childUnitIdsToAggregate) {
      this.childUnitIdsToAggregate.forEach(child => {
        if (child === selectedUnit.unitIdCES) {
          parentDifferent = false;
        }
      });
    }

    if (!parentDifferent) {
      this.uiConfigService.SetErrorDialogMessage('Parent Unit must not be the same as any Child Units');
      return;
    }

    this.aggregateUnits.emit({ parent: selectedUnit.unitIdCES, children: this.childUnitIdsToAggregate });
    this.aggregationStep = AggregationSteps.None;
    this.selectedUnit = null;
    this.selectionMode = 'single';
    this.disableRowSelection = true;
  }

}
