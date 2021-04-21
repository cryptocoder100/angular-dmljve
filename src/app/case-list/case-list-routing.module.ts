import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CaselistComponent } from './caselist/caselist.component';
import { CaseListResolverService } from './resolvers/case-list-resolver.service';
import { CaseNotesComponent } from '../case-toolbar/case-notes/case-notes.component';


const routes: Routes = [
  {
    path: 'case-list',
    component: CaselistComponent,
    children: [
      { path: '', component: CaselistComponent, resolve: { caseList: CaseListResolverService }},
      { path: ':userId', component: CaselistComponent, resolve: { caseList: CaseListResolverService }}
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CaseListRoutingModule { }
