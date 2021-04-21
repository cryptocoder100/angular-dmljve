import { UserEnvironment } from '../../models/user-environment.model';
import * as AuthActions from './auth.actions';
import { CurrentUser } from '../../models/current-user.model';
import { Functions } from '../../models/functions.model';
import { EnvironmentVariable } from '../../models/environment-variable.model';
import { EnvironmentDetails } from '../../models/environment-details.model';
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const authKey = 'authState';

export interface AuthState {
    userEnvironment: UserEnvironment;
    isLoggingIn: boolean;
    hasPreviousLogin: boolean;
    isLoginFailed: boolean;
    isLoggedIn: boolean;
    hasUserLoggedOut: boolean;
    isAdmin: boolean;
}

const initialState: AuthState = {
    userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]), new EnvironmentDetails('', '', '', '', [], false, [])),
    isLoggingIn: false,
    hasPreviousLogin: false,
    isLoginFailed: false,
    isLoggedIn: false,
    hasUserLoggedOut: false,
    isAdmin: false
};

export const getAuthState = createFeatureSelector<AuthState>(authKey);

export const getUserEnvironment = createSelector(getAuthState, authState => {
    return authState.userEnvironment;
});


export function authReducer(state = initialState, action: AuthActions.AuthActions) {
    switch (action.type) {
        case AuthActions.LOGIN_START:
            return {
                ...state,
                userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]), new EnvironmentDetails('', '', '', '', [], false, [])),
                isLoggingIn: true,
                hasPreviousLogin: false,
                isLoginFailed: false,
                isLoggedIn: false,
                hasUserLoggedOut: false,
                isAdmin: false
            };
        case AuthActions.LOGIN_DUPLICATED:
            return {
                ...state,
                userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]), new EnvironmentDetails('', '', '', '', [], false, [])),
                isLoggingIn: false,
                hasPreviousLogin: true,
                isLoginFailed: false,
                isLoggedIn: false,
                hasUserLoggedOut: false,
                isAdmin: false
            };
        case AuthActions.LOGIN_ERROR:
            return {
                ...state,
                userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]), new EnvironmentDetails('', '', '', '', [], false, [])),
                isLoggingIn: false,
                hasPreviousLogin: true,
                isLoginFailed: true,
                isLoggedIn: false,
                hasUserLoggedOut: false,
                isAdmin: false
            };
        case AuthActions.LOGIN_COMPLETE:
            return {
                ...state,
                userEnvironment: action.payload,
                isLoggingIn: false,
                hasPreviousLogin: false,
                isLoginFailed: false,
                isLoggedIn: true,
                hasUserLoggedOut: false,
                isAdmin: action.payload.currentUser.userRoleArray.includes('Manager') || action.payload.currentUser.userRoleArray.includes('Administrator')
            };
        case AuthActions.LOGOUT_START:
            return {
                ...state,
                userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]),
                                                                                                              new EnvironmentDetails('', '', '', '', [], false, [])),
                isLoggingIn: false,
                hasPreviousLogin: false,
                isLoginFailed: false,
                isLoggedIn: false,
                hasUserLoggedOut: true,
                isAdmin: false
            };
        case AuthActions.LOGOUT_COMPLETE:
            return {
                ...state,
                userEnvironment: new UserEnvironment(new CurrentUser('NONE', '', false, '', '', '', '', 999, [], [new Functions('', 0, 0, false, '', false, '', [])]), new EnvironmentDetails('', '', '', '', [], false, [])),
                isLoggingIn: false,
                hasPreviousLogin: false,
                isLoginFailed: false,
                isLoggedIn: false,
                hasUserLoggedOut: true,
                isAdmin: false
            };
        default:
            return state;
    }
}
