import { Injectable } from '@angular/core';
// import { isNumeric } from 'rxjs/util/isNumeric';
import bankersRounding from 'bankers-rounding';
import { CollectionsCesMicroData, MicroDataCellContextError } from 'src/app/shared/models/collections-microdata.model';
import { MicroDataCellObject } from '../collection/models/microdata-cell-object.model';


// Prasad - 06/09/2020 - Use this service for only multipay related business logic
@Injectable({
  providedIn: 'root'
})
export class MultiPayService {

  // maintain state for pertaining to paygroups data
  multiPayMicroDataGroup1: CollectionsCesMicroData = null;
  multiPayMicroDataGroup2: CollectionsCesMicroData = null;
  prLpGroup1: number;
  prLpGroup2: number;


  constructor() { }



/*----------NOrmalize -----------------------------------------------------------------------------------------------------*/

  // note: before we can call this method from collectionservice, we set the multiPayMicroDataGroup1 multiPayMicroDataGroup2 class variables, so we only
  // need to pass the target microdata row to which our final normalized data will be set to.
  normalizePayGroupMicroData(collectionMonthMicrodataViewModel: CollectionsCesMicroData) {
    if (this.multiPayMicroDataGroup1 == null || this.multiPayMicroDataGroup2 == null) {
      return;
    }

     // business logic - need to calcualte LpFactor for group1
    this.prLpGroup1 = this.computeLpFactor(+this.multiPayMicroDataGroup1.RefMM, +this.multiPayMicroDataGroup1.RefYY, +this.multiPayMicroDataGroup1.PayFrequency.code);
    this.prLpGroup2 = this.computeLpFactor(+this.multiPayMicroDataGroup2.RefMM, +this.multiPayMicroDataGroup2.RefYY, +this.multiPayMicroDataGroup2.PayFrequency.code);

    // start cell calculation - first calculate high order cell values - AE/PW/WW
    collectionMonthMicrodataViewModel.TotalWorkers = this.computeAeOrPwOrWw(+this.multiPayMicroDataGroup1.TotalWorkers, +this.multiPayMicroDataGroup2.TotalWorkers);
    collectionMonthMicrodataViewModel.TotalNonSupervisoryWokers = this.computeAeOrPwOrWw(+this.multiPayMicroDataGroup1.TotalNonSupervisoryWokers, +this.multiPayMicroDataGroup2.TotalNonSupervisoryWokers);
    collectionMonthMicrodataViewModel.TotalWomenWorkers = this.computeAeOrPwOrWw(+this.multiPayMicroDataGroup1.TotalWomenWorkers, +this.multiPayMicroDataGroup2.TotalWomenWorkers);

     // then start with the lower order cells - these lower order values are calculated ONLY when there is a valid PRLP and CMLP values
     // for better performance - if-else-if arranged bit differently (nested) - go from more likely scenario to least likely scneario
    if (this.prLpGroup1 > 0) { // only when both are > 0 do real calc
      if (this.prLpGroup2 > 0) {
        collectionMonthMicrodataViewModel.TotalWorkerPayrolls = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalWorkerPayrolls,
                                                                                    +this.multiPayMicroDataGroup2.TotalWorkerPayrolls);
        collectionMonthMicrodataViewModel.TotalWorkerHours = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalWorkerHours,
                                                                                      +this.multiPayMicroDataGroup2.TotalWorkerHours);
        collectionMonthMicrodataViewModel.TotalCommisions = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalCommisions,
                                                                                        +this.multiPayMicroDataGroup2.TotalCommisions);
        collectionMonthMicrodataViewModel.TotalNonSupervisoryWorkerHours = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalNonSupervisoryWorkerHours,
                                                                                          +this.multiPayMicroDataGroup2.TotalNonSupervisoryWorkerHours);
        collectionMonthMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalNonSupervisoryWorkerPayrolls,
                                                                                            +this.multiPayMicroDataGroup2.TotalNonSupervisoryWorkerPayrolls);
        collectionMonthMicrodataViewModel.TotalNonSUpervisoryCommisions = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalNonSUpervisoryCommisions,
                                                                                              +this.multiPayMicroDataGroup2.TotalNonSUpervisoryCommisions);
        collectionMonthMicrodataViewModel.TotalOvertime = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalOvertime,
                                                                                                +this.multiPayMicroDataGroup2.TotalOvertime);
        collectionMonthMicrodataViewModel.TotalNonSupervisoryOvertime = this.computeAwPwBy(+this.multiPayMicroDataGroup1.TotalNonSupervisoryOvertime,
                                                                                                  +this.multiPayMicroDataGroup2.TotalNonSupervisoryOvertime);

      }
    }
    // finally set any errors if any when closing multipay
    this.combinePayGroupCheckErrors(collectionMonthMicrodataViewModel); // pass by ref default
    return collectionMonthMicrodataViewModel;
  }

  computeAeOrPwOrWw(paygroup1Value: number, paygroup2Value: number) {
    const result = +paygroup1Value + +paygroup2Value;
    if (this.isNumber(result)) {
      return result;
    } else {
        return null;
    }
  }

  computeAwPwBy(paygroup1Value: number, paygroup2Value: number) {

    // for better performance - more likely scenario to least likely scneario
    // we know both in DB and in UI data entry - we NEVER allow alphabets or special cahrs for microdata values, hence this code will always return some number
    // or 0 even in worst case scenario - so no need to check if its anumber or greater than 0 etc., and avoid using unneccessary conditional statements.
    // helps improve perf if we can avoid multiple conditinal statements

   // old code above (function computeAEPR()) is same as the code below. Think about it!!!!
   // because multiplying null * (any number) = 0, then if one of the paygrp1 is null then its value is ignored when adding together vice versa.
    // and since we already checked prlp values before we got here, we need only worry about ae-pr values on either paygroups

    try { // go ahead and try the most likely scenario if that throws ex then try other scnerios - avoiding if else if else to gain perf
      const value = bankersRounding((+paygroup1Value * this.prLpGroup1) + (+paygroup2Value * this.prLpGroup2) , 0);
      return value === 0 ? null : value; // just because we don't want to show zeros in the grid cells
    } catch (e) {
      return null;
    }
  }

  // when closing multipay - sets the edit check errors that was not satisified before closing from either paygroyps
  combinePayGroupCheckErrors(collectionMonthMicrodataViewModel: CollectionsCesMicroData) {
    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalWorkersMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalWorkersMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalWomenWorkersMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalWomenWorkersMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalWorkerPayrollsMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalWorkerPayrollsMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalWorkerHoursMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalWorkerHoursMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalOvertimeMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalOvertimeMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalOvertimeMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalCommisionsMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalCommisionsMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing;

    collectionMonthMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = this.multiPayMicroDataGroup1.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing ||
                                                                                        this.multiPayMicroDataGroup2.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing;
  }

