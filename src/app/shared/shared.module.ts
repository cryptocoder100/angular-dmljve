import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcenotfoundComponent } from './resourcenotfound/resourcenotfound.component';
import { AuthComponent } from './auth/auth.component';
import { PrimngModule } from '../core/primng.module';
import { SampleComponentUsageComponent } from './sample-component-usage/sample-component-usage.component';
import { CaseToolbarComponent } from './case-toolbar/case-toolbar.component';
import { FormsModule } from '@angular/forms';
import { SearchSummaryComponent } from './search-summary/search-summary.component';
import { ComboboxComponent } from './combobox/combobox.component';
import { ErrorDialogComponent } from '../shared/error-dialog/error-dialog.component';
import { PrintFaxComponent } from './print-fax/print-fax.component';
import { WarningBannerComponent } from './warning-banner/warning-banner.component';
import { BatchfaxMicrodataGridComponent } from './batchfax-microdata-grid/batchfax-microdata-grid.component';
import { PrintSetupComponent } from '../print-setup/print-setup.component';
import { FaxPrintDashboardComponent } from '../fax-print-dashboard/fax-print-dashboard.component';
import { FindReporterComponent } from '../find-reporter/find-reporter.component';
import { FilterBarComponent } from './filter-bar/filter-bar.component';
import { DccTransfersComponent } from './dcc-transfers/dcc-transfers.component';
import { DccTransferEditComponent } from './dcc-transfer-edit/dcc-transfer-edit.component';
import { DccTransferRejectComponent } from './dcc-transfer-reject/dcc-transfer-reject.component';
import { RearrangeMultiComponent } from './rearrange-multi/rearrange-multi.component';
import { PhonePipe } from './pipes/phone.pipe';

@NgModule({
  declarations: [
    ResourcenotfoundComponent,
    AuthComponent,
    SampleComponentUsageComponent,
    CaseToolbarComponent,
    SearchSummaryComponent,
    ComboboxComponent,
    ErrorDialogComponent,
    BatchfaxMicrodataGridComponent,
    PrintFaxComponent,
    WarningBannerComponent,
    PrintSetupComponent,
    FaxPrintDashboardComponent,
    FindReporterComponent,
    FilterBarComponent,
    DccTransfersComponent,
    DccTransferEditComponent,
    DccTransferRejectComponent,
    RearrangeMultiComponent,
    PhonePipe
],
  imports: [
    CommonModule,
    PrimngModule,
    FormsModule
  ],
  providers: [],
  exports: [
    PhonePipe,
    ResourcenotfoundComponent,
    AuthComponent,
    CaseToolbarComponent,
    SearchSummaryComponent,
    ComboboxComponent,
    ErrorDialogComponent,
    BatchfaxMicrodataGridComponent,
    WarningBannerComponent,
    PrintFaxComponent,
    FilterBarComponent,
    DccTransfersComponent,
    RearrangeMultiComponent
  ]
})
export class TcwSharedModule { }
