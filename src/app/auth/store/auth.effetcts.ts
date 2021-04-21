import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { TcwAuthService } from '../../../core/services/tcw-auth.service';

import * as AuthActions from './auth.actions';
import { UserEnvironment } from '../../models/user-environment.model';
import { TcwError } from '../../models/tcw-error';

@Injectable()
export class AuthEffects {

    @Effect()
    authLogin = this.actions$.pipe(
        ofType(AuthActions.LOGIN_START),
        switchMap((authData: AuthActions.LoginStart) => {
            return this.tcwAuthService.login()
            .pipe(
                map((resData: UserEnvironment) => {
                    if (resData.currentUser.hasPreviousLogin) {
                        return new AuthActions.LoginDuplicated();
                    }
                    return new AuthActions.LoginComplete(resData);
                }),
                catchError((error: TcwError) => {
                    return of(new AuthActions.LoginError());
                })
            );
        })
    );

    @Effect({dispatch: false})
    authSuccess = this.actions$.pipe(
        ofType(AuthActions.LOGIN_COMPLETE),
        tap(() => {
            this.router.navigate(['/case-list']);
        })
    );

    @Effect()
    authLogoutStart = this.actions$.pipe(
        ofType(AuthActions.LOGOUT_START),
        switchMap((authData: AuthActions.LogoutStart) => {
            return this.tcwAuthService.logout()
            .pipe(
                map(resData => {
                    return new AuthActions.LogoutComplete();
                }),
                catchError(error => {
                    return of(new AuthActions.LogoutComplete());
                })
            );
        })
    );

    @Effect({dispatch: false})
    authLogoutComplete = this.actions$.pipe(
        ofType(AuthActions.LOGOUT_COMPLETE),
        tap(() => {
            this.router.navigate(['/']).then(() => {
                window.location.reload();
            });
        })
    );

    constructor(private actions$: Actions, private tcwAuthService: TcwAuthService, private router: Router) {

    }
}
