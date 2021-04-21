import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Case } from '../../shared/models/case.model';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { take, switchMap, map, catchError, tap } from 'rxjs/operators';
import * as fromCaseDetails from '../store/case-details.reducer';
import * as CaseDetailsActions from '../store/case-details.actions';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import * as CaseListActions from '../../case-list/store/caselist.actions';
import { Observable, of, throwError } from 'rxjs';
import { ofType, Actions } from '@ngrx/effects';

import * as fromApp from '../../store/app.reducer';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';


@Injectable({providedIn: 'root'})
export class CaseResolverService implements Resolve<Case> {
    constructor(private store: Store<fromApp.AppState>, private actions$: Actions) {}
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Case> {
        let caseNum = '';
        if (route.params.id) {
            caseNum = route.params.id;
        }

        try {
            this.store.dispatch(new CaseListActions.SetSelectedCase(caseNum));
            this.store.dispatch(new CaseListActions.LoadSelectedCase());

            return this.actions$.pipe(
                take(1),
                ofType(CaseListActions.LOAD_SELECTED_CASE_SUCCESS, CaseListActions.LOAD_SELECTED_CASE_FAIL),
                switchMap((action: CaseListActions.LoadSelectedCaseSuccess | CaseListActions.LoadSelectedCaseFail) => {
                    if (action.payload instanceof Case) {
                        let caseObj: Case;
                        this.store.select(fromCaseList.getSelectedCaseObject).pipe(take(1)).subscribe(data => {
                            caseObj = new Case(data);
                        });
                        return of(caseObj);
                    } else {
                        const tcwError = new TcwError();
                        tcwError.errorMessageToLogFile = action.payload;
                        tcwError.friendlyErrorMessageToUser = 'Could not navigate to case ' + caseNum;
                        return throwError(tcwError);
                    }
                })
            );
        } catch (error) {
            const tcwError = new TcwError();
            tcwError.errorMessageToLogFile = error;
            tcwError.friendlyErrorMessageToUser = 'Could not navigate to case ' + caseNum;
            return throwError(tcwError);
        }

        // return this.store.select(fromCaseList.getSelectedCaseObject).pipe(
        //     take(1),
        //     switchMap(caseDetails => {
        //         return of(caseDetails);
        //         // if (!caseDetails || caseDetails.CASE_NUM != caseNum) {
        //         //     this.store.dispatch(new CaseDetailsActions.FetchCaseDetails(caseNum));

        //         //     return this.actions$.pipe(
        //         //         ofType(CaseDetailsActions.SET_CASE_DETAILS, CaseDetailsActions.SET_CASE_DETAILS_FAIL),
        //         //         take(1),
        //         //         switchMap((actn: CaseDetailsActions.SetCaseDetails | CaseDetailsActions.SetCaseDetailsFail) => {
        //         //             if (actn.payload instanceof Case) {
        //         //                 return of(actn.payload);
        //         //             }
        //         //             else {
        //         //                 throw new Error(actn.payload);
        //         //             }
        //         //         })
        //         //     );
        //         // }
        //         // else {
        //         //     return of(caseDetails);
        //         // }
        //     }),
        //     catchError(errorResponse => {
        //         const tcwError = new TcwError();
        //         tcwError.errorMessageToLogFile = errorResponse;
        //         tcwError.friendlyErrorMessageToUser = 'Could not navigate to case ' + caseNum;
        //         return throwError(tcwError);
        //     })
        // )
    }

}
