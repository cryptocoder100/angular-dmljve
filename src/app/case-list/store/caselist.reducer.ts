import { Case } from '../../shared/models/case.model';
import * as CaseListActions from './caselist.actions';
import { Interaction } from 'src/app/shared/models/interaction.model';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CasePermNote } from 'src/app/shared/models/case-perm-note.model';

export const caseListKey = 'caseList';

export interface CaseListState {
    caseList: Case[];
    userId: string;
    error: string;
    lastRefresh: Date;
    refreshed: boolean;
    isLoading: boolean;
    selectedCaseNum: string;
    selectedCaseNumList: string[];
    interaction: Interaction;
    selectedCaseOpen: boolean;
    selectedCaseNumNotFromList: boolean;
}

const initialState: CaseListState = {
    caseList: [],
    userId: '',
    error: null,
    lastRefresh: null,
    refreshed: false,
    isLoading: false,
    selectedCaseNum: '',
    selectedCaseNumList: [],
    interaction: null,
    selectedCaseOpen: false,
    selectedCaseNumNotFromList: false
};

export const getCaseListState = createFeatureSelector<CaseListState>(caseListKey);

export const getCaseList = createSelector(getCaseListState, caseListState => {
    return caseListState.caseList;
});

export const getSelectedCaseObject = createSelector(getCaseListState, caseListState => {
    return caseListState.caseList.find(caseObj => caseObj.CASE_NUM === caseListState.selectedCaseNum);
});

export const getSelectedCaseObjectList = createSelector(getCaseListState, caseListState => {
    return caseListState.caseList.filter(caseObj => caseListState.selectedCaseNumList.includes(caseObj.CASE_NUM));
});

export const getSelectedCaseNum = createSelector(getCaseListState, caseListState => {
    return caseListState.selectedCaseNum;
});

export const getSelectedCaseNumList = createSelector(getCaseListState, caseListState => {
    return caseListState.selectedCaseNumList;
});

export const getInteraction = createSelector(getCaseListState, caseListState => {
    return caseListState.interaction;
});

export const getSelectedCaseOpen = createSelector(getCaseListState, caseListState => {
    return caseListState.selectedCaseOpen;
});


