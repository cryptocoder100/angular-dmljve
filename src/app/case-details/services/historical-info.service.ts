import { Injectable } from '@angular/core';
import { pipe, Observable, of } from 'rxjs';
import { take, switchMap, catchError } from 'rxjs/operators';
import { TcwHttpService } from 'src/app/core/services/tcw-http.service';
import { StringObject } from 'src/app/shared/models/string-object.model';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { Notes } from 'src/app/shared/models/notes.model';



@Injectable({
    providedIn: 'root'
})
export class HistoricalInfoService {

    constructor(private tcwHttpService: TcwHttpService) {
    }

    getHistoricalContactInfo(caseNum: string) : Observable<StringObject | TcwError> {
        return this.tcwHttpService.httpGet('api/HistoricalInfo/ContactInfo/' + caseNum);
    }

    getHistoricalNotes(caseNum: string, isCaseNotesEnabled: boolean, isPermanentNotesEnabled: boolean): Observable<Notes[] | TcwError> {
        if (!isCaseNotesEnabled && !isPermanentNotesEnabled) {
            return of([new Notes({IS_PUBLIC: 1, NOTE: 'Historical Case Notes are disabled.'}), new Notes({IS_PUBLIC: 2, NOTE: 'Historical Permanent Notes are disabled.'})]);
        }

        if (isCaseNotesEnabled && isPermanentNotesEnabled) {
            return this.tcwHttpService.httpGet('api/HistoricalInfo/Notes/' + caseNum);
        }

        if (isCaseNotesEnabled) {
            return this.tcwHttpService.httpGet('api/HistoricalInfo/Notes/' + caseNum + '/Case');
        } else {
            return this.tcwHttpService.httpGet('api/HistoricalInfo/Notes/' + caseNum + '/Permanent');
        }
    }
}
