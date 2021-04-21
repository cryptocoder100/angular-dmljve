import { Action } from '@ngrx/store';
import { UserEnvironment } from '../../models/user-environment.model';

export const LOGIN_START = '[Auth] LOGIN_START';
export const LOGIN_DUPLICATED = '[Auth] LOGIN_DUPLICATED';
export const LOGIN_ERROR = '[Auth] LOGIN_ERROR';
export const LOGIN_COMPLETE = '[Auth] LOGIN_COMPLETE';
export const LOGOUT_START = '[Auth] LOGOUT_START';
export const LOGOUT_COMPLETE = '[Auth] LOGOUT_COMPLETE';

export class LoginStart implements Action {
    readonly type = LOGIN_START;
    payload: null;
}

export class LoginDuplicated implements Action {
    readonly type = LOGIN_DUPLICATED;
    payload: null;
}

export class LoginError implements Action {
    readonly type = LOGIN_ERROR;
    payload: null;
}

export class LoginComplete implements Action {
    readonly type = LOGIN_COMPLETE;

    constructor(public payload: UserEnvironment) {
    }
}

export class LogoutStart implements Action {
    readonly type = LOGOUT_START;
    payload: null;
}

export class LogoutComplete implements Action {
    readonly type = LOGOUT_COMPLETE;
    payload: null;
}

export type AuthActions = LoginStart | LoginDuplicated | LoginError | LoginComplete | LogoutStart | LogoutComplete;
