import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { CaseNotesComponent } from '../case-toolbar/case-notes/case-notes.component';
import { CaseResolverService } from './resolvers/case-resolver.service';
// import { AddressEnrollmentResolverService } from './case-details/address-enrollment/address-enrollment-resolver.service';
import { CaseDetailsComponent } from './case-details/case-details.component';
import { Case } from '../shared/models/case.model';
import { AddressEnrollmentComponent } from './case-details/address-enrollment/address-enrollment.component';
import { ContactDetailsComponent } from './case-details/contact-details/contact-details.component';
import { ContactDetailsSingleComponent } from './case-details/contact-details-single/contact-details-single.component';
import { CollectionComponent } from './collection/collection.component';
import { CaseSummaryComponent } from './collection/case-summary/case-summary.component';
import { MicrodataGridToolbarComponent } from './collection/ces/microdata-grid-toolbar/microdata-grid-toolbar.component';
import { CaseNotesComponent } from '../case-toolbar/case-notes/case-notes.component';
import { CaseNotesResolverService } from '../case-toolbar/Resolvers/case-notes-resolver.service';
import { CaseToolbarResolverService } from '../case-toolbar/Resolvers/case-toolbar-resolver.service';
import { CaseDetailsSaveGuard } from './services/gaurds/case-details-save.guard';
// import { CaseNotesComponent } from './collection/case-notes/case-notes.component';
// import { CaseNotesComponent } from 'src/app/case-toolbar/case-notes/case-notes.component';

const routes: Routes = [
  {
    path: '',
    component: CaseDetailsComponent,
    canDeactivate: [CaseDetailsSaveGuard],
    resolve: {caseDetails: CaseResolverService},
    children: [
      { path: 'addressEnrollment', component: AddressEnrollmentComponent}, // , resolve: { caseDetails: AddressEnrollmentResolverService} },
      { path: 'collection', component: CollectionComponent,
        children: [
          { path: 'collectionnotes/:id', component: CaseNotesComponent, resolve: { notes: CaseNotesResolverService, caseDetails: CaseToolbarResolverService } }
        ]
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CaseDetailsRoutingModule {
  // list of module components. THis is declared in the module.
  static moduleComponents = [
    CaseDetailsComponent,
    // CaseNotesComponent,
    ContactDetailsComponent,
    ContactDetailsSingleComponent,
    AddressEnrollmentComponent,
    CollectionComponent,
    CaseSummaryComponent,
  ];
}
