import { Action } from '@ngrx/store';
import { Case } from '../../shared/models/case.model';

export const FETCH_CASE_DETAILS = '[Case] Fetch Case';
export const SET_CASE_DETAILS = '[Case] Set Case';
export const SET_CASE_DETAILS_FAIL = '[Case] Set Case Fail';


export class SetCaseDetails implements Action {
    readonly type = SET_CASE_DETAILS;
    constructor() {}
}

export class FetchCaseDetails implements Action {
    readonly type = FETCH_CASE_DETAILS;
    constructor(public payload: string) {}
}

export class SetCaseDetailsFail implements Action {
    readonly type = SET_CASE_DETAILS_FAIL;
    constructor(public payload: string) {}
}

export type CaseDetailsActions = FetchCaseDetails | SetCaseDetails | SetCaseDetailsFail;
