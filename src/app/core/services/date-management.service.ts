import { Injectable } from '@angular/core';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export default class DateManagementService {

  constructor() { }

  static timezoneMapping(tz: string): string {
    if (tz === 'US/Atlantic') {
      return 'America/Puerto_Rico';
    } else if (tz === 'US/Pacific +4') {
      return 'Pacific/Majuro';
    } else if (tz === 'US/Pacific +7') {
      return 'Pacific/Palau';
 } else if (tz === 'US/none') {
      return '';
    } else if (tz.trim() === '') {
      return '';
    } else {
      return tz;
    }
  }

  static getZoneTimeFromLocal(inputDate: Date, timeZoneId: string): string {

    if (inputDate == null || timeZoneId == null) {
      return '';
    }

    if (!moment(inputDate, 'YYYY-MM-DDTHH:mm:ss', true).isValid()) {
      return '';
    }

    const momentObject = moment(inputDate);
    if (momentObject == null) {
      return '';
    }
    const timezone = this.timezoneMapping(timeZoneId);
    if (timezone === null) { return ''; }
    const momentTzObject = momentObject.tz(this.timezoneMapping(timeZoneId));
    if (momentTzObject == null) {
      return '';
    }

    return momentTzObject.format('YYYY-MM-DDTHH:mm:ss');
  }
}
