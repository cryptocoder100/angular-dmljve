import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as AuthActions from './store/auth.actions';
import * as AuthReducer from './store/auth.reducer';
import { Subscription } from 'rxjs';
import { UIConfigService } from 'src/app/core/services/uiconfig.service';

@Component({
  selector: 'fsms-tcw-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('acceptButton', { static: false }) acceptButton;

  storeSub: Subscription;
  isLoggingIn = false;
  isLoggedIn = false;
  hasPreviousLogin = false;
  isLoginFailed = false;
  hasUserLoggedOut = false;
  termsAccepted = false;
  bannerMessage: string = '';

  constructor(private store: Store<fromApp.AppState>, private uiConfigService: UIConfigService) {
  }



  ngAfterViewInit() {
    if (!this.termsAccepted) {
      this.acceptButton.nativeElement.focus();
    }
  }

  acceptTerms() {
    this.termsAccepted = true;
    this.doLogin();
  }

  ngOnInit() {
    this.storeSub = this.store.select(AuthReducer.getAuthState).subscribe(result => {
      this.isLoggingIn = result.isLoggingIn;
      this.hasPreviousLogin = result.hasPreviousLogin;
      this.isLoginFailed = result.isLoginFailed;
      this.isLoggedIn = result.isLoggedIn;
      this.hasUserLoggedOut = result.hasUserLoggedOut;
      if (result.userEnvironment.environmentDetails.dialerUnavailable) {
        this.uiConfigService.SetWarningBannerMessage('! Dialer could not connect');
      }
    });
  }

  doLogin() {
    this.store.dispatch(new AuthActions.LoginStart());
  }

  doLogout(): void {
    this.store.dispatch(new AuthActions.LogoutStart());
  }

  ngOnDestroy() {
    this.storeSub.unsubscribe();
  }



}

