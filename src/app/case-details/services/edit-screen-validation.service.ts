import { Injectable } from '@angular/core';
import { CollectionsCesMicroData, MicroDataCellContextError, MicroRatioCellContextError, MicroRatioOtmScreeningContextError } from 'src/app/shared/models/collections-microdata.model';
import { MicroDataCellObject } from '../collection/models/microdata-cell-object.model';

 // let z: string | number | null = null;
    // if (!!z) {
    //   console.log('z is number and not null');
    // }


    // z = undefined;

    // if (!!z) {
    //   console.log('z is number and not null');
    // }


    // z = 0;

    // if (!!z) {
    //   console.log('z is number and not null');
    // }
    // z = 56;
    // if (!!z) {
    //   console.log('z is number and not null');
    // }


    // z = '';
    // if (!!z) {
    //   console.log('z is number and not null');
    // }
    // z = '54756';
    // if (!!z) {
    //   console.log('z is number and not null');
    // }



@Injectable({
  providedIn: 'root'
})
export class EditScreenValidationService {

  private _monthlyMicrodataViewModel: CollectionsCesMicroData;
  constructor() { }

   // Edit Tests for Data Completeness (E1.1.x)
  setEditScreenErrors(monthlyMicrodataViewModel: CollectionsCesMicroData, scheduleType: string) {

    if (monthlyMicrodataViewModel != null) {
        // set validation error object
        monthlyMicrodataViewModel.MicroDataRatioOtmContextError = new MicroRatioOtmScreeningContextError();
        monthlyMicrodataViewModel.CesOtmScreeningErrorScripts = new Map<string, string>();
        monthlyMicrodataViewModel.MicroDataRatioContextError = new MicroRatioCellContextError();
        monthlyMicrodataViewModel.CesScreeningErrorScripts = new Map<string, string>();
        monthlyMicrodataViewModel.MicroDataCellContextError = new MicroDataCellContextError();
        monthlyMicrodataViewModel.CesInterviewErrorScripts = new Map<string, string>();

        // when none  of the values are availble then no errors
        if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalCommisions)  &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerHours) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalOvertime) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerPayrolls) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
        this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWomenWorkers)) {
          return;
        }



        // when some of the values are reported with no AE
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalCommisions)  ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours) ||
        // this.isReportedAndValid(monthlyMicrodataViewModel.TotalOvertime) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) ||
        this.isReportedAndValid(monthlyMicrodataViewModel.TotalWomenWorkers)) {
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
        }

        // PR reported but AE or HR not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls)) {
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerHours)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E4');
          }
        }

        // HR reported but AE or PR not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours)) {
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerPayrolls)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E3');
          }
        }


        // AE_CM reported but AE not reported or (one of the two - PR or HR) not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalCommisions)) {
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerPayrolls) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerHours)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E5');
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E5');
          } else {
            if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerPayrolls)) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E3');
            }
            if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerHours)) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E4');
            }
          }
        }

        // PW-PR reeported but other req not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls)) {
          // AE not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // PW not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E2');
          }
          // PW-HR not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E8');
          }
        }


        // PW-HR reeported but other req not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
          // AE not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // PW not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E2');
          }
          // PW-HR not reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E7');
          }
        }


        // PW_CM reported but AE not reported or (one of the two - PW-PR or PW-HR) not reported
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions)) {
          // not AE reported
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E1');
          }
          // set approapriate flags and messages
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E9');
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E9');
          } else {
            if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E2');
            }
            if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls)) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E7');
            }
            if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E8');
            }
          }
        }

        if (scheduleType !== 'G' && scheduleType !== 'S') {
          // AE comparison rules - if AE = 0; then all of the other values PR/HR/CM must be 0.
            if (this.isValueZero(monthlyMicrodataViewModel.TotalWorkers)) {
              if (this.isValueZero(monthlyMicrodataViewModel.TotalWorkerHours) &&
                  this.isValueZero(monthlyMicrodataViewModel.TotalWorkerPayrolls) &&
                  this.isValueZero(monthlyMicrodataViewModel.TotalCommisions)) {
                    // do nothing
                  } else {
                    if (!this.isValueZero(monthlyMicrodataViewModel.TotalWorkerHours) ||
                        !this.isValueZero(monthlyMicrodataViewModel.TotalWorkerPayrolls) ||
                        !this.isValueZero(monthlyMicrodataViewModel.TotalCommisions)) {
                          monthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = true;
                          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E13');
                          monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E13');
                          monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E13');
                          monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E13');
                        }
                    // if ((this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours)) &&
                    //     (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkerHours) || this.isValueZero(monthlyMicrodataViewModel.TotalWorkerHours))) {
                    //       monthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = true;
                    //       monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E13');
                    //       monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                    //       monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E13');
                    //       monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                    //       monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E13');
                    //       monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                    //       monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E13');

                    // } else if ((!this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls) && this.isReportedAndValid(monthlyMicrodataViewModel.TotalCommisions)) ||
                    //           ((!this.isReportedAndValid(monthlyMicrodataViewModel.TotalCommisions) && this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls)))) {
                    //             monthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = true;
                    //             monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E13');
                    //             monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                    //             monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E13');
                    //             monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                    //             monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E13');
                    //             monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                    //             monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E13');
                    // }
                }
            }

            // AE comparison rules other way around - if AE or HR 0, then all are 0.
            if ((this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours) && this.isValueZero(monthlyMicrodataViewModel.TotalWorkerHours)) ||
                (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls) && this.isValueZero(monthlyMicrodataViewModel.TotalWorkerPayrolls))) {
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E13');
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E13');
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E13');
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E13');
            }




          // PW comparison rules - if PW = 0; then all of the other values PR/HR/CM must be 0.
            if (this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
              if ((this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) && !this.isValueZero(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions)) ||
                  (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) && !this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls)) ||
                  (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) && !this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours))) {
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = true;
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E16');
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E16');
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E16');
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E16');
              }
            }

             // other way around - if PR or HR 0, then all are 0.
            if ((this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) && this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) ||
             (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) && this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls))) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E16');
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E16');
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E16');
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E16');
            }
        }




        // PW comparison rules - if PW = 0; then all of the other values PR/HR/CM must be 0.
        // if (this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
        //     if(this.isValuePositive(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions)) {
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E16');
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E16');
        //     }
        //     if(this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E16');
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E16');
        //     }
        //     if(this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls)) {
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E16');
        //         monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
        //         monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E16');
        //     }
        // }

        // WW > AE
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWomenWorkers) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers)) {
              if (+monthlyMicrodataViewModel.TotalWomenWorkers > +monthlyMicrodataViewModel.TotalWorkers) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E30');
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E30');
              }
            }

        // PW > AE
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers)) {
              if (+monthlyMicrodataViewModel.TotalNonSupervisoryWokers > +monthlyMicrodataViewModel.TotalWorkers) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E19');
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E19');
              }
            }

        // PW-PR > AE-PR
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerPayrolls)) {
              if (+monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls > +monthlyMicrodataViewModel.TotalWorkerPayrolls) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E48');
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E20');
              }
            }

        // PW-HR > AE-HR
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours)) {
              if (+monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours > +monthlyMicrodataViewModel.TotalWorkerHours) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E49');
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E23');
              }
            }

        // CM_Lopp has no value or zero value (since the code is string the equivalent of 0 is undefined) and AE_CM >=0
        if ((monthlyMicrodataViewModel.CommisionPayFrequncy.code === '0') &&
               (this.isValuePositive(monthlyMicrodataViewModel.TotalCommisions) || this.isValueZero(monthlyMicrodataViewModel.TotalCommisions))) {
          monthlyMicrodataViewModel.MicroDataCellContextError.isCommissionsPayFrequencyMissing = true;
          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('CLP', 'E12');
        }

        // CM_Lopp has no value or zero value (since the code is string the equivalent of 0 is undefined) and AE_CM >=0
        if ((monthlyMicrodataViewModel.CommisionPayFrequncy.code === '0') &&
               (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) || this.isValueZero(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions))) {
          monthlyMicrodataViewModel.MicroDataCellContextError.isCommissionsPayFrequencyMissing = true;
          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('CLP', 'E12');
        }

         // PLopp has no value or zero value (since the code is string the equivalent of 0 is undefined) and AE_CM >=0
        if ((monthlyMicrodataViewModel.PayFrequency.code === '0') &&
         (this.isValuePositive(monthlyMicrodataViewModel.TotalWorkerPayrolls) || this.isValueZero(monthlyMicrodataViewModel.TotalWorkerPayrolls))) {
          monthlyMicrodataViewModel.MicroDataCellContextError.isPayFrequencyMissing = true;
          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PLP', 'E11');
        }

        // PLopp has no value or zero value (since the code is string the equivalent of 0 is undefined) and AE_CM >=0
        if ((monthlyMicrodataViewModel.PayFrequency.code === '0') &&
         (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) || this.isValueZero(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls))) {
          monthlyMicrodataViewModel.MicroDataCellContextError.isPayFrequencyMissing = true;
          monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PLP', 'E11');
        }


        // for manufacturing only
        if (scheduleType === 'C') {
          // AE_OT reported
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalOvertime)) {
              // scenario 1 - BUT AE not reported
              if (this.isValuePositive(monthlyMicrodataViewModel.TotalOvertime) && !this.isValuePositive(monthlyMicrodataViewModel.TotalWorkers)) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalOvertimeMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-OT', 'E15');
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E15');
              }
              // scenario 2 - BUT HR or PR not reported
              if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerHours) ||
                  this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkerPayrolls)) {
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
                    monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = true;
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E6');
                    monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E6');
              }
          }

          // PW_OT reported
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime)) {

              // scenario 1 - BUT PW not reported
              if (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) && !this.isValuePositive(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryOvertimeMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-OT', 'E18');
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E18');
              }
              // scenario - 2 : BUT one of the two - PR or HR not reported
              if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerPayrolls) ||
                  this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerPayrollsMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-PR', 'E10');
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E10');
              }
          }

          // PW-OT > AE-OT
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) &&
              this.isReportedAndValid(monthlyMicrodataViewModel.TotalOvertime)) {
                if (+monthlyMicrodataViewModel.TotalNonSupervisoryOvertime > +monthlyMicrodataViewModel.TotalOvertime) {
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryOvertimeMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-OT', 'E25');
                }
          }

          // PW-OT > PW-HR
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryOvertime) &&
          this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
            if (+monthlyMicrodataViewModel.TotalNonSupervisoryOvertime > +monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryOvertimeMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-OT', 'E26');
            }
          }

          // AE-OT > AE-HR
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalOvertime) &&
            this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours)) {
              if (+monthlyMicrodataViewModel.TotalOvertime > +monthlyMicrodataViewModel.TotalWorkerHours) {
                monthlyMicrodataViewModel.MicroDataCellContextError.isTotalOvertimeMissing = true;
                monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-OT', 'E24');
              }
          }
      }

        // AE is greater than 199, 999
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers)) {
          if (+monthlyMicrodataViewModel.TotalWorkers > 199999) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E28');
          }
        }

        // PW is greater than 199, 999
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWokers)) {
          if (+monthlyMicrodataViewModel.TotalNonSupervisoryWokers > 199999) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWokersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW', 'E29');
          }
        }

        // WW is greater than 199, 999
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWomenWorkers)) {
          if (+monthlyMicrodataViewModel.TotalWomenWorkers > 199999) {
            monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = true;
            monthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E31');
          }
        }

        // PW_HR cannot be = AE_HR when AE != PW
        if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWokers) &&
           this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers) &&
           this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkerHours) &&
           this.isReportedAndValid(monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours)) {
          if (monthlyMicrodataViewModel.TotalWorkers !== monthlyMicrodataViewModel.TotalNonSupervisoryWokers) {
            if (monthlyMicrodataViewModel.TotalWorkerHours === monthlyMicrodataViewModel.TotalNonSupervisoryWorkerHours) {
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E45');
              monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSupervisoryWorkerHoursMissing = true;
              monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-HR', 'E45');
            }
          }
        }


        if (scheduleType !== 'G' && scheduleType !== 'S') {
          // PW_CM is greater than AE_CM
          if (this.isValuePositive(monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions) &&
              this.isValuePositive(monthlyMicrodataViewModel.TotalCommisions)) {
                if (+monthlyMicrodataViewModel.TotalNonSUpervisoryCommisions > +monthlyMicrodataViewModel.TotalCommisions) {
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalNonSUpervisoryCommisionsMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('PW-CM', 'E44');
                  monthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = true;
                  monthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E44');
                }
          }
        }

    }

  }


  // setEditScreenMultiPayErrors(siblingMonthlyMicrodataViewModel: CollectionsCesMicroData, parentMonthlyMicrodataViewModel: CollectionsCesMicroData, editedCellObject: MicroDataCellObject) {
  //   if (siblingMonthlyMicrodataViewModel != null && parentMonthlyMicrodataViewModel != null) {
  //     // set validation error object
  //     siblingMonthlyMicrodataViewModel.MicroDataCellContextError = new MicroDataCellContextError();
  //     siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts = new Map<string, string>();

  //     // run a precheck on AE to make sure both paygroups have AE reported
  //     this.totalWorkersPreCheck(parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);


  //      // now, only after AE is all cleared, we start the comparison of the parent/ sibling for PR, HR , CM and OT
  //     if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing &&
  //         !siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing) {
  //           // to avoid running each cell values compare during editing, we need to only check the edited cell and compare that (improvement - old code runs everything)
  //           // edit mode (as opposed on init mode) - microgrid component is passing this object only during edit mode otherwise null
  //         if (editedCellObject != null) {
  //             this.compareParentSiblingByCellName(editedCellObject.cellName, parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
  //           } else { // on init mode
  //             // AE-PR
  //             this.compareParentSiblingByCellName('AE-PR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
  //             // AE-HR
  //             this.compareParentSiblingByCellName('AE-HR', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
  //             // AE-CM
  //             this.compareParentSiblingByCellName('AE-CM', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
  //             // AE-WW
  //             this.compareParentSiblingByCellName('WW', parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel);
  //           }
  //         }
  //       }
  //   }




  // totalWorkersPreCheck(parentMonthlyMicrodataViewModel: CollectionsCesMicroData, siblingMonthlyMicrodataViewModel: CollectionsCesMicroData) {
  //   // check if parent or sibling AE missing
  //   if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalWorkers) ||
  //   this.isEmptyOrNotReported(siblingMonthlyMicrodataViewModel.TotalWorkers)) {
  //     // then check if parent AE already has some errors
  //     if (this.isEmptyOrNotReported(parentMonthlyMicrodataViewModel.TotalWorkers)) {
  //       // if no errors, then we can set a new error of mutlipay error - becausemultipay error cannot override the original edit check erros
  //       if (!parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing) {
  //         parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
  //         parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E32');
  //       }
  //     } else { // parent is all good its the sibling that's missing
  //       siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkersMissing = true;
  //       siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE', 'E32');
  //     }
  //    }
  // }


  // compareParentSiblingByCellName(cellName: string, parentMonthlyMicrodataViewModel, siblingMonthlyMicrodataViewModel) {
  //   switch (cellName) {
  //     case 'AE-PR': {
  //       // AE-PR
  //       const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWorkerPayrolls,
  //                                                                                           siblingMonthlyMicrodataViewModel.TotalWorkerPayrolls);
  //       parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing =
  //                                                                     parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing || parentError;
  //       siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerPayrollsMissing = siblingError;
  //       if (parentError) {
  //         parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E32');
  //       }
  //       if (siblingError) {
  //         siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-PR', 'E32');
  //       }
  //       break;
  //     }
  //     case 'AE-HR': {
  //       const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWorkerHours,
  //                                                                                           siblingMonthlyMicrodataViewModel.TotalWorkerHours);
  //       parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing =
  //                                                                     parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing || parentError;
  //       siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWorkerHoursMissing = siblingError;
  //       if (parentError) {
  //         parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E32');
  //       }
  //       if (siblingError) {
  //         siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-HR', 'E32');
  //       }
  //       break;
  //     }
  //     case 'AE-CM': {
  //       const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalCommisions,
  //                                                                                           siblingMonthlyMicrodataViewModel.TotalCommisions);
  //       parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing =
  //                                                                     parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing || parentError;
  //       siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalCommisionsMissing = siblingError;
  //       if (parentError) {
  //         parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E32');
  //       }
  //       if (siblingError) {
  //         siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('AE-CM', 'E32');
  //       }
  //       break;
  //     }
  //     case 'WW': {
  //       const [parentError, siblingError] = this.onCompareSetParentSiblingMultipayCellError(parentMonthlyMicrodataViewModel.TotalWomenWorkers,
  //                                                                                           siblingMonthlyMicrodataViewModel.TotalWomenWorkers);
  //       parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing =
  //                                                                     parentMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing || parentError;
  //       siblingMonthlyMicrodataViewModel.MicroDataCellContextError.isTotalWomenWorkersMissing = siblingError;
  //       if (parentError) {
  //         parentMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E32');
  //       }
  //       if (siblingError) {
  //         siblingMonthlyMicrodataViewModel.CesInterviewErrorScripts.set('WW', 'E32');
  //       }
  //       break;
  //     }
  //   }
  // }


  // onCompareSetParentSiblingMultipayCellError(parentValue: string | number, siblingValue: string | number) {
  //   let isParentError = false;
  //   let isSiblingError = false;

  //   const parentReportedSiblingNot = this.isReportedAndValid(parentValue) && this.isEmptyOrNotReported(siblingValue);
  //   const siblingReportedParentNot = this.isEmptyOrNotReported(parentValue) && this.isReportedAndValid(siblingValue);
  //   const bothNotReported = this.isEmptyOrNotReported(parentValue) && !this.isEmptyOrNotReported(siblingValue);

  //   // if parent repotered but siblint not
  //   if (parentReportedSiblingNot) {
  //     isSiblingError = true;
  //   }
  //   if (siblingReportedParentNot) {
  //     isParentError = true;
  //   }
  //   if (bothNotReported) {
  //     isSiblingError = false;
  //   }



  //   return [isParentError, isSiblingError];
  // }


  isValuePositive(microDataValue: string | number): boolean  {
    if (this.isReportedAndValid(microDataValue)) {
      return +microDataValue > 0;
    }
  }

  isValueZero(microDataValue: string | number): boolean  {
    if (this.isReportedAndValid(microDataValue)) {
      return +microDataValue === 0;
    }
  }

  isEmptyOrNotReported(microDataValue: string | number): boolean {
    return !(!!microDataValue) || microDataValue === '';
  }

  isReportedAndValid(microDataValue: string | number): boolean {
    return microDataValue != null && microDataValue !== '';
  }



}
