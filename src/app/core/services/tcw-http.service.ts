import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { StringObject } from '../../shared/models/string-object.model';
import { TcwLoggerService } from './tcw-logger.service';
import { TcwError } from 'src/app/shared/models/tcw-error';

@Injectable({
  providedIn: 'root'
})
export class TcwHttpService {

  // BASE_URL is set at the beginning, in main.ts.  It pulls this value from the appropriate environment.(envName).ts
  constructor(private httpClient: HttpClient,
    @Inject('BASE_URL') private baseUrl: string) {

  }

  // this handles any network level errors

  private handleHttpError(error: any): Observable<TcwError> {
    // Prasad - 12/03
    // A http realted error happened
    // Frist capture all error info that are  important and log this error in a centralized location
    const tcwError = new TcwError();
    tcwError.customErrorNumber = error.status;
    tcwError.errorMessageToLogFile = error.message;
    if (error.url.indexOf('AutoDialer') !== -1 || error.url.indexOf('DccTransfer') !== -1
      || error.url.indexOf('Filter') !== -1 || error.url.indexOf('Rearrange') !== -1 || error.url.indexOf('SetNewMonth') !== -1) {
      tcwError.friendlyErrorMessageToUser = error.error;
    } else if (error.url.indexOf('/Cases/Search') !== -1) {
      // added on 11/10/2020 because of the time out issues on search with phone / fax number in Find reporter
      tcwError.friendlyErrorMessageToUser = 'Your search criteria might have caused a system time out. Please, try narrowing your search or check your network.';
    } else {
      tcwError.friendlyErrorMessageToUser = 'Network or Server level error. Please check your data and try again.';
    }

    tcwError.httpErrorUrl = error.url;
    tcwError.httpStatusNumber = error.status;
    tcwError.isHttpActionSuccessful = error.ok;


    const errorMessage = `Error Code on ${tcwError.httpErrorUrl}:
                                          ${tcwError.httpStatusNumber}: Message=
                                          ${tcwError.errorMessageToLogFile}`;

    return throwError(tcwError);
  }



  httpGet<T>(apiPath: string, params?: HttpParams): Observable<T | TcwError> {

    return this.httpClient.get<T>(this.baseUrl + apiPath, { params  })
      .pipe(
        retry(3),
        catchError(err => this.handleHttpError(err))
      );
  }

  httpPost<T>(apiPath: string, postData: object, params?: HttpParams): Observable<T | TcwError> {
    return this.httpClient.post<T>(this.baseUrl + apiPath, postData, { params })
      .pipe(
        catchError(err => this.handleHttpError(err))
      );
  }

  httpDelete<T>(apiPath: string, params?: HttpParams): Observable<T | TcwError> {
    return this.httpClient.delete<T>(this.baseUrl + apiPath, { params })
      .pipe(
        catchError(err => this.handleHttpError(err))
      );
  }

  // Added by Len 2019-11-18 - Post without catchError.  Catch Error calls this, and if this called catch error, infinite loop would occur
  // This will probably only be used for sending errors from client to server
  httpPostSimple<T>(apiPath: string, postData: object, params?: HttpParams): Observable<T> {
    return this.httpClient.post<T>(this.baseUrl + apiPath, postData, { params });
  }


  // END Added by Len 2019-11-18
}
