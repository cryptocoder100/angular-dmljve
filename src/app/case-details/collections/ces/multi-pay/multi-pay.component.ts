import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { CollectionsMutliPayMicroDataGroup, CollectionsCesMultiPayMicroData, CollectionsCesMicroData } from 'src/app/shared/models/collections-microdata.model';
import { MicroDataCellObject, MicroDataStaticData } from '../../models/microdata-cell-object.model';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { CollectionsService } from 'src/app/case-details/services/collections.service';
import { LookupService } from 'src/app/core/services/lookup.service';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import * as moment from 'moment';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';

enum RowActionType {
  ClearAe = 1,
  SetZero,
  CopyAeToPw,
}


@Component({
  selector: 'fsms-tcw-multi-pay',
  templateUrl: './multi-pay.component.html',
  styleUrls: ['./multi-pay.component.css']
})
export class MultiPayComponent implements OnInit, OnDestroy {

errorMessage$: Observable<string>;
multiPayScrollableCols = MicroDataStaticData.multiPayScrollableCols;
transcriptTextStyle  = 'tcw-collection-transcript';
cesMultiPayMicroDataAePwRows: CollectionsCesMicroData[];
rowGroupMetaMultiPayData: any;

// action stream for onfcous
actionSubject = new BehaviorSubject<MicroDataCellObject>(new MicroDataCellObject(''));
focusAction$ = this.actionSubject.asObservable();

// filter and get text from the transscripts array by current cell id on focus
interviewTranscripts: Map<string, string> = this.lookupService.getInterviewScripts(true);
interviewTranscriptText$: Observable<any>;

// by this time cesMicrodata already got the values. Get all error dictionaries
cesInterviewErrorLookupScripts = this.lookupService.getInterviewErrorScripts(true);


// backing variable for observable
cesMultiPayMicroDatabacking: CollectionsMutliPayMicroDataGroup[] = [];

cesMultiPayMicroData$: Observable<CollectionsMutliPayMicroDataGroup[]> = this.collectionService.CollectionMultiPayMicroData$
.pipe(
  map((cesMultiPayData: CollectionsMutliPayMicroDataGroup[]) => {

      console.log('splitting mutlipay rows ' + JSON.stringify(cesMultiPayData));

      // split each microrow to AE and PW rows to match the new design of the grid - UI
      this.cesMultiPayMicroDatabacking = this.mapGroupPayData(cesMultiPayData);

      console.log('splitting mutlipay rows ' + JSON.stringify( this.cesMultiPayMicroDatabacking));
      return this.cesMultiPayMicroDatabacking;
  }),
  catchError((err: TcwError) => {
    return throwError(err);
  })
);


// use rxjs operators to find error codes and interview scripts
errorTranscript$ = this.focusAction$.pipe(
  map((cellValue) =>  {
    console.log('fired error transcripts - ' + JSON.stringify(cellValue));

   // determine the interview error script first
    if (!cellValue.IsRatioCell) {
     if (cellValue.rowType != null) {
       this.interviewTranscriptText$ =  of(this.interviewTranscripts.get(cellValue.cellName).replace('{0}', moment(cellValue.month, 'MM').format('MMMM')));
     }
   }

    if (this.cesMultiPayMicroDatabacking != null) {
      const paygroup = this.cesMultiPayMicroDatabacking.find(a => a.PayGroupIndex === +cellValue.payGroupIndex);
      if (paygroup != null) {
        // user focused on entry cell - show edit errors if any
        if (paygroup.cesMultiPayMicroRows != null && paygroup.cesMultiPayMicroRows.length > 0 && cellValue.rowType != null) {
          const errorList = paygroup.cesMultiPayMicroRows
                                  .find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year && a.RowType === cellValue.rowType).CesInterviewErrorScripts;
          console.log('error list ' + JSON.stringify(errorList));
          if (errorList !=  null && errorList.size > 0) {
              // return errorList.get(cellValue.cellName);
              return this.cesInterviewErrorLookupScripts.get(errorList.get(cellValue.cellName));
            }
        }
      }
    }


    return 'No Errors found.';
  })
);






