import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { Case } from 'src/app/shared/models/case.model';
import { Observable } from 'rxjs';
import { CaseSummary } from 'src/app/shared/models/case-summary.model';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'fsms-tcw-case-summary',
  templateUrl: './case-summary.component.html',
  styleUrls: ['./case-summary.component.css']
})
export class CaseSummaryComponent implements AfterContentChecked, OnInit, AfterViewInit {

   // create an input property for this component/directive
   @Input() CaseSummary: CaseSummary;


  @ViewChild('caseSummaryheader', { read: ElementRef, static: false}) caseSummaryElementRef: ElementRef;

   constructor( private activatedRoute: ActivatedRoute,
                private cd: ChangeDetectorRef,
                private router: Router) { }

  ngAfterContentChecked() {
    this.cd.detectChanges();
  }


  ngAfterViewInit(): void {
    const elem = this.caseSummaryElementRef.nativeElement as HTMLElement;
    elem.focus();
  }


  ngOnInit() {
    this.router.navigate(['collectionnotes', this.CaseSummary.CaseNum, { inCollections: true}], {relativeTo: this.activatedRoute});
  }

}