/*-------------------------------End Normalize---------------------------------------------------------------------------*/





/*----------Edit check errors---------------------------------------------------------------------------------------------*/

  setEditScreenMultiPayErrors(siblingMonthlyMicrodataViewModel: CollectionsCesMicroData, parentMonthlyMicrodataViewModel: CollectionsCesMicroData,
                              editedCellObject: MicroDataCellObject) {
    if (siblingMonthlyMicrodataViewModel != null && parentMonthlyMicrodataViewModel != null) {
      // retain previous validation error
      siblingMonthlyMicrodataViewModel.MicroDataCellContextError = siblingMonthlyMicrodataViewModel.MicroDataCellContextError;
      siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts = siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts;

      // run AE row validatins
      // run a precheck on AE to make sure both paygroups have AE reported
      this.totalWorkersPreCheck(parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
      // now, only after AE is all cleared, we start the comparison of the parent/ sibling for PR, HR , CM and OT
      if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing &&
        !siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing) {
          // AE-PR
          this.compareParentSiblingByCellName('AE-PR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
          // AE-HR
          this.compareParentSiblingByCellName('AE-HR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
          // AE-CM
          this.compareParentSiblingByCellName('AE-CM', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
          // AE-WW
          this.compareParentSiblingByCellName('WW', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
        }


        // run PW row validations
        // run a precheck on AE to make sure both paygroups have AE reported
      this.totalNonSupervisoryWokersPreCheck(parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
      // now, only after AE is all cleared, we start the comparison of the parent/ sibling for PR, HR , CM and OT
      if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing &&
          !siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing) {
            // AE-PR
            this.compareParentSiblingByCellName('PW-PR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
            // AE-HR
            this.compareParentSiblingByCellName('PW-HR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
            // AE-CM
            this.compareParentSiblingByCellName('PW-CM', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
         }
    }
  }

  totalWorkersPreCheck(parentMonthlyMicrodataViewModel: CollectionsCesMicroData, siblingMonthlyMicrodataViewModel: CollectionsCesMicroData) {
    // check if parent or sibling AE missing
    if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalWorkers) &&
    this.isEmptyOrNotReported(siblingMonthlyMicrodataViewModel.TotalWorkers)) {
      return;
    }


    // check if parent or sibling AE missing
    if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalWorkers) ||
    this.isEmptyOrNotReported(siblingMonthlyMicrodataViewModel.TotalWorkers)) {
      // then check if parent AE already has some errors
      if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalWorkers)) {
        // if no errors, then we can set a new error of mutlipay error - becausemultipay error cannot override the original edit check erros
        if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing) {
          parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E32');
        }
      } else { // parent is all good its the sibling that's missing
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
        siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E32');
      }
     }
  }

  totalNonSupervisoryWokersPreCheck(parentMonthlyMicrodataViewModel: CollectionsCesMicroData, siblingMonthlyMicrodataViewModel: CollectionsCesMicroData) {
    if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
        this.isEmptyOrNotReported(siblingMonthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
          return;
        }

    // check if parent or sibling AE missing
    if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalNonSupervisoryWokers) ||
        this.isEmptyOrNotReported(siblingMonthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
      // then check if parent AE already has some errors
      if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
        // check if no errors from before, then we can set a new error of mutlipay error - becausemultipay error cannot override the original edit check erros
        if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing) {
          parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E32');
        }
      } else { // parent is all good its the sibling that's missing
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
        siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E32');
      }
     }
  }


  compareParentSiblingByCellName(cellName: string, parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel) {
    switch (cellName) {
      case 'AE-PR': {
        // AE-PR
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWorkerPayrolls,
                                                                                            siblingMonthlyMicrodataViewModel.TotalWorkerPayrolls);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing =
                                                                 parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing =
                                                                 siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing || siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E32');
        }
        break;
      }
      case 'AE-HR': {
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWorkerHours,
                                                                                            siblingMonthlyMicrodataViewModel.TotalWorkerHours);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing =
                                                                  parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing =
                                                                  siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing || siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E32');
        }
        break;
      }
      case 'AE-CM': {
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalCommisions,
                                                                                            siblingMonthlyMicrodataViewModel.TotalCommisions);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E32');
        }
        break;
      }
      case 'WW': {
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWomenWorkers,
                                                                                            siblingMonthlyMicrodataViewModel.TotalWomenWorkers);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E32');
        }
        break;
      }
      case 'PW-PR': {
        // AE-PR
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls,
                                                                                            siblingMonthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing =
                                                                  parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E32');
        }
        break;
      }
      case 'PW-HR': {
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours,
                                                                                            siblingMonthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing =
                                                                  parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E32');
        }
        break;
      }
      case 'PW-CM': {
        const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalNonSUpervisoryCommisions,
                                                                                            siblingMonthlyMicrodataViewModel.TotalNonSUpervisoryCommisions);
        parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing =
                                                                  parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing || parentError;
        siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = siblingError;
        if (parentError) {
          parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E32');
        }
        if (siblingError) {
          siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E32');
        }
        break;
      }
    }
  }

  onCompareSetParentSiblingMultipayCellError(parentValue: string | number, siblingValue: string | number) {
    let isParentError = false;
    let isSiblingError = false;

    const parentReportedSiblingNot = this.isReportedAndValid(parentValue) && this.isEmptyOrNotReported(siblingValue);
    const siblingReportedParentNot = this.isEmptyOrNotReported(parentValue) && this.isReportedAndValid(siblingValue);
    const bothNotReported = this.isEmptyOrNotReported(parentValue) && !this.isEmptyOrNotReported(siblingValue);

    // if parent repotered but siblint not
    if (parentReportedSiblingNot) {
      isSiblingError = true;
    }
    if (siblingReportedParentNot) {
      isParentError = true;
    }
    if (bothNotReported) {
      isSiblingError = false; // leave parent alone, tehre could be an error set for that already by running regular edit checks
    }



    return [isParentError, isSiblingError];
  }

