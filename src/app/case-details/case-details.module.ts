import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { CaseDetailsService } from './services/case-details.service';
import { CaseDetailsRoutingModule } from './case-details-routing.module';
import { CaseDetailsComponent } from './case-details/case-details.component';
import { CaseDetailsEffects } from './store/case-details.effects';
import * as fromCaseDetails from './store/case-details.reducer';
import { TcwSharedModule } from '../shared/shared.module';
import { ContactDetailsComponent } from './case-details/contact-details/contact-details.component';
import { ContactDetailsSingleComponent } from './case-details/contact-details-single/contact-details-single.component';
import { AddressEnrollmentComponent } from './case-details/address-enrollment/address-enrollment.component';
import { PrimngModule } from '../core/primng.module';
import { FormsModule } from '@angular/forms';
import { MicrodataGridHeaderComponent } from './collection/microdata-grid-header/microdata-grid-header.component';
import { MicrodataGridToolbarComponent } from './collection/ces/microdata-grid-toolbar/microdata-grid-toolbar.component';
import { CaseHeaderComponent } from './case-details/case-header/case-header.component';
import { QuiDataComponent } from './case-details/qui-data/qui-data.component';
import { RollverComponent } from './collection/rollver/rollver.component';
import { PackageNoticeComponent } from './case-details/package-notice/package-notice.component';
import { UnitGridComponent } from './case-details/unit-grid/unit-grid.component';
import { UnitHeaderComponent } from './case-details/unit-header/unit-header.component';
import { UnitPrimaryAddressComponent } from './case-details/unit-primary-address/unit-primary-address.component';
import { UnitAddressesComponent } from './case-details/unit-addresses/unit-addresses.component';
import { TaxInfoComponent } from './case-details/tax-info/tax-info.component';
import { HistoricalInfoComponent } from './case-details/historical-info/historical-info.component';
import { OtherInfoComponent } from './case-details/other-info/other-info.component';
import { ImportantDatesComponent } from './case-details/important-dates/important-dates.component';
import { VerifyEmailComponent } from './case-details/verify-email/verify-email.component';
import { CesMicrodataGridComponent } from './collection/ces/ces-microdata-grid/ces-microdata-grid.component';
import { JoltsMicrodataGridToolbarComponent } from './collection/jolts/jolts-microdata-grid-toolbar/jolts-microdata-grid-toolbar.component';
import { JoltsMicrodataGridComponent } from './collection/jolts/jolts-microdata-grid/jolts-microdata-grid.component';
import { MultiPayComponent } from './collection/ces/multi-pay/multi-pay.component';
import { DialogService } from 'primeng/dynamicdialog';
import { CaseToolbarModule } from '../case-toolbar/case-toolbar.module';
import { ConfirmationService } from 'primeng/api';
import { CaseDetailsSaveGuard } from './services/gaurds/case-details-save.guard';
import { InterviewWizardComponent } from './collection/ces/interview-wizard/interview-wizard.component';

@NgModule({
  // tslint:disable-next-line: max-line-length
  declarations: [
    CaseDetailsRoutingModule.moduleComponents,
    MicrodataGridHeaderComponent,
    MicrodataGridToolbarComponent,
    CaseHeaderComponent,
    QuiDataComponent,
    RollverComponent,
    PackageNoticeComponent,
    UnitGridComponent,
    UnitHeaderComponent,
    UnitPrimaryAddressComponent,
    UnitAddressesComponent,
    TaxInfoComponent,
    HistoricalInfoComponent,
    OtherInfoComponent,
    ImportantDatesComponent,
    VerifyEmailComponent,
    CesMicrodataGridComponent,
    JoltsMicrodataGridToolbarComponent,
    JoltsMicrodataGridComponent,
    MultiPayComponent,
    InterviewWizardComponent,
  ],
  imports: [
    CommonModule,
    CaseDetailsRoutingModule,
    // CoreModule,
    TcwSharedModule,
    CaseToolbarModule,
    PrimngModule,
    FormsModule,
    StoreModule.forFeature('case-details', fromCaseDetails.caseDetailsReducer), // import reducer group
    EffectsModule.forFeature([CaseDetailsEffects]), // import effects group
  ],
  entryComponents: [
    MultiPayComponent,
  ],
  exports: [
    CaseDetailsComponent
  ],
  providers: [
    DialogService,
    ConfirmationService,
    CaseDetailsSaveGuard,
  ]
})
export class CaseDetailsModule { }
