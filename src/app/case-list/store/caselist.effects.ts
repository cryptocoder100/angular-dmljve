import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError, tap, withLatestFrom, mapTo } from 'rxjs/operators';
import * as fromCaseList from './caselist.reducer';
import * as CaseListActions from './caselist.actions';
import { of, observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { TcwHttpService } from '../../core/services/tcw-http.service';
import { Case } from '../../shared/models/case.model';
import { CaseListService } from '../services/case-list.service';
import { environment } from 'src/environments/environment';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';
import { TcwSaveAllService } from 'src/app/core/services/tcw-save-all.service';
import { StringObject } from 'src/app/shared/models/string-object.model';
import { Interaction } from 'src/app/shared/models/interaction.model';
import { UnitService } from 'src/app/case-details/services/unit.service';


@Injectable()
export class CaseListEffects {

    constructor(private actions$: Actions, private http: HttpClient,
                private store: Store<fromCaseList.CaseListState>,
                private tcwHttpService: TcwHttpService,
                private unitService: UnitService,
                private caseListService: CaseListService,
                private uiConfigService: UIConfigService,
                private tcwSaveAllService: TcwSaveAllService) { }

    @Effect()
    fetchCaseList = this.actions$
        .pipe(
        ofType(CaseListActions.FETCH_CASE_LIST),
        switchMap((action: CaseListActions.FetchCaseList) => {
            const userId = action.payload;
            const params = new HttpParams().set('userId', userId );
            return this.tcwHttpService.httpGet<Case[] | TcwError>('api/Cases', params)
            .pipe(
                tap(() => {
                    this.caseListService.setCaseListTimer(environment.caseListRefreshDuration * 1000);
                }),
                map((cases: Case[]) => {
                    return new CaseListActions.SetCaseList(cases);
                }),
                catchError((errorResponse: TcwError) => {
                    return of(new CaseListActions.SetCaseListFail(errorResponse.friendlyErrorMessageToUser));
                })
            );
        })
    );

    @Effect()
    scheduleSelectedCase = this.actions$
        .pipe(
        ofType(CaseListActions.SCHEDULE_SELECTED_CASE),
        switchMap((action: CaseListActions.ScheduleSelectedCase) => {
            const schedDateTime: Date = action.payload;
            let caseNum: string;
            this.store.select(fromCaseList.getSelectedCaseNum).pipe(take(1)).subscribe( selectedCaseNum => {
                caseNum = selectedCaseNum;
            });
            return this.tcwHttpService.httpPost('api/Cases/' + caseNum + '/ScheduleCase', schedDateTime)
            .pipe(
                map((response: any) => {
                    this.uiConfigService.ShowSuccessToast('Scheduling Complete');
                    return new CaseListActions.ScheduleSelectedCaseSuccess(schedDateTime);
                }),
                catchError((errorResponse: TcwError) => {
                    this.uiConfigService.SetErrorDialogMessage('Scheduling Failed');
                    return of(new CaseListActions.ScheduleSelectedCaseFail(errorResponse.friendlyErrorMessageToUser));
                })
            );
        })
    );

    @Effect()
    scheduleMultiSelectedCases = this.actions$
        .pipe(
        ofType(CaseListActions.SCHEDULE_MULTISELECT_CASES),
        switchMap((action: CaseListActions.ScheduleMultiselectCases) => {
            const schedDateTime: Date = action.payload;
            let selectedCaseNums: string[] = [];
            this.store.select(fromCaseList.getSelectedCaseNumList).pipe(take(1)).subscribe( selectedCaseNumList => {
                selectedCaseNums = [...selectedCaseNumList];
            });
            return this.tcwHttpService.httpPost('api/Cases/GroupSchedule', {caseNums: selectedCaseNums, schedDate: schedDateTime})
            .pipe(
                map((cases: Case[]) => {
                    this.uiConfigService.ShowSuccessToast('Scheduling Complete');
                    return new CaseListActions.ScheduleMultiselectCasesSuccess(schedDateTime);
                }),
                catchError((errorResponse: TcwError) => {
                    this.uiConfigService.SetErrorDialogMessage('Scheduling Failed');
                    return of(new CaseListActions.ScheduleMultiselectCasesFail(errorResponse.friendlyErrorMessageToUser));
                })
            );
        })
    );

    @Effect()
    loadSelectedCase = this.actions$
        .pipe(
        ofType(CaseListActions.LOAD_SELECTED_CASE),
        switchMap((action: CaseListActions.LoadSelectedCase) => {
            let caseNum: string;
            this.store.select(fromCaseList.getSelectedCaseNum).pipe(take(1)).subscribe( selectedCaseNum => {
                caseNum = selectedCaseNum;
            });

            return this.tcwHttpService.httpGet<Case>('api/Cases/' + caseNum)
            .pipe(
                map((caseObj: Case) => {
                    return new CaseListActions.LoadSelectedCaseSuccess(new Case(caseObj));
                }),
                catchError((errorResponse: TcwError) => {
                    return of(new CaseListActions.LoadSelectedCaseFail(errorResponse.friendlyErrorMessageToUser));
                })
            );
        })
    );

    @Effect()
    saveCases = this.actions$
        .pipe(
        ofType(CaseListActions.SAVE_CASES),
        switchMap((action: CaseListActions.SaveCases) => {
            let interaction: Interaction;
            this.store.select(fromCaseList.getInteraction).pipe(take(1)).subscribe(iact => {
                interaction = iact;
            });

            return this.tcwSaveAllService.saveAll(action.payload.casesToSave, action.payload.unitsToSave, action.payload.microdataToSave,
                                                  action.payload.auditCaseNum, interaction, action.payload.closeOnSuccess,
                                                  action.payload.isCompleteAddressRefinement, action.payload.isCompleteEnrollment,
                                                  action.payload.isNrpComplete)
            .pipe(
                map((stringObj: StringObject) => {
                    this.uiConfigService.ShowSuccessToast(stringObj.stringData);
                    return new CaseListActions.SaveCasesSuccess({ casesSaved: action.payload.casesToSave, closeOnSuccess: action.payload.closeOnSuccess, currentSelectedUnitId: action.payload.currentSelectedUnitId });
                }),
                catchError((errorResponse: TcwError) => {
                    this.uiConfigService.SetErrorDialogMessage('Save Failed:' + errorResponse.friendlyErrorMessageToUser);
                    return of(new CaseListActions.SaveCasesFail(errorResponse.friendlyErrorMessageToUser));
                })
            );
        })
    );

    @Effect()
    saveCasesSuccess = this.actions$
        .pipe(
        ofType(CaseListActions.SAVE_CASES_SUCCESS),
        switchMap((action: CaseListActions.SaveCasesSuccess) => {
            if (action.payload.closeOnSuccess) {
              return of(new CaseListActions.UnloadSelectedCase(true));
            } else {
              console.log('Inside save success effects Fetching updated Microdata ' + action.payload.casesSaved[0].CASE_NUM);
               if (action.payload.casesSaved != null && action.payload.casesSaved.length > 0) {
                // this.unitService.updatePristineCloneUnit(action.payload.casesSaved[0].CASE_NUM)
                this.unitService.updatePristineCloneMultiUnit(action.payload.casesSaved[0].CASE_NUM, action.payload.currentSelectedUnitId)
                  .subscribe((sucess: boolean) => {
                    console.log('Fetching updated Microdata successuful');
                  }
                );
              }
              return of(new CaseListActions.NoAction());
            }
        })
    );

    @Effect()
    unloadSelectedCase = this.actions$
        .pipe(
        ofType(CaseListActions.UNLOAD_SELECTED_CASE),
        switchMap((action: CaseListActions.UnloadSelectedCase) => {
            let caseNum: string;
            this.store.select(fromCaseList.getSelectedCaseNum).pipe(take(1)).subscribe( cn => {
                caseNum = cn;
            });
            return of(new CaseListActions.UnloadSelectedCaseComplete({ afterSave: action.payload, caseNum: caseNum}));
        })
    );

    @Effect()
    unloadSelectedCaseComplete = this.actions$
        .pipe(
        ofType(CaseListActions.UNLOAD_SELECTED_CASE_COMPLETE),
        switchMap((action: CaseListActions.UnloadSelectedCaseComplete) => {
            if (action.payload.afterSave === true) {
                return of(new CaseListActions.ClearActiveInteraction());
            } else {
                let interaction: Interaction;
                this.store.select(fromCaseList.getInteraction).pipe(take(1)).subscribe( iact => {
                    interaction = iact;
                });

                return this.tcwHttpService.httpPost('api/Cases/' + action.payload.caseNum + '/Unlock', { interactionObject: interaction })
                .pipe(
                    map((data) => {
                        return new CaseListActions.ClearActiveInteraction();
                    }),
                    catchError((errorResponse: TcwError) => {
                        console.error('Error unlocking case: ' + errorResponse.friendlyErrorMessageToUser);
                        return of(new CaseListActions.ClearActiveInteraction());
                    })
                );
            }
        })
    );
}
