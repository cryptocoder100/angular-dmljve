import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CaseListService } from './services/case-list.service';
import { CaseListRoutingModule } from './case-list-routing.module';
import { CaselistComponent } from './caselist/caselist.component';
import { PrimngModule } from '../core/primng.module';
import { CoreModule } from '../core/core.module';
// import { SharedModule } from 'primeng/api/shared';
import { DatarefreshTimeoutBarComponent } from './datarefresh-timeout-bar/datarefresh-timeout-bar.component';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
// import { MessageService } from 'primeng/api';
import {MessageService} from 'primeng/api';
import { CaseListGridComponent } from './caselist/case-list-grid/case-list-grid.component';


// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  // tslint:disable-next-line: max-line-length
  declarations: [DatarefreshTimeoutBarComponent, CaselistComponent, CaseListGridComponent],
  imports: [
    CommonModule,
    CoreModule,
    PrimngModule,
    RouterModule,
    // SharedModule
  ],
  exports: [
    CaselistComponent
  ],
  providers: [
    { provide: CaseListService, useClass: CaseListService },
    // { provide: MessageService, useClass: MessageService }
  ]
})
export class CaseListModule { }