/*----------End Edit check errors------------------------------------------------------------------------------------------------*/









  // we dont need one method for each value calc - we just reuse the smae func above by passing different values


  // computePwPr(prLpGroup1: number, prLpGroup2: number) {
  //   // refer computeAePr() for explanation how old code with multiple conditions turned into this
  //   try {
  //     const value = bankersRounding((+this.multiPayMicroDataGroup1.TotalNonSupervisoryWorkerPayrolls * prLpGroup1) + (+this.multiPayMicroDataGroup2.TotalNonSupervisoryWorkerPayrolls * prLpGroup2) , 0);
  //     return value === 0 ? null : value; // just because we don't want to show zeros in the grid cells
  //   } catch (e) {
  //     return null;
  //   }
  // }

  // computeAeCm(prLpGroup1: number, prLpGroup2: number) {
  //   // refer computeAePr() for explanation how old code with multiple conditions turned into this
  //   try {
  //     const value = bankersRounding((+this.multiPayMicroDataGroup1.TotalCommisions * prLpGroup1) + (+this.multiPayMicroDataGroup2.TotalCommisions * prLpGroup2) , 0);
  //     return value === 0 ? null : value; // just because we don't want to show zeros in the grid cells
  //   } catch (e) {
  //     return null;
  //   }
  // }
