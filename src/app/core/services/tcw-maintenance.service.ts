import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import * as fromAuth from '../../shared/auth/store/auth.reducer';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import { UserEnvironment } from 'src/app/shared/models/user-environment.model';
import { FunctionLock } from 'src/app/shared/models/function-lock.model';
import { UIConfigService } from './uiconfig.service';
import { BehaviorSubject, Observable } from 'rxjs';


// Author: Prasad
// Purpose: Use this service to show any system level maintenance
@Injectable({
  providedIn: 'root'
})
export class TcwMaintenanceService {

  userEnvironmentVariables: UserEnvironment;
  bannerMessage: string;
  displaySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  display$: Observable<boolean> = this.displaySubject.asObservable();

  constructor(private uiConfigService: UIConfigService, private store: Store<fromApp.AppState>) {

     // subscriging to the store object of  environment variables/after login these values are available
     this.store.select(fromAuth.getAuthState).subscribe(authState => {
      this.userEnvironmentVariables = authState.userEnvironment;

      if (this.userEnvironmentVariables != null) {
        if(this.userEnvironmentVariables.environmentDetails.systemWideCurrentAdminFunctionLocks != null) {
          // call a method that will set the warning banner if any kind of system maintenance
          if (this.isSystemLockedByActiveAdminFunction(this.userEnvironmentVariables.environmentDetails.systemWideCurrentAdminFunctionLocks)) {
            console.log('set new month banner');
            this.uiConfigService.SetWarningBannerMessage(this.bannerMessage);
          }
        }
        // check if we need set traning site banner
        if (this.userEnvironmentVariables.environmentDetails.environmentName != null &&
          this.userEnvironmentVariables.environmentDetails.environmentName.includes('TRN')) {
            console.log('training banner');
            this.uiConfigService.setTraningEnvironmentBanner(true);
        }
      }
    });
  }


   // use this extenisble function to determine if we have any admin fucntion that adds system wide locks
  // if found, return true so the system can show a banner when they log in
  isSystemLockedByActiveAdminFunction(listOfSystemWideLocks: FunctionLock[]): boolean {

    // check if the monthly rollover is in progress
    if (listOfSystemWideLocks.length > 0) {
      let monthlyRollover = listOfSystemWideLocks.find(a => a.FUNCTION_CODE === "MONTHLY_ROLLOVER"); // should be checked against the code but the because of the database strucure
      if(monthlyRollover != null && monthlyRollover.LOCKED) {
        console.log('set new month 2 banner');
        this.bannerMessage = `${monthlyRollover.FUNCTION_CODE} is in progress. Most of the system functions won't be available until this is complete. Please log back in shortly or you may use reports and help guides. `
        return true;
      }
    }

    // TODO: extend this method if other banner messagees needed for other reasons
    return false;
  }
}
