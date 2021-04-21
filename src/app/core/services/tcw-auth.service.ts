import { Injectable } from '@angular/core';
import { UserEnvironment } from '../../shared/models/user-environment.model';
import { TcwHttpService } from './tcw-http.service';
import { Observable } from 'rxjs';
import { TcwError } from 'src/app/shared/models/tcw-error';


@Injectable({
  providedIn: 'root'
})

export class TcwAuthService {

    constructor(private tcwHttpService: TcwHttpService) {
    }

    login(): Observable<UserEnvironment | TcwError> {
        return this.tcwHttpService.httpGet<UserEnvironment>('api/Auth/Login');
    }

    logout(): Observable<object> {
        return this.tcwHttpService.httpGet<object>('api/Auth/Logout');
    }
}