// etc., etc.,







  isNumber(value: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
  }


  isValuePositive(microDataValue: string | number): boolean  {
    if (this.isReportedAndValid(microDataValue)) {
      if (this.isNumber(microDataValue)) {
        return +microDataValue > 0;
      }
      return false;
    }
    return false;
  }

  isValueZero(microDataValue: string | number): boolean  {
    if (this.isReportedAndValid(microDataValue)) {
      return +microDataValue === 0;
    }
    return false;
  }

  isEmptyOrNotReported(microDataValue: string | number): boolean {
    return !(!!microDataValue) || microDataValue === '';
  }

  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '';
  }


  // compute LP factors for each PLp options
  computeLpFactor(refMM: number, refYY: number, plopp: number): number {
    let lpFactor = 0;
    try {
        switch (plopp) {
            case 1:
              lpFactor = 1;
              break;
            case 2:
              lpFactor = 0.5;
              break;
            //Case 3 & 4 round LP up to 4 decimal places
            case 3:
              lpFactor = Math.round(5 / this.getNumberOfWeekDays(refYY, refMM, 1, 15) * 100) * 0.01;
              break;
            case 4:
                const lLastDateOfMonth = new Date(refYY, refMM, 0);
                lpFactor = Math.round(5 / this.getNumberOfWeekDays(refYY, refMM, 1, lLastDateOfMonth.getDate()) * 100) * 0.01;
                break;
            default:
              lpFactor = 0;
              break;
            }
        } catch (e) {
        return 0;
    }
    return lpFactor;
  }

  // get the number of weekdays given the start date and end date for the month and year
  getNumberOfWeekDays(year: number, month: number, startDate: number, endDate: number) {
    let weekDays = 0;
    let lDate = null;
    try {
        for (let day = startDate; day <= endDate; day++) {
            lDate = new Date(year, month - 1, day);
            if (lDate.getDay() !== 6 && lDate.getDay() !== 0) {
              weekDays++;
            }
        }
      } catch (e) {
    return null;
    }
    return weekDays;
  }

}
