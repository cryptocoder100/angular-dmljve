import { Injectable, ErrorHandler } from '@angular/core';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { TcwLoggerService } from './tcw-logger.service';
import { TcwHttpService } from './tcw-http.service';
import { StringObject } from '../../shared/models/string-object.model';
import { UIConfigService } from './uiconfig.service';

/*
Author: Prasad
Purpose: Centralized Error Handler for Application wide error
Description: This is an Angular Service that is injected to the root app-module
              using providers array and recipe/token syntax. This service implements
              the angular's Errorhandler and etends and customizes for TCW. This serivce
              has the ability to catch any error thrown in any part of the application.
              When an error occurs in teh application, the service will kick in and pexecute
              the code. So this is a centralized error handling mechanism

Usage :       Put your error handler code here. Eg: Logging errors, or pre-processing those errors
              before logging. Currently it logs to console.
*/


@Injectable()
export class TcwErrorHandlerService implements ErrorHandler {

  constructor(private tcwLoggerService: TcwLoggerService,
              private uiConfigService: UIConfigService) { }

  handleError(error: any): void {
    console.error(error);

    // if its not of type TcwError then create the universal error type for tcw
    let effectiveError: any;
    let customError: TcwError = new TcwError();

    // Prasad - 12/04/2019
    // if anywhere in teh application, the error raised is already of type TcwError then,
    // just show the error message on teh scrren.Because its an assumption taht TcwError wrapper would always
    // have a friendly error message and will not expose code level details.


    if (error.rejection) {
      effectiveError = error.rejection;
    } else {
      effectiveError = error;
    }

    if (!(effectiveError instanceof TcwError)) {
      customError.customErrorNumber = 200;
      if (effectiveError instanceof Error) {
        customError.errorMessageToLogFile = (error as Error).message;
      }
      // if (effectiveError instanceof ExpressionChangedAfterItHasBeenCheckedError) {
      //   customError.errorMessageToLogFile = (error as Error).message;
      // }

      customError.friendlyErrorMessageToUser = 'An error occurred. Please check your data and try again.';
    } else {
      customError = effectiveError;
    }

    this.uiConfigService.SetErrorDialogMessage(customError.friendlyErrorMessageToUser);
    console.error(customError);

    // Added by Len 2019-11-18 - Write to log and then send request to server to write user's full log to network location
    this.tcwLoggerService.error(customError.errorMessageToLogFile);
    // END Added by Len 2019-11-18

    // throw new Error('Process this message');
  }

}
