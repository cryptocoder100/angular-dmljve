import { Injectable } from '@angular/core';
import { CollectionsJoltsMicroData, JoltsMicroDataCellEditContextError, JoltsMicroDataCellEditScreeningError, JoltsMicroDataCellRatioScreeningError } from 'src/app/shared/models/collections-microdata.model';

@Injectable({
  providedIn: 'root'
})
export class JoltsEditScreenValidationService {

  constructor() { }


     // Edit Tests for Data Completeness (E1.1.x)
     setEditCheckErrors(monthlyMicrodataViewModel: CollectionsJoltsMicroData) {
      // // any time you start the edit check process - gooddate (validated date) should not be set
      // monthlyMicrodataViewModel.ValidatedDateTime = null;

      if (monthlyMicrodataViewModel != null) {
          // reset validation error object
          monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError = new JoltsMicroDataCellEditContextError();
          monthlyMicrodataViewModel.JoltsInterviewErrorScripts = new Map<string, string>();
          monthlyMicrodataViewModel.JoltsMicroDataCellEditScreeningError = new JoltsMicroDataCellEditScreeningError();
          monthlyMicrodataViewModel.JoltsEditScreeningErrorScripts = new Map<string, string>();
          monthlyMicrodataViewModel.JoltsMicroDataCellRatioScreeningError = new JoltsMicroDataCellRatioScreeningError();
          monthlyMicrodataViewModel.JoltsRatioScreeningErrorScripts = new Map<string, string>();

          // when none  of the values are availble then no errors
          if (this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalWorkers) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.Quits)  &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.TotalSeperation) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.NewHires) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.JobOpenings) &&
          this.isEmptyOrNotReported(monthlyMicrodataViewModel.OtherSeperation)) {
            return;
          }


           // calcualte sum for TS
          if (this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges) &&
           this.isReportedAndValid(monthlyMicrodataViewModel.Quits) &&
           this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation)) {
             monthlyMicrodataViewModel.TotalSeperation = +monthlyMicrodataViewModel.LayoffsAndDischarges +
                                                         +monthlyMicrodataViewModel.OtherSeperation +
                                                         +monthlyMicrodataViewModel.Quits;
           }


          // when some of the values are reported with no AE
          if (this.isReportedAndValid(monthlyMicrodataViewModel.Quits) ||
          this.isReportedAndValid(monthlyMicrodataViewModel.TotalSeperation) ||
          this.isReportedAndValid(monthlyMicrodataViewModel.NewHires) ||
          this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges) ||
          this.isReportedAndValid(monthlyMicrodataViewModel.JobOpenings) ||
          this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation)) {
            if (!this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers)) {
              monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isTotalWorkersMissingOrInvalid = true;
              monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('TE', 'E5');
            }
          }

          // TE cannot be > 199,999
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalWorkers)) {
            if (+monthlyMicrodataViewModel.TotalWorkers > 199999) {
              monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isTotalWorkersMissingOrInvalid = true;
              monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('TE', 'E1');
            }
          }



           // if TS reported but only 2 of the 3 breakouts (OS + LD + Q) reported then error
          if (this.isReportedAndValid(monthlyMicrodataViewModel.TotalSeperation)) {
              // push (OS + LD + Q) into an array for an easier validation logic
              const breakoutArray = new Array<number | null>();
              breakoutArray.push(this.isReportedAndValid(monthlyMicrodataViewModel.Quits) ? +monthlyMicrodataViewModel.Quits : null);
              breakoutArray.push(+this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges) ? +monthlyMicrodataViewModel.LayoffsAndDischarges : null);
              breakoutArray.push(+this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation) ? +monthlyMicrodataViewModel.OtherSeperation : null);

              // neither one of the Q or LD or OS should be greater than TS
              if (breakoutArray.filter(x => x != null).length < 3) {
                let hasError = false;
                if (this.isReportedAndValid(monthlyMicrodataViewModel.Quits) &&
                    (+monthlyMicrodataViewModel.Quits > +monthlyMicrodataViewModel.TotalSeperation)) {
                      hasError = true;
                }
                if (this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges) &&
                    (+monthlyMicrodataViewModel.LayoffsAndDischarges > +monthlyMicrodataViewModel.TotalSeperation)) {
                      hasError = true;
                  }
                if (this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation) &&
                  (+monthlyMicrodataViewModel.OtherSeperation > +monthlyMicrodataViewModel.TotalSeperation)) {
                    hasError = true;
                }
                if (hasError) {
                  monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isTotalSeperationMissingOrInvalid = true;
                  monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('TS', 'E4');
                  monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isLayoffAndDiscahrgesMissingOrInvalid = true;
                  monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('LD', 'E4');
                  monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isOtherSeperationMissingOrInvalid = true;
                  monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('OS', 'E4');
                  monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isQuitsMissingOrInvalid = true;
                  monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('Q', 'E4');
                } else {
                  // now check if array has exactly 2 items with values
                  if (breakoutArray.filter(x => x != null).length === 2) {
                    monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isTotalSeperationMissingOrInvalid = true;
                    monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('TS', 'E3');
                    monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isLayoffAndDiscahrgesMissingOrInvalid = true;
                    monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('LD', 'E3');
                    monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isOtherSeperationMissingOrInvalid = true;
                    monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('OS', 'E3');
                    monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isQuitsMissingOrInvalid = true;
                    monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('Q', 'E3');
                  }
                }
              }
          }

          // if all TS, OS, LD and Q reported then TS must be = OS + LD + Q
          if (this.isReportedAndValid(monthlyMicrodataViewModel.Quits) &&
          this.isReportedAndValid(monthlyMicrodataViewModel.TotalSeperation) &&
          this.isReportedAndValid(monthlyMicrodataViewModel.LayoffsAndDischarges) &&
          this.isReportedAndValid(monthlyMicrodataViewModel.OtherSeperation)) {
            if (+monthlyMicrodataViewModel.TotalSeperation !==
              (+monthlyMicrodataViewModel.OtherSeperation + +monthlyMicrodataViewModel.LayoffsAndDischarges + +monthlyMicrodataViewModel.Quits)) {
                monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isTotalSeperationMissingOrInvalid = true;
                monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('TS', 'E2');
                monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isLayoffAndDiscahrgesMissingOrInvalid = true;
                monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('LD', 'E2');
                monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isOtherSeperationMissingOrInvalid = true;
                monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('OS', 'E2');
                monthlyMicrodataViewModel.JoltsMicroDataCellEditContextError.isQuitsMissingOrInvalid = true;
                monthlyMicrodataViewModel.JoltsInterviewErrorScripts.set('Q', 'E2');
            }
          }
      }
    }


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
