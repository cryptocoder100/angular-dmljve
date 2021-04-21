import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Case } from '../../shared/models/case.model';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { take, switchMap, map, catchError } from 'rxjs/operators';
import * as fromApp from '../../store/app.reducer';
import * as CaseListActions from '../store/caselist.actions';
import * as fromCaseList from '../store/caselist.reducer';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { of } from 'rxjs';
import { ofType, Actions } from '@ngrx/effects';


@Injectable({providedIn: 'root'})
export class CaseListResolverService implements Resolve<Case[]> {
    constructor(private store: Store<fromApp.AppState>, private actions$: Actions) {}
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let userId = '';

        this.store.select(fromAuth.getAuthState).pipe(take(1)).subscribe(authState => {
            userId = authState.userEnvironment.currentUser.userId;
        });

        if (route.params.userId) {
            userId = route.params.userId;
        }

        return this.store.select(fromCaseList.getCaseListState).pipe(
            take(1),
            switchMap(caseListState => {
                if (caseListState.caseList.length === 0 || caseListState.userId != userId) {
                    this.store.dispatch(new CaseListActions.FetchCaseList(userId));
                    return this.actions$.pipe(
                        ofType(CaseListActions.SET_CASE_LIST),
                        take(1),
                        switchMap((actn: CaseListActions.SetCaseList) => {
                            return of(actn.payload);
                        })
                    );
                } else {
                    return of(caseListState.caseList);
                }
            }),
            catchError(errorResponse => {
                return of(errorResponse);
            })

        );
    }

}