export function caselistReducer(state = initialState, action: CaseListActions.CaseListActions) {

    let updatedCaseList: Case[] = [];
    switch (action.type) {
        case CaseListActions.SET_CASE_LIST:
            return {
                ...state,
                caseList: action.payload,
                error: null,
                lastRefresh: new Date(),
                refreshed: true,
                isLoading: false
            };
        case CaseListActions.FETCH_CASE_LIST:
            return {
                ...state,
                userId: action.payload,
                isLoading: true
            };
        case CaseListActions.SET_CASE_LIST_FAIL:
            return {
                ...state,
                caseList: [],
                error: action.payload,
                lastRefresh: null,
                refreshed: false
            };
        case CaseListActions.SET_REFRESH_FLAG:
            return {
                ...state,
                refreshed: action.payload
            };
        case CaseListActions.SET_SELECTED_CASE:
            return {
                ...state,
                selectedCaseNum: action.payload,
                selectedCaseNumList: []
            };
        case CaseListActions.ADD_MULTISELECT_CASE:
            return {
                ...state,
                selectedCaseNum: '',
                selectedCaseNumList: state.selectedCaseNumList.concat(action.payload)
            };
        case CaseListActions.REMOVE_MULTISELECT_CASE:
            return {
                ...state,
                selectedCaseNum: '',
                selectedCaseNumList: state.selectedCaseNumList.filter(cs => cs != action.payload)
            };
        case CaseListActions.CLEAR_SELECTED_CASES:
            return {
                ...state,
                selectedCaseNum: '',
                selectedCaseNumList: []
            };
        case CaseListActions.SET_ACTIVE_INTERACTION:
            return {
                ...state,
                interaction: action.payload
            };
        case CaseListActions.CLEAR_ACTIVE_INTERACTION:
            return {
                ...state,
                interaction: null
            };
        case CaseListActions.SCHEDULE_SELECTED_CASE:
            return {
                ...state
            };
        case CaseListActions.SCHEDULE_MULTISELECT_CASES:
            return {
                ...state
            };
        case CaseListActions.SCHEDULE_SELECTED_CASE_SUCCESS:
            updatedCaseList = [];
            state.caseList.forEach(cs => {
                const csObj: Case = new Case(cs);
                if (csObj.CASE_NUM == state.selectedCaseNum) {
                    csObj.SCHED_DATE_TIME = action.payload;
                }
                updatedCaseList.push(csObj);
            });
            return {
                ...state,
                caseList: updatedCaseList
            };
        case CaseListActions.SCHEDULE_MULTISELECT_CASES_SUCCESS:
            updatedCaseList = [];
            state.caseList.forEach(cs => {
                const csObj: Case = new Case(cs);
                if (state.selectedCaseNumList.includes(csObj.CASE_NUM)) {
                    csObj.SCHED_DATE_TIME = action.payload;
                }
                updatedCaseList.push(csObj);
            });
            return {
                ...state,
                caseList: updatedCaseList
            };
        case CaseListActions.SCHEDULE_SELECTED_CASE_FAIL:
            return {
                ...state,
                error: action.payload
            };
        case CaseListActions.SCHEDULE_MULTISELECT_CASES_FAIL:
            return {
                ...state,
                error: action.payload
            };
        case CaseListActions.LOAD_SELECTED_CASE:
            return {
                ...state
            };
        case CaseListActions.LOAD_SELECTED_CASE_SUCCESS:
            const caseListObj: Case[] = [];

            state.caseList.forEach(cs => {
                caseListObj.push(cs);
            });

            // let selectedCase: Case = caseListObj.find(caseObj => caseObj.CASE_NUM == state.selectedCaseNum);
            let foundCase = false;

            const selectedCaseIndex: number = caseListObj.findIndex(caseObj => caseObj.CASE_NUM == state.selectedCaseNum);

            if (selectedCaseIndex >= 0) {
                caseListObj[selectedCaseIndex] = action.payload;
                foundCase = true;
            } else {
                caseListObj.push(action.payload);
            }

            return {
                ...state,
                selectedCaseOpen: true,
                selectedCaseNumNotFromList: !foundCase,
                caseList: caseListObj
            };
        case CaseListActions.LOAD_SELECTED_CASE_FAIL:
            return {
                ...state,
                error: action.payload
            };
        case CaseListActions.UNLOAD_SELECTED_CASE:
            return state;
        case CaseListActions.UNLOAD_SELECTED_CASE_COMPLETE:
            if (state.selectedCaseNumNotFromList) {
                const trimmedCaseList: Case[] = [];

                state.caseList.forEach(cs => {
                    trimmedCaseList.push(cs);
                });

                trimmedCaseList.pop();

                return {
                    ...state,
                    caseList: trimmedCaseList,
                    selectedCaseNum: '',
                    selectedCaseOpen: false,
                    selectedCaseNumNotFromList: false
                };
            } else {
                return {
                    ...state,
                    selectedCaseNum: '',
                    selectedCaseOpen: false
                };
            }
        case CaseListActions.SEND_VERIFY_EMAIL_SUCCESS:
            updatedCaseList = [];
            state.caseList.forEach(cs => {
                const csObj: Case = new Case(cs);
                if (csObj.CASE_NUM == state.selectedCaseNum) {
                    if (action.payload.isPrimary) {
                        csObj.EMAIL_ADDRESS = action.payload.emailAddress;
                        csObj.EMAIL_SENT_DATE = new Date();
                    }
                    else {
                        csObj.SEC_EMAIL_ADDR = action.payload.emailAddress;
                        csObj.SEC_EMAIL_SENT_DATE = new Date();
                    }
                }
                updatedCaseList.push(csObj);
            });
            return {
                ...state,
                caseList: updatedCaseList
            };
        case CaseListActions.SAVE_CASES:
            return {
                ...state
            };
        case CaseListActions.SAVE_CASES_SUCCESS:
            updatedCaseList = [];
            state.caseList.forEach(cs => {
                let csObj: Case = new Case(cs);
                let savedCase = action.payload.casesSaved.find(c => c.CASE_NUM === csObj.CASE_NUM);
                if (savedCase) {
                    csObj = new Case(savedCase);
                }
                updatedCaseList.push(csObj);
            });
            return {
                ...state,
                caseList: updatedCaseList
            };
        case CaseListActions.SAVE_CASES_FAIL:
            return {
                ...state,
                error: action.payload
            };
        case CaseListActions.SAVE_NOTES_SUCCESS:
            updatedCaseList = [];
            state.caseList.forEach(cs => {
                const csObj: Case = new Case(cs);
                if (csObj.CASE_NUM == state.selectedCaseNum) {
                    csObj.CASE_PERM_NOTE = new CasePermNote(action.payload);
                }
                updatedCaseList.push(csObj);
            });
            return {
                ...state,
                caseList: updatedCaseList
            };
        case CaseListActions.NO_ACTION:
            return state;
        default:
            return state;
    }
}
