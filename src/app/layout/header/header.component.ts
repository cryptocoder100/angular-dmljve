import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as fromCaseList from '../../case-list/store/caselist.reducer';
import * as CaseListActions from '../../case-list/store/caselist.actions';
import * as AuthActions from '../../shared/auth/store/auth.actions';
import * as AuthReducer from '../../shared/auth/store/auth.reducer';
import { UserEnvironment } from '../../shared/models/user-environment.model';
import { Functions } from '../../shared/models/functions.model';
import { Subscription } from 'rxjs';
import { MenuItemContent } from 'primeng/menu';
import { RouterLink } from '@angular/router';
import { EnvironmentVariable } from '../../shared/models/environment-variable.model';
import { ConfirmationService } from 'primeng/api';
import { take } from 'rxjs/operators';

/*
Author: Prasad
Purpose:      Component that serves as the main header in index.html
              that will provide the menus for TCW.
Description:  This is an Angular component/directive (see the selector name)
              that houses the main TCW header menu items. This helps modularize the
              index.html page to different manageable parts and avoid any monolithic page esign.

Usage :       This directive is used in the app component which is our bootstrap component.
*/

@Component({
  selector: 'fsms-tcw-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private store: Store<fromApp.AppState>, private confirmationService: ConfirmationService) {
  }

  public items: MenuItem[];
  public display: boolean;
  public storeSub: Subscription;
  public isLoggedIn: boolean;
  public userEnvironment: UserEnvironment;
  public collectionMonth: string;
  public collectionYear: string;

  ngOnInit() {
    this.storeSub = this.store.select(AuthReducer.getAuthState).subscribe(result => {
      this.isLoggedIn = result.isLoggedIn;
      this.userEnvironment = result.userEnvironment;

      const currentMonthEnvVariable: EnvironmentVariable | undefined = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'CURRENT_MONTH');
      const currentYearEnvVariable: EnvironmentVariable | undefined = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'CURRENT_YEAR');

      if (currentMonthEnvVariable && currentYearEnvVariable) {
        this.collectionMonth = currentMonthEnvVariable.envValue;
        this.collectionYear = currentYearEnvVariable.envValue;
      } else {
        this.collectionMonth = '';
        this.collectionYear = '';
      }

      this.createMenuItems();
    });

    // set keyboard keys
    // this.setKeyboardShortCutsUsingJquery();

  }

  getIconName(menuItemLabel: string): string {
    let iconName: string;
    switch (menuItemLabel) {
      case 'Home': {
        iconName = 'pi pi-fw pi-home';
        break;
      }
      case 'Reports': {
        iconName = 'pi pi-fw pi-chart-bar';
        break;
      }
      case 'Send Documents': {
        iconName = 'pi pi-fw pi-share-alt';
        break;
      }
      case 'Replacement Forms': {
        iconName = 'pi pi-fw pi-clone';
        break;
      }
      case 'Post Cards': {
        iconName = 'pi pi-fw pi-image';
        break;
      }
      case 'Print Setup': {
        iconName = 'pi pi-fw pi-print';
        break;
      }
      case 'Master File': {
        iconName = 'pi pi-fw pi-file';
        break;
      }
      case 'Data Collection': {
        iconName = 'pi pi-fw pi-pencil';
        break;
      }
      case 'Batch Micro Data Entry': {
        iconName = 'pi pi-fw pi-pencil';
        break;
      }
      case 'Rearrange  Multi': {
        iconName = 'fas fa-sort-amount-up';
        break;
      }
      case 'Find Reporter': {
        iconName = 'pi pi-fw pi-search';
        break;
      }
      case 'Fax/Print Dashboard': {
        iconName = 'pi pi-fw pi-print';
        break;
      }
      case 'Import Data': {
        iconName = 'fa fa-download';
        break;
      }
      case 'Export Data': {
        iconName = 'fa fa-download';
        break;
      }
      case 'Export Employment Data': {
        iconName = 'pi pi-fw pi-pencil';
        break;
      }
      case 'TDE/Web Log Files': {
        iconName = 'fa fa-fw fa-file-code-o';
        break;
        }
      default: {
        iconName = '';
        break;
      }
    }
    return iconName;
  }

  createMenuItems() {
    const tempItems: MenuItem[] = [];

    // add explicitly the batch data entry functions
    // TODO: remove this once all ready
    // crate batch data entry functions


    // UAT Defect: Help should appear at the last on the menu header. The order comes from the DB. To have no other side effects, lets re-order
    // function menu item here on the UI
    let functionList: Functions[] = [];
    functionList = this.userEnvironment.currentUser.functionList.slice();
    if (functionList.length > 1) {
       // get index and the object for help
      const helpFunctionIndex = functionList.findIndex(a => a.text === 'Help');
      if (helpFunctionIndex > 0) {
        // remove help from middle and add it to the end
        const helpFunction = functionList.splice(helpFunctionIndex, 1);
        functionList.push(helpFunction[0]);
      }
    }



    functionList.forEach( (functions) => {
        let menuItem: MenuItem = this.createMenuItemFromFunctions(functions);

        if (functions.text === 'DCC Transfers') {
          if (menuItem.items) {
            menuItem.items = [menuItem.items[menuItem.items.length - 1]];
          }
        }

        tempItems.push(menuItem);
    });

    // const batchDataEntryFunctions = new Functions('Batch Micro Data Entry', 1120, 11, false, 'admin.batchEntryMicrodata', false, '', []);
    // const menuItem = this.createMenuItemFromFunctions(batchDataEntryFunctions);
    // tempItems.push(menuItem);

    console.log(JSON.stringify(tempItems));

    this.items = tempItems;

    // make the root level menu bar items non-navigable. Removing routerlink prop
    this.items.forEach(element => {
      element.routerLink = null;
  });
}

  createMenuItemFromFunctions(functions: Functions): MenuItem {
    const menuItem: MenuItem = {};
    menuItem.label = functions.text;

    let routerLink = '/case-list';

    if (functions.stateId === 'application.printSetup') {
      routerLink = 'print-setup';
    } else if (functions.stateId === 'application.faxPrintDashboard') {
      routerLink = 'fax-print-dashboard';
    } else if (functions.stateId === 'dataCollection.findReporter') {
      routerLink = 'find-reporter';
    } else if (functions.stateId === 'application.sendDocuments') {
      routerLink = 'send-documents';
    } else if (functions.stateId === 'application.replacementForms') {
      routerLink = 'replacement-forms';
    } else if (functions.stateId === 'application.postCards') {
      routerLink = 'post-cards';
    } else if (functions.stateId === 'admin.dropLetter') {
      routerLink = 'drop-letter';
    } else if (functions.stateId === 'admin.batchEntryMicrodata') {
      routerLink = 'batch-microdata-entry';
    } else if (functions.stateId === 'dataCollection.rearrange') {
      routerLink = 'rearrange-multi-local';
    } else if (functions.stateId === 'admin.rearrangeAdmin') {
      routerLink = 'rearrange-multi-unassigned';
    } else if (functions.stateId === 'admin.filter') {
      routerLink = 'admin/create-filter';
    } else if (functions.stateId === 'admin.assignCase') {
      routerLink = 'admin/assign-cases';
    } else if (functions.stateId === 'exports.exportData') {
      routerLink = 'admin/export-data';
    } else if (functions.stateId === 'exports.exportTDEUnits') {
      routerLink = 'admin/export-tde';
    } else if (functions.stateId === 'exports.exportCSA') {
      routerLink = 'admin/export-csa';
    } else if (functions.stateId === 'exports.exportContractFormsPrinting') {
      routerLink = 'admin/export-cfp';
    } else if (functions.stateId === 'exports.exportJoltsRegMicro') {
      routerLink = 'admin/export-jolts';
    } else if (functions.stateId === 'imports.commonImport') {
      routerLink = 'admin/import';
    } else if (functions.stateId === 'admin.members') {
      routerLink = 'admin/member-admin';
    } else if (functions.stateId === 'admin.setNewMonth') {
      routerLink = 'admin/set-new-month';
    } else if (functions.stateId === 'admin.unarchiveUnits') {
      routerLink = 'admin/unarchive-units';
    } else if (functions.stateId === 'admin.transferFromOffsiteDcc') {
      routerLink = 'admin/transfer-from-offsite';
    } else if (functions.stateId === 'admin.transferToOffsiteDcc') {
      routerLink = 'admin/transfer-to-offsite';
    } else if (functions.stateId === 'admin.users') {
      routerLink = 'admin/user-admin';
    } else if (functions.stateId === 'application.transferRequestInterviewer') {
      routerLink = 'dcc-transfer-interviewer';
    } else if (functions.stateId === 'application.transferRequestSupervisor') {
      routerLink = 'dcc-transfer-supervisor';
    } else if (functions.stateId === 'application.transferRequestManager') {
      routerLink = 'dcc-transfer-manager';
    } else if (functions.stateId && functions.stateId.indexOf('AdvNotice') > -1) {
      routerLink = 'advance-notice';
      if (functions.stateId === 'admin.catiAdvNotice') {
        menuItem.queryParams = { type: 'cati' };
      } else if (functions.stateId === 'admin.webAdvNotice') {
        menuItem.queryParams = { type: 'web' };
      } else if (functions.stateId === 'admin.emailAdvNotice') {
        menuItem.queryParams = { type: 'email' };
      } else if (functions.stateId === 'admin.faxAdvNotice') {
        menuItem.queryParams = { type: 'fax' };
      }
    } else if (functions.stateId && functions.stateId.indexOf('Reminder') > -1) {
      routerLink = 'jolts-reminders';
      if (functions.stateId === 'admin.catiReminder1') {
        menuItem.queryParams = { type: 'cati', number: 1 };
      } else if (functions.stateId === 'admin.webReminder1') {
        menuItem.queryParams = { type: 'web', number: 1 };
      } else if (functions.stateId === 'admin.emailReminder1') {
        menuItem.queryParams = { type: 'email', number: 1 };
      } else if (functions.stateId === 'admin.faxReminder1') {
        menuItem.queryParams = { type: 'fax', number: 1 };
      } else if (functions.stateId === 'admin.webReminder2') {
        menuItem.queryParams = { type: 'web', number: 2 };
      } else if (functions.stateId === 'admin.emailReminder2') {
        menuItem.queryParams = { type: 'email', number: 2 };
      } else if (functions.stateId === 'admin.faxReminder2') {
        menuItem.queryParams = { type: 'fax', number: 2 };
      } else if (functions.stateId === 'admin.webReminder3') {
        menuItem.queryParams = { type: 'web', number: 3 };
      } else if (functions.stateId === 'admin.emailReminder3') {
        menuItem.queryParams = { type: 'email', number: 3 };
      } else if (functions.stateId === 'admin.faxReminder3') {
        menuItem.queryParams = { type: 'fax', number: 3 };
      }
      // else if (functions.stateId === 'admin.addMissingMonth') {
      //   routerLink = 'admin/add-missing-month';
      // } else if (functions.stateId === 'admin.removeRemainingDropsOffers') {
      //   routerLink = 'admin/remove-drops-offers';
      // } else if (functions.stateId === 'admin.roles') {
      //   routerLink = 'admin/role-admin';
      // } else if (functions.stateId === 'admin.organizeDocument') {
      //   routerLink = 'admin/organize-documents';
      // } else if (functions.stateId === 'admin.systemSettings') {
      //   routerLink = 'admin/system-settings';
      // }
    }

    menuItem.routerLink = routerLink; // dont' need to use square brackets like in normal routerlink

    menuItem.icon = this.getIconName(menuItem.label);
    if (functions.stateId != null) {
          menuItem.url = this.getMenuUrl(functions.stateId);
          if (menuItem.url && menuItem.url.length > 0) {
              menuItem.command = (onclick) => { window.open(menuItem.url, '_blank'); };
          }
      }
      // fix the bug where root menus cause an error
    if (functions.stateId == null) {
          menuItem.routerLink = '';
      }

    const tempItems: MenuItem[] = [];
    if (functions.items != null && functions.items.length > 0) {
      functions.items.forEach( (innerFunctions) => {
        tempItems.push(this.createMenuItemFromFunctions(innerFunctions));
      });
    }

    if (tempItems.length > 0) {
      menuItem.items = tempItems;
    }

    return menuItem;
  }

  ngOnDestroy() {
    this.storeSub.unsubscribe();
  }

  doLogout() {
    let isCaseOpen: boolean = false;
    this.store.select(fromCaseList.getSelectedCaseOpen).pipe(take(1)).subscribe((result: boolean) => {
      isCaseOpen = result;
    });

    if (isCaseOpen) {
      this.confirmationService.confirm({
        message: 'You have a case open.  Unsaved changes will be lost.  Do you wish to logout?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.store.dispatch(new CaseListActions.UnloadSelectedCase(false));
          this.store.dispatch(new AuthActions.LogoutStart());
        }
      });
    } else {
      this.store.dispatch(new AuthActions.LogoutStart());
    }
  }

 getMenuUrl(strArg: string) {
     let strRet: string = '';
     let envVar: EnvironmentVariable | undefined = undefined;

     switch (strArg) {
         case 'application.rnotes':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'RNOTES_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.help':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'HELP_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.manUrl':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'MAN_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.newManUrl':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'NEWMAN_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.masterfile':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'MASTERFILE_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.edb':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'EDB_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'application.report':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'REPORT_URL');
             if (envVar) {
              strRet = envVar.envValue;
             }
             break;
         case 'admin.systemSettings':
         case 'admin.organizeDocument':
         case 'admin.removeRemainingDropsOffers':
         case 'admin.addMissingMonth':
         case 'admin.roles':
             envVar = this.userEnvironment.environmentDetails.environmentVariables.find(x => x.envName === 'CONS_URL');
             if (envVar) {
                 strRet = envVar.envValue;
             }

             break;

     }

     return strRet;
    }

}
