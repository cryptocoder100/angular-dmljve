import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule, MetaReducer } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { AdminModule } from './admin/admin.module';
import { CaseListModule } from './case-list/case-list.module';
import { LayoutModule } from './layout/layout.module';
import { TcwSharedModule } from './shared/shared.module';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import * as fromApp from './store/app.reducer';
import { CaseListEffects } from './case-list/store/caselist.effects';
import { AuthEffects } from './shared/auth/store/auth.effects';
import { CaseToolbarModule } from './case-toolbar/case-toolbar.module';
import { environment } from 'src/environments/environment';
import 'reflect-metadata';
import { MessageService } from 'primeng/api';

import { storeFreeze } from 'ngrx-store-freeze';
import { SendDocumentsComponent } from './send-documents/send-documents.component';
import { BatchDataEntryModule } from './batch-data-entry/batch-data-entry.module';
import { ReplacementFormsComponent } from './replacement-forms/replacement-forms.component';
import { PostCardsComponent } from './post-cards/post-cards.component';
import { DropLetterComponent } from './drop-letter/drop-letter.component';
import { AdvanceNoticeComponent } from './advance-notice/advance-notice.component';
import { JoltsRemindersComponent } from './jolts-reminders/jolts-reminders.component';
import { DccTransferInterviewerComponent } from './dcc-transfer-interviewer/dcc-transfer-interviewer.component';
import { DccTransferSupervisorComponent } from './dcc-transfer-supervisor/dcc-transfer-supervisor.component';
import { DccTransferManagerComponent } from './dcc-transfer-manager/dcc-transfer-manager.component';
import { RearrangeMultiLocalComponent } from './rearrange-multi-local/rearrange-multi-local.component';
import { RearrangeMultiUnassignedComponent } from './rearrange-multi-unassigned/rearrange-multi-unassigned.component';
import { ReroutingComponent } from './rerouting/rerouting.component';

// import { BatchFaxEntryModule } from './batch-fax-entry/batch-fax-entry.module';

export const metaReducers: MetaReducer<fromApp.AppState>[] = !environment.production ? [storeFreeze] : [];

@NgModule({
  declarations: [
    AppComponent,
    SendDocumentsComponent,
    ReplacementFormsComponent,
    PostCardsComponent,
    DropLetterComponent,
    AdvanceNoticeComponent,
    JoltsRemindersComponent,
    DccTransferInterviewerComponent,
    DccTransferSupervisorComponent,
    DccTransferManagerComponent,
    RearrangeMultiLocalComponent,
    RearrangeMultiUnassignedComponent,
    ReroutingComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,           // imports singleton services that must be delcared in core module
    TcwSharedModule,     // imports commonly used components and other utitlies like widgets
    BatchDataEntryModule,
    // BatchFaxEntryModule,
    LayoutModule,     // imports header and footer compoents that designs the layout of the app
    AdminModule,      // feature module
    CaseListModule,   // feature module
    CaseToolbarModule, // feature module
    StoreModule.forRoot(fromApp.appReducer, {metaReducers}), // import reducer group
    StoreDevtoolsModule.instrument(           // registering the NgRx devtools for debugging
      { name: 'TopCATI-Web App DevTools',
        maxAge: 25,
        logOnly: environment.production
      }),
    EffectsModule.forRoot([CaseListEffects, AuthEffects]), // import effects group

    AppRoutingModule, // Always put approuting at the last.
    // order of these modules matter. Otherwise it will break the routing

  ],

  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
