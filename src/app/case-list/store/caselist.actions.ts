import { Action } from '@ngrx/store';
import { Case } from '../../shared/models/case.model';
import { Interaction } from 'src/app/shared/models/interaction.model';
import { Unit } from 'src/app/shared/models/unit.model';
import { CasePermNote } from 'src/app/shared/models/case-perm-note.model';

export const FETCH_CASE_LIST = '[Case List] Fetch Case List';
export const SET_CASE_LIST = '[Case List] Set Case List';
export const SET_CASE_LIST_FAIL = '[Case List] Set Case List Fail';
export const SET_REFRESH_FLAG = '[Case List] Set Case List Refresh Flag';
export const SET_SELECTED_CASE = '[Case List] Set Selected Case';
export const ADD_MULTISELECT_CASE = '[Case List] Add Multiselect Case';
export const REMOVE_MULTISELECT_CASE = '[Case List] Remove Multiselect Case';
export const CLEAR_SELECTED_CASES = '[Case List] Clear Selected Cases';
export const SET_ACTIVE_INTERACTION = '[Case List] Set Active Interaction';
export const CLEAR_ACTIVE_INTERACTION = '[Case List] Clear Active Interaction';
export const SCHEDULE_SELECTED_CASE = '[Case List] Schedule Case';
export const SCHEDULE_MULTISELECT_CASES = '[Case List] Schedule Multiselect Cases';
export const SCHEDULE_SELECTED_CASE_SUCCESS = '[Case List] Schedule Case Success';
export const SCHEDULE_MULTISELECT_CASES_SUCCESS = '[Case List] Schedule Multiselect Cases Success';
export const SCHEDULE_SELECTED_CASE_FAIL = '[Case List] Schedule Case Fail';
export const SCHEDULE_MULTISELECT_CASES_FAIL = '[Case List] Schedule Multiselect Cases Fail';
export const LOAD_SELECTED_CASE = '[Case List] Load Selected Case';
export const LOAD_SELECTED_CASE_SUCCESS = '[Case List] Load Selected Case Success';
export const LOAD_SELECTED_CASE_FAIL = '[Case List] Load Selected Case Fail';
export const UNLOAD_SELECTED_CASE = '[Case List] Unload Selected Case';
export const UNLOAD_SELECTED_CASE_COMPLETE = '[Case List] Unload Selected Case Complete';
export const SEND_VERIFY_EMAIL_SUCCESS = '[Case List] Send Verify Email Success';
export const SAVE_CASES = '[Case List] Save Cases';
export const SAVE_CASES_SUCCESS = '[Case List] Save Cases Success';
export const SAVE_CASES_FAIL = '[Case List] Save Cases Fail';
export const SAVE_NOTES_SUCCESS = '[Case List] Save Notes Success';
export const NO_ACTION = '[Case List] No Action';

export class SetCaseList implements Action {
    readonly type = SET_CASE_LIST;
    constructor(public payload: Case[]) {}
}

export class FetchCaseList implements Action {
    readonly type = FETCH_CASE_LIST;
    constructor(public payload: string) {}
}

export class SetCaseListFail implements Action {
    readonly type = SET_CASE_LIST_FAIL;
    constructor(public payload: string) {}
}

export class SetRefreshFlag implements Action {
    readonly type = SET_REFRESH_FLAG;
    constructor(public payload: boolean) {}
}

export class SetSelectedCase implements Action {
    readonly type = SET_SELECTED_CASE;
    constructor(public payload: string) {}
}

export class AddMultiSelectCase implements Action {
    readonly type = ADD_MULTISELECT_CASE;
    constructor(public payload: string) {}
}

export class RemoveMultiSelectCase implements Action {
    readonly type = REMOVE_MULTISELECT_CASE;
    constructor(public payload: string) {}
}

export class ClearSelectedCases implements Action {
    readonly type = CLEAR_SELECTED_CASES;
    constructor() {}
}

export class SetActiveInteraction implements Action {
    readonly type = SET_ACTIVE_INTERACTION;
    constructor(public payload: Interaction) {}
}

