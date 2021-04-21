import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from './store/app.reducer';
import * as AuthReducer from '../app/shared/auth/store/auth.reducer';
import { Observable, of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { UIConfigService } from './core/services/uiconfig.service';
import { map, take } from 'rxjs/operators';
import { ToolBarDialogProps } from './shared/models/ToolbarDialogProps';
import { slideInAnimation } from './shared/animations/slideInAnimation';
import { LogoutStart } from './shared/auth/store/auth.actions';
import { Route } from '@angular/compiler/src/core';
import { Router, Event, NavigationStart, NavigationCancel, NavigationEnd, NavigationError } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TcwConstantsService } from './core/services/tcw-constants.service';
import { Constants } from './shared/models/constants.model';
import { TcwError } from './shared/models/tcw-error';
import { UserEnvironment } from './shared/models/user-environment.model';

@Component({
  selector: 'fsms-tcw-body-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [slideInAnimation]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'topcatiweb-client';
  loading = false;




  dialogProps$ = this.uiConfigService.ShowPopupVisible$;
  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  userEnvironment: UserEnvironment;

  interval: any;

  constructor(private uiConfigService: UIConfigService,
              private messageService: MessageService,
              private store: Store<fromApp.AppState>,
              private tcwConstantsService: TcwConstantsService,
              private routerEvent: Router,
              private cdrf: ChangeDetectorRef) {
    // this.uiConfigService.SetMessageService(this.messageService);
  }

  // using event lifecycle to show spinner
  checkRouteEvents(event: Event): void {
    if (event instanceof NavigationStart) {
      this.loadingSubject.next(true);
      this.cdrf.detectChanges();
    }

    if (event instanceof NavigationCancel ||
      event instanceof NavigationEnd ||
      event instanceof NavigationError) {
      this.loadingSubject.next(false);
      this.cdrf.detectChanges();
    }
  }

  onShowDialog() {
    this.uiConfigService.setFocusOnDialogsFirstElem();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event) {
    let loggedOut = false;
    let logoutDispatched = false;

    while (!loggedOut) {
      this.store.select(AuthReducer.getAuthState).pipe(take(1)).subscribe(result => {
        loggedOut = result.hasUserLoggedOut;

        if (!loggedOut) {
          if (result.isLoggedIn) {
            if (!logoutDispatched) {
              this.store.dispatch(new LogoutStart());
              logoutDispatched = true;
            }
          } else {
            loggedOut = true;
          }
        }
      });
    }
  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngOnInit(): void {

    // watching events for spinner
    this.routerEvent.events.subscribe((event: Event) => {
      this.checkRouteEvents(event);
    });

    // call constants api to get all constants on app load
    this.tcwConstantsService.getConstants().pipe(take(1)).subscribe((constants: Constants) => {
      console.log('Constants loaded on bootstrappig');
    }, (err: TcwError) => {
      console.error('Loading constants failed on startup.');
    });

    //Check every hour
    this.interval = setInterval(() => {
      const nowDate = new Date();
      if (nowDate.getHours() === 23) {
        this.store.dispatch(new LogoutStart());
      }
    }, 60 * 60 * 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
