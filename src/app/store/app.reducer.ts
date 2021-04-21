// Any reducer will be injected in here and this will be a common location for all reducer

import { ActionReducerMap } from '@ngrx/store';
import * as fromCaseList from '../case-list/store/caselist.reducer';
import * as fromAuth from '../shared/auth/store/auth.reducer';
import * as fromNotes from 'src/app/case-toolbar/case-notes/store/case-notes.reducer'

export interface AppState {
    caseList: fromCaseList.CaseListState;
    authState: fromAuth.AuthState;
    notesState: fromNotes.CaseNotesState;
}

export const appReducer: ActionReducerMap<AppState> = {
    caseList: fromCaseList.caselistReducer,
    authState: fromAuth.authReducer,
    notesState: fromNotes.CaseNotesReducer
};
