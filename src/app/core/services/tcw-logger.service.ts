import { Injectable } from '@angular/core';
import { LogLevel } from 'src/app/shared/models/log-level.enum';
import { StringObject } from 'src/app/shared/models/string-object.model';
import { TcwHttpService } from './tcw-http.service';


/*
Author: Prasad
Purpose: Centralized Logging service for Application wide error/info/warming etc,
Description: This is an Angular Service that is injected to the root app-module
              This service implements the logging mechanism for tcw.
Usage :       Logging errors. Currently it logs to console.
*/

@Injectable({
  providedIn: 'root'
})
export class TcwLoggerService {
  // Added by Len 2019-11-18:  This will store a full record of every log message we have written
  fullLog = '';
  // END Added by Len 2019-11-18

  // tslint:disable-next-line: no-use-before-declare
  level: LogLevel = LogLevel.All;
  // boolean property to log with date or without
  logWithDate = true;

  constructor(private tcwHttpService: TcwHttpService) { }

  // function to configure if the log must happen
  private shouldLog(level: LogLevel): boolean {
     // create a return variable
    let IsLoggable = false;

    // if the log level is off first
    if (level !== LogLevel.Off && level >= this.level) {
      IsLoggable = true;
    }
    return IsLoggable;
  }




  // Function to write teh msg to log - where to write can be
  // configured with json config file
  private writeToLog(msg: string, level: LogLevel) {
    let msgToLog = '';

    if (this.shouldLog(level)) {
      if (this.logWithDate) {
        msgToLog = new Date() + ' - ';
      }
      msgToLog += 'Type - ' + LogLevel[level];
      msgToLog += ' - Message: ' + JSON.stringify(msg);
    }

    // Added by Len 2019-11-18
    if (msgToLog.length > 0) {

      if (level === LogLevel.Warn) {
        console.warn(msgToLog);
      } else if (level === LogLevel.Fatal) {
        console.error(msgToLog);
      } else if (level === LogLevel.Debug) {
        console.debug(msgToLog);
      } else if (level === LogLevel.Error) {
        console.error(msgToLog);
      } else if (level === LogLevel.Info) {
        console.info(msgToLog);
      } else {
        console.log(msgToLog);
      }


      // Add to history of all log messages we have written
      this.fullLog = this.fullLog + '\r\n' + msgToLog;
      // // Added by Len 2019-11-18 - Write to log and then send request to server to write user's full log to network location
      if (level === LogLevel.Error) {
        this.tcwHttpService.httpPostSimple('api/Log', new StringObject(this.fullLog)).subscribe(() => {
        });
        this.fullLog = '';
      }
      
      // // END Added by Len 2019-11-18

    }
    // END Added by Len 2019-11-18
  }

  // Added by Len 2019-11-18
  log(msg: any) {
    this.writeToLog(msg, LogLevel.All);
  }

  info(msg: any) {
    this.writeToLog(msg, LogLevel.Info);
  }

  debug(msg: any) {
    this.writeToLog(msg, LogLevel.Debug);
  }

  warn(msg: any) {
    this.writeToLog(msg, LogLevel.Warn);
  }

  error(msg: any) {
    this.writeToLog(msg, LogLevel.Error);
  }

  fatal(msg: any) {
    this.writeToLog(msg, LogLevel.Fatal);
  }
  // END Added by Len 2019-11-18
}