export class ClearActiveInteraction implements Action {
    readonly type = CLEAR_ACTIVE_INTERACTION;
    constructor() {}
}

export class ScheduleSelectedCase implements Action {
    readonly type = SCHEDULE_SELECTED_CASE;
    constructor(public payload: Date) {}
}

export class ScheduleMultiselectCases implements Action {
    readonly type = SCHEDULE_MULTISELECT_CASES;
    constructor(public payload: Date) {}
}

export class ScheduleSelectedCaseSuccess implements Action {
    readonly type = SCHEDULE_SELECTED_CASE_SUCCESS;
    constructor(public payload: Date) {}
}

export class ScheduleMultiselectCasesSuccess implements Action {
    readonly type = SCHEDULE_MULTISELECT_CASES_SUCCESS;
    constructor(public payload: Date) {}
}

export class ScheduleSelectedCaseFail implements Action {
    readonly type = SCHEDULE_SELECTED_CASE_FAIL;
    constructor(public payload: string) {}
}

export class ScheduleMultiselectCasesFail implements Action {
    readonly type = SCHEDULE_MULTISELECT_CASES_FAIL;
    constructor(public payload: string) {}
}

export class LoadSelectedCase implements Action {
    readonly type = LOAD_SELECTED_CASE;
    constructor() {}
}

export class LoadSelectedCaseSuccess implements Action {
    readonly type = LOAD_SELECTED_CASE_SUCCESS;
    constructor(public payload: Case) {}
}

export class LoadSelectedCaseFail implements Action {
    readonly type = LOAD_SELECTED_CASE_FAIL;
    constructor(public payload: string) {}
}

export class UnloadSelectedCase implements Action {
    readonly type = UNLOAD_SELECTED_CASE;
    constructor(public payload: boolean) {} //payload is if this is after Save
}

export class UnloadSelectedCaseComplete implements Action {
    readonly type = UNLOAD_SELECTED_CASE_COMPLETE;
    constructor(public payload: {afterSave: boolean, caseNum: string}) {}
}

export class SendVerifyEmailSuccess implements Action {
    readonly type = SEND_VERIFY_EMAIL_SUCCESS;
    constructor(public payload: { isPrimary: boolean, emailAddress: string }) {}
}

export class SaveCases implements Action {
  readonly type = SAVE_CASES;
  constructor(public payload: {casesToSave: Case[], unitsToSave: Unit[], microdataToSave: any[], auditCaseNum: string, closeOnSuccess: boolean, isCompleteAddressRefinement: boolean, isCompleteEnrollment: boolean, isNrpComplete: boolean, currentSelectedUnitId: string}) {}
}

export class SaveCasesSuccess implements Action {
  readonly type = SAVE_CASES_SUCCESS;
  constructor(public payload: { casesSaved: Case[], closeOnSuccess: boolean, currentSelectedUnitId: string }) {}
}

export class SaveCasesFail implements Action {
    readonly type = SAVE_CASES_FAIL;
    constructor(public payload: string) {}
}

export class SaveNotesSuccess implements Action {
    readonly type = SAVE_NOTES_SUCCESS;
    constructor(public payload: CasePermNote) {}
}

export class NoAction implements Action {
    readonly type = NO_ACTION;
    constructor() {}
}

export type CaseListActions = SetCaseList | FetchCaseList | SetCaseListFail | SetRefreshFlag | SetSelectedCase |
AddMultiSelectCase | RemoveMultiSelectCase | ClearSelectedCases | SetActiveInteraction | ClearActiveInteraction |
ScheduleSelectedCase | ScheduleMultiselectCases | ScheduleSelectedCaseSuccess | ScheduleMultiselectCasesSuccess |
ScheduleSelectedCaseFail | ScheduleMultiselectCasesFail | LoadSelectedCase | LoadSelectedCaseSuccess | LoadSelectedCaseFail |
UnloadSelectedCase | UnloadSelectedCaseComplete | SendVerifyEmailSuccess | SaveCases | SaveCasesSuccess | SaveCasesFail |
SaveNotesSuccess | NoAction;
