import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ResourcenotfoundComponent } from './shared/resourcenotfound/resourcenotfound.component';
import { AuthComponent } from './shared/auth/auth.component';
import { CaseListRoutingModule } from './case-list/case-list-routing.module';
import { CaseToolbarRoutingModule } from './case-toolbar/case-toolbar-routing.module';
import { PrintSetupComponent } from './print-setup/print-setup.component';
import { FaxPrintDashboardComponent } from './fax-print-dashboard/fax-print-dashboard.component';
import { FindReporterComponent } from './find-reporter/find-reporter.component';
import { SendDocumentsComponent } from './send-documents/send-documents.component';
import { PostCardsComponent } from './post-cards/post-cards.component';
import { ReplacementFormsComponent } from './replacement-forms/replacement-forms.component';
import { DropLetterComponent } from './drop-letter/drop-letter.component';
import { AdvanceNoticeComponent } from './advance-notice/advance-notice.component';
import { JoltsRemindersComponent } from './jolts-reminders/jolts-reminders.component';
import { DccTransferInterviewerComponent } from './dcc-transfer-interviewer/dcc-transfer-interviewer.component';
import { DccTransferSupervisorComponent } from './dcc-transfer-supervisor/dcc-transfer-supervisor.component';
import { DccTransferManagerComponent } from './dcc-transfer-manager/dcc-transfer-manager.component';
import { RearrangeMultiLocalComponent } from './rearrange-multi-local/rearrange-multi-local.component';
import { RearrangeMultiUnassignedComponent } from './rearrange-multi-unassigned/rearrange-multi-unassigned.component';
import { BatchFaxDataResolverService } from './batch-fax-entry/Resolvers/batch-fax-data-resolver.service';
import { RearrangeMultiLocalResolverService } from './resolvers/rearrange-multi-local-resolver.service';
import { RearrangeMultiUnassignedResolverService } from './resolvers/rearrange-multi-unassigned-resolver.service';
import { ReroutingComponent } from './rerouting/rerouting.component';

const routes: Routes = [
  { path: 'home', component: AuthComponent },
  { path: 'case-details/:id', loadChildren: () => import('./case-details/case-details.module').then(m => m.CaseDetailsModule)},
  { path: 'case-batchfax/:id', outlet: 'popup', loadChildren: () => import('./batch-fax-entry/batch-fax-entry.module').then(m => m.BatchFaxEntryModule) },
  { path: 'print-setup', component: PrintSetupComponent },
  { path: 'fax-print-dashboard', component: FaxPrintDashboardComponent },
  { path: 'find-reporter', component: FindReporterComponent },
  { path: 'rerouting', component: ReroutingComponent },
  { path: 'rearrange-multi-local', component: RearrangeMultiLocalComponent, resolve: { lockSuccess: RearrangeMultiLocalResolverService } },
  { path: 'rearrange-multi-unassigned', component: RearrangeMultiUnassignedComponent, resolve: { lockSuccess: RearrangeMultiUnassignedResolverService } },
  { path: 'send-documents', component: SendDocumentsComponent },
  { path: 'replacement-forms', component: ReplacementFormsComponent },
  { path: 'post-cards', component: PostCardsComponent },
  { path: 'drop-letter', component: DropLetterComponent },
  { path: 'advance-notice', component: AdvanceNoticeComponent },
  { path: 'jolts-reminders', component: JoltsRemindersComponent },
  { path: 'dcc-transfer-interviewer', component: DccTransferInterviewerComponent },
  { path: 'dcc-transfer-supervisor', component: DccTransferSupervisorComponent },
  { path: 'dcc-transfer-manager', component: DccTransferManagerComponent },
  { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: '**', component: ResourcenotfoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', enableTracing: false }),
    CaseListRoutingModule,
    CaseToolbarRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
