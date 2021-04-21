import { Inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpParams } from '@angular/common/http';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as AuthActions from '../../shared/auth/store/auth.actions';
import { UserEnvironment } from '../../shared/models/user-environment.model';
import { Subscription } from 'rxjs';

@Injectable()
export class TcwInterceptorService implements HttpInterceptor {

  public storeSub: Subscription;
  public userEnvironment: UserEnvironment;

  // WITH_CREDENTIALS is set at the beginning, in main.ts.  It pulls this value from the appropriate environment.(envName).ts
  constructor(@Inject('WITH_CREDENTIALS') private withCredentials: boolean, private store: Store<fromApp.AppState>) {
    this.storeSub = this.store.select('authState').subscribe(result => {
      this.userEnvironment = result.userEnvironment;
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const modifiedRequest = req.clone({
      // Pass JWT token with each request
      // TODO:  Replace call to auth service with ngRx
      headers: req.headers.append('UserToken', this.userEnvironment.currentUser.userToken),

      // NEED "withCredentials = true" FOR DEV, in order to successfully run Angular locally, but connect to remote API
      // Also needed to adjust Authentication and Authorization in IIS on our DEV site to get CORS to work
      withCredentials: this.withCredentials
    });

    return next.handle(modifiedRequest);
  }
}
