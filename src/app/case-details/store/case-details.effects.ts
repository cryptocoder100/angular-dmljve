import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError, tap, take } from 'rxjs/operators';
import * as fromApp from '../../store/app.reducer';
import * as CaseDetailsActions from './case-details.actions';
import { of, observable } from 'rxjs';
import { TcwHttpService } from '../../core/services/tcw-http.service';
import { Case } from '../../shared/models/case.model';
import { CaseDetailsService } from '../services/case-details.service';
import { TcwError } from '../../shared/models/tcw-error';

@Injectable()
export class CaseDetailsEffects {

    constructor(private actions$: Actions, private http: HttpClient,
                private tcwHttpService: TcwHttpService, private store: Store<fromApp.AppState>) { }

        // @Effect()
        // fetchCase = this.actions$
        //     .pipe(
        //     ofType(CaseDetailsActions.FETCH_CASE_DETAILS),
        //     switchMap((action: CaseDetailsActions.FetchCaseDetails) => {
        //         const caseNum = action.payload;

        //          // TODO: uncomment this when server is ready

        //         return this.tcwHttpService.httpGet<Case>('api/Cases/' + caseNum)
        //         .pipe(
        //             map((caseObj: Case) => {
        //                 return new CaseDetailsActions.SetCaseDetails(new Case(caseObj));
        //             }),
        //             catchError((errorResponse: TcwError) => {
        //                 return of(new CaseDetailsActions.SetCaseDetailsFail(errorResponse.friendlyErrorMessageToUser));
        //             })
        //         );

        //          // mocking case object - http is failing 500 server error
        //         // const caseDetails = new Case({});
        //         // caseDetails.CON_FIRST = 'FIRST020307206 ';
        //         // caseDetails.CON_LAST = 'LAST020307206';
        //         // caseDetails.CASE_NUM = '020307206';
        //         // caseDetails.CON_TITLE = 'Owner';
        //         // caseDetails.PHONE_NUM = '202-645-6367';
        //         // caseDetails.CON_FIRM = 'TESTFIRM201153653';
        //         // caseDetails.REPT_MODE = 'C';
        //         // caseDetails.EMAIL_ADDRESS = 'test@etest.com';
        //         // caseDetails.CITY = 'Anchorage';
        //         // caseDetails.STATE = 'AK';
        //         // caseDetails.USER_ALLOC = 'RAJAGOPAL_P';
        //         // caseDetails.SCHED_DATE_TIME = new Date();
        //         // const caseDetails$ = of(caseDetails);
        //         // console.log(caseDetails);
        //         // return caseDetails$
        //         //   .pipe(
        //         //     map((caseObj: Case) => {
        //         //         return new CaseDetailsActions.SetCaseDetails(new Case(caseObj));
        //         //     }),
        //         //     catchError((errorResponse: TcwError) => {
        //         //       console.log('error in effetcs');
        //         //       return of(new CaseDetailsActions.SetCaseDetailsFail(errorResponse.friendlyErrorMessageToUser));
        //         //     })
        //         // );


        //     })
        // );
    }
