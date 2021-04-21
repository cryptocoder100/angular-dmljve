import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TcwHttpService } from './tcw-http.service';
import { Observable } from 'rxjs';
import { TcwError } from 'src/app/shared/models/tcw-error';
import { Constants } from '../../shared/models/constants.model';

@Injectable({
  providedIn: 'root'
})

export class TcwConstantsService {

    constants: Constants;

    constructor(private tcwHttpService: TcwHttpService) {
    }

    getConstants(): Observable<Constants | TcwError> {
        if (!this.constants) {
            return this.tcwHttpService.httpGet<Constants>('api/Constants').pipe(tap((data: Constants) => {
                this.constants = data;
            }));
        } else {
            return of(this.constants);
        }
    }

}