loppOptions = this.lookupService.getLOPP(true);

  constructor(private collectionService: CollectionsService,
              private lookupService: LookupService,
              public ref: DynamicDialogRef,
              private tcwSaveAllService: TcwSaveAllService) { }


  ngOnDestroy(): void {
    console.log('onDestroy');
    this.cesMultiPayMicroDataAePwRows = null;
  }


  onRowAction(cellValue: MicroDataCellObject, actionType: number) {
    if (this.cesMultiPayMicroDatabacking != null) {
      const paygroup = this.cesMultiPayMicroDatabacking.find(a => a.PayGroupIndex === +cellValue.payGroupIndex);
      if (paygroup != null) {
        // user focused on entry cell - show edit errors if any
        if (paygroup.cesMultiPayMicroRows != null && paygroup.cesMultiPayMicroRows.length > 0 && cellValue.rowType != null) {
          const microDataAeRow = paygroup.cesMultiPayMicroRows
                                  .find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year && a.RowType === 'AE');
          const microDataPwRow = paygroup.cesMultiPayMicroRows
                                  .find(a => a.RefMM === cellValue.month && a.RefYY === cellValue.year && a.RowType === 'PW');
                                  // first get the unit for the list of units that's displayed
          switch (actionType) {
            case RowActionType.ClearAe: {
              // clear rows
              microDataAeRow.TotalWorkers = '';
              microDataAeRow.TotalWomenWorkers = '';
              microDataAeRow.TotalCommisions = '';
              microDataAeRow.TotalWorkerHours = '';
              microDataAeRow.TotalWorkerPayrolls = '';
              break;
            }
            case RowActionType.SetZero: {
              // set zero
              microDataPwRow.TotalNonSupervisoryWokers = 0;
              microDataPwRow.TotalNonSUpervisoryCommisions = 0;
              microDataPwRow.TotalNonSupervisoryWorkerHours = 0;
              microDataPwRow.TotalNonSupervisoryWorkerPayrolls = 0;
              break;
            }
            case RowActionType.CopyAeToPw: {
              microDataPwRow.TotalNonSupervisoryWokers = microDataAeRow.TotalWorkers;
              microDataPwRow.TotalNonSUpervisoryCommisions = microDataAeRow.TotalCommisions;
              microDataPwRow.TotalNonSupervisoryWorkerHours = microDataAeRow.TotalWorkerHours;
              microDataPwRow.TotalNonSupervisoryWorkerPayrolls = microDataAeRow.TotalWorkerPayrolls;
            }
          }

          // re-reun edit checks
          this.runEditCheckErros(cellValue);

        }
      }
    }
  }


  ngOnInit() {
    console.log('init of Mulitpay component');

    // subscribing to onClose of dynamic dialog for multipay
    this.ref.onClose.subscribe((needsNormalizing: boolean) => {
      if (needsNormalizing) {
        // normalize data
        this.collectionService.setNormalizedMultiPayForCollectionMonth();
      }
      // closing
    });
  }

  onFocus(focusValue: MicroDataCellObject) {
    // emit a value to the action stream when onfocus happens
    // console.log(focusValue.cellName + ' ' + focusValue.month);
    this.actionSubject.next(focusValue);
  }





  onCloseNormalizeMultiPay() {
    // set microdata dirty
    this.tcwSaveAllService.setCollectionDataDirty(true);
    // pass true to  normalizing data - on close we do need to normalize data
    this.ref.close(true);
  }



  onDeleteMultiPay() {
    // mark the microdata as not dirty when removing multipay
    this.tcwSaveAllService.setCollectionDataDirty(false);
    this.collectionService.deleteMultiPayroll();
    // pass true to  normalizing data - on close we do NOT need to normalize data
    this.ref.close(false);
  }


  onCancel() {
    // pass false to skip normalizing data - on cancel we do NOT need to normalize data
    this.ref.close(false);
  }


  // method event to fire - on leave of cell when editing microdata values
  runEditCheckErros(cellObject: MicroDataCellObject) {
    const payGroupNumberTouched: number = +cellObject.payGroupIndex;

    try {
      // extract the both AE and PE rows for group pay that was edited
      const currentTouchedAeMicroRow = this.cesMultiPayMicroDatabacking.find(group => group.PayGroupIndex === payGroupNumberTouched)
          .cesMultiPayMicroRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year);

      const currentTouchedPwMicroRow = this.cesMultiPayMicroDatabacking.find(group => group.PayGroupIndex === payGroupNumberTouched)
          .cesMultiPayMicroRows.find(a => a.RefMM === cellObject.month && a.RefYY === cellObject.year && a.RowType === 'PW');


      // merges AE and PW rows together - to start edit check error validation
      currentTouchedAeMicroRow.TotalNonSupervisoryWokers = currentTouchedPwMicroRow.TotalNonSupervisoryWokers;
      currentTouchedAeMicroRow.TotalNonSupervisoryWorkerHours = currentTouchedPwMicroRow.TotalNonSupervisoryWorkerHours;
      currentTouchedAeMicroRow.TotalNonSupervisoryWorkerPayrolls = currentTouchedPwMicroRow.TotalNonSupervisoryWorkerPayrolls;
      currentTouchedAeMicroRow.TotalNonSUpervisoryCommisions = currentTouchedPwMicroRow.TotalNonSUpervisoryCommisions;
      currentTouchedAeMicroRow.TotalNonSupervisoryOvertime = currentTouchedPwMicroRow.TotalNonSupervisoryOvertime;

      console.log(currentTouchedAeMicroRow);

      this.collectionService.processCurrentEditedPayGroupMicroDataRow(currentTouchedAeMicroRow, payGroupNumberTouched, cellObject);

    } catch (error) {
      if (error instanceof ReferenceError || error instanceof TypeError) { // mostly likely scenario here
        // throw easy to debug messages
        throw new Error('ReferenceError in MultipayComponent.runEditCheckErros: Collections Mutlipay HTML grid cell (on edit) did not send expected values to fetch needed MicroRows  ' + error.message);
      } else {
        throw error; // rethrow
      }
    }



      // call the service to process the edit checks/screenings and let service send the data back as observable
      // this.collectionService.processCurrentEditedMicroDataRow(currentEditedMicroRow);
  }

  mapGroupPayData(mutliPayGroupsData: CollectionsMutliPayMicroDataGroup[]) {
    const mutliPayMappedGroupsData: CollectionsMutliPayMicroDataGroup[] = [];

    try {
      mutliPayGroupsData.forEach(group => {
        const g = new CollectionsMutliPayMicroDataGroup(group.PayGroupIndex);
        g.cesMultiPayMicroRows = this.splitMultiPayMicroRows(group.cesMultiPayMicroRows);
        mutliPayMappedGroupsData.push(g);
      });
    } catch (error) {
      throw new Error('Error in MultipayComponent.mapGroupPayData: Error occured splitting each row into AE and PW rows for grid binding  ' + error.message);
    }


    return mutliPayMappedGroupsData;
  }



  // splits each micro row into 2 rows one for AE row and one for PW row so binding to Primeng is possible
  splitMultiPayMicroRows(data: CollectionsCesMicroData[]): CollectionsCesMicroData[] {
    const mappedMicroData: CollectionsCesMicroData[] = [];
    if (data != null) {
        // split each micro entryrow into 2 rows - AE row and PW row - so we can bind to Primeng grid structure for new layout
      data.forEach(eachRow => {
        const aeRow = {...eachRow, RowType: 'AE', MicroDataCellContextError: eachRow.MicroDataCellContextError, CesInterviewErrorScripts: eachRow.CesInterviewErrorScripts};
        const pwRow = {...eachRow, RowType: 'PW', MicroDataCellContextError: eachRow.MicroDataCellContextError, CesInterviewErrorScripts: eachRow.CesInterviewErrorScripts};
        mappedMicroData.push(aeRow);
        mappedMicroData.push(pwRow);
      });
      // once all rows are added - group rows
      this.cesMultiPayMicroDataAePwRows = mappedMicroData;
      this.updateMultiPayRowGroupMetaData();
      console.log('split mulitpay MicroRows - rowgroupmeta'); //+ JSON.stringify(this.rowGroupMetaData));
    }
    // console.log('each groups split rows');
    // console.log(JSON.stringify(this.cesMultiPayMicroDataAePwRows));
    // return this.cesMultiPayMicroDataAePwRows;
    return mappedMicroData;
  }





  // primeng table specific requirement to group AE-PW row of the same month together
  updateMultiPayRowGroupMetaData() {
    this.rowGroupMetaMultiPayData = {};
    if (this.cesMultiPayMicroDataAePwRows) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.cesMultiPayMicroDataAePwRows.length; i++) {
        const rowData = this.cesMultiPayMicroDataAePwRows[i];
        // month column
        const currentMonthYear = rowData.RefMMYY;

        if (i === 0) {
          this.rowGroupMetaMultiPayData[currentMonthYear] = { index: 0, size: 1 };
        } else {
          const previousRowData = this.cesMultiPayMicroDataAePwRows[i - 1];
          const previousMonthYear = previousRowData.RefMMYY;
          if (currentMonthYear === previousMonthYear) {
            this.rowGroupMetaMultiPayData[currentMonthYear].size++;
          } else {
            this.rowGroupMetaMultiPayData[currentMonthYear] = { index: i, size: 1 };
          }
        }
      }
    }
  }



}
