import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { Observable, of, from, BehaviorSubject, Subject } from 'rxjs';
import { Unit } from 'src/app/shared/models/unit.model';
import { map, tap } from 'rxjs/operators';
import { CaseDetailsService } from '../../../services/case-details.service';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { CollectionsUnit } from '../../models/collection-unit.model';
import { UnitService } from '../../../services/unit.service';
import { MicrodataService } from '../../../services/microdata.service';
import { CollectionsService } from '../../../services/collections.service';
import {DialogService} from 'primeng/dynamicdialog';
// import { DynamicDialogRef } from 'primeng/dynamicdialog/primeng-dynamicdialog';
import { MultiPayComponent } from '../multi-pay/multi-pay.component';
import { LookupService } from 'src/app/core/services/lookup.service';



@Component({
  selector: 'fsms-tcw-microdata-grid-toolbar',
  templateUrl: './microdata-grid-toolbar.component.html',
  styleUrls: ['./microdata-grid-toolbar.component.css']
})
export class MicrodataGridToolbarComponent implements OnInit, OnDestroy {

  // action streams based on behaviors used setters for model changed events - dropdown
  unitSelectionChangedSubject = new Subject<CollectionsUnit>();
  unitSelectionChanged$ = this.unitSelectionChangedSubject.asObservable();

  unitListToTrackSelectedIndex: CollectionsUnit[] = [];

  // reference to the dialog
  // mulipayDialogRef: DynamicDialogRef;

  // navigation button observable
  nextButtonDisableSubject = new BehaviorSubject<boolean>(true);
  prevButtonDisableSubject = new BehaviorSubject<boolean>(true);
  nextButtonDisable$ = this.nextButtonDisableSubject.asObservable();
  prevButtonDisable$ = this.prevButtonDisableSubject.asObservable();

  // set first unit in the list to be the selected unit for default value.
  // tslint:disable-next-line: variable-name
  _selectedUnit: CollectionsUnit;
  get SelectedUnit(): CollectionsUnit {
    // console.log('dropdown' + JSON.stringify(this._selectedUnit));
    return this._selectedUnit;
  }
  set SelectedUnit(value: CollectionsUnit) {
    console.log('set unit value - subject emitting');
    this._selectedUnit = value;

    // emit value to parent to chage the displayed index
    this.selectedIndex = this.unitListToTrackSelectedIndex.findIndex(a => a.UnitId === value.UnitId);
    this.enableDiableNextPrevButtons();
    this.selectedIndexValueChanged.emit(this.selectedIndex);

    // set the loading spinner for micro grid when unit chagnes
    this.loading.emit(true);

    console.log('set selected unit : ', value.UnitId);
    // local action subject to show location/state/etc.,
    this.unitSelectionChangedSubject.next(value);

    // cross-component action subject to fetch data for micro data and
    // bind the micro to the grid
    this.collectionsService.onCollectionsUnitChanged(value);

  }

  // dropdown item index
  selectedIndex = 0;


  // communicate this to parent
  @Output() selectedIndexValueChanged: EventEmitter<number> =
                                            new EventEmitter<number>();
  @Output() loading: EventEmitter<boolean> =
                                            new EventEmitter<boolean>();


  // observable taht holds the list of units for binding to dropdown
  collectionUnitsVm$: Observable<CollectionsUnit[]> = this.collectionsService.collectionUnitListVmForDropdown$
      .pipe(map(units => {
          console.log('observable getting all units for Dropdown units : ');
          console.log('assinging the first unit to the selected unit' + units[0].UnitId);
          // set the 1st unit as the selected Unit to trigger setters
          this.SelectedUnit = units[0];
          // set the private unitlist to track selected index
          this.unitListToTrackSelectedIndex = units;
           // set enabled next/prev buttons
          if (this.unitListToTrackSelectedIndex.length > 1) {
            this.nextButtonDisableSubject.next(false);
            this.prevButtonDisableSubject.next(true);
          }
          // then return the original list
          return units;
      } ));



  // this value doesn't change after intialized for the life time of this compoent so no need for observable
  IsConvRefEmpty = this.caseDetailsService.IsConRefCodeEmpty();




  constructor(private caseDetailsService: CaseDetailsService,
              private collectionsService: CollectionsService,
              private dialogService: DialogService,
              // public confirmationService: ConfirmationService,
              private uiConfigService: UIConfigService) {
  }


  openMultiPay() {
    // emit observable to disable save/close/cancel button
    this.uiConfigService.setCaseSaveFeaturesReadOnly(true);

    // open the multipay dialog
    const ref = this.dialogService.open(MultiPayComponent, {
      header: `MultiPay for ${this._selectedUnit.UnitId} | ${this._selectedUnit.PrimaryName} | ${this.collectionsService.MultiPayHeaderTextRC}`,
      width: '100%',
      dismissableMask: false,
      closable: false,
    });


    // call into collections service to set values and emit data
    this.collectionsService.emitMultiPay(this._selectedUnit);
  }


  ngOnDestroy(): void {
    // this.collectionsService.onDestroy();
  }



  ngOnInit() {
    console.log('init grid toolbar');
  }


  enableDiableNextPrevButtons() {
    // move forwar
      if (this.selectedIndex > 0) {
        if (this.selectedIndex === this.unitListToTrackSelectedIndex.length - 1) {
          // reached the end of the list
          this.nextButtonDisableSubject.next(true);
          this.prevButtonDisableSubject.next(false);
        }  else {
          // middle of teh list- enable both
          this.nextButtonDisableSubject.next(false);
          this.prevButtonDisableSubject.next(false);
        }
      } else { // go back
        if (this.selectedIndex === 0) {
          // reached the begining of the list
          this.nextButtonDisableSubject.next(false);
          this.prevButtonDisableSubject.next(true);
        } else {
          // middle of teh list- enable both
          this.nextButtonDisableSubject.next(false);
          this.prevButtonDisableSubject.next(false);
        }
      }
  }


  // next button click action
  nextUnit(): void {
    if (this.selectedIndex < this.unitListToTrackSelectedIndex.length) {
      this.selectedIndex++;
      this.SelectedUnit = this.unitListToTrackSelectedIndex[this.selectedIndex];
    }
  }


  // prev bnutton click action
  prevUnit(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.SelectedUnit = this.unitListToTrackSelectedIndex[this.selectedIndex];
    }
  }




  onRollOverButtonClick() {
    this.uiConfigService.ToggleRollOverDialog(true);
  }

}


