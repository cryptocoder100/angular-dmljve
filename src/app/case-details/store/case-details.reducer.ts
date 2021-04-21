import { Case } from '../../shared/models/case.model';
import * as CaseDetailsActions from './case-details.actions';
import * as fromRoot from '../../store/app.reducer';
import { createFeatureSelector, createSelector } from '@ngrx/store';

export interface State extends fromRoot.AppState {
    caseDetails: CaseDetailState;
}

export interface CaseDetailState {
    error: string;
    isLoading: boolean;
}

const initialState: CaseDetailState = {
    error: null,
    isLoading: false
};

const getCaseDetailsState = createFeatureSelector<CaseDetailState>('case-details');

export function caseDetailsReducer(state = initialState, action: CaseDetailsActions.CaseDetailsActions) {

    switch (action.type) {
        case CaseDetailsActions.SET_CASE_DETAILS:
            return {
                ...state,
                error: null,
                isLoading: false
            };
        case CaseDetailsActions.FETCH_CASE_DETAILS:
            return {
                ...state,
                isLoading: true
            };
        case CaseDetailsActions.SET_CASE_DETAILS_FAIL:
            return {
                ...state,
                error: action.payload
            };
        default:
            return state;
    }
}
