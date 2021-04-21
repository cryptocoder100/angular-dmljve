import { Component, OnInit } from '@angular/core';
import { VERSION } from '../../../environments/version';
import { environment } from 'src/environments/environment';

/*
Author: Prasad
Purpose:      Component that serves as the footer at the bottom of the SPA
              page index.html. This will display short notifications conviently and
              readily visible to the users at all the time.
Description:  This is an Angular component/directive (see the selector name)
              that acts as a footer to index.html SPA page. This helps modularize the
              index.html page to different manageable parts and avoid any monolithic page esign.

Usage :       This directive is used in the app component which is our bootstrap component.
*/

@Component({
  selector: 'fsms-tcw-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  public  supportEmail: string;
  public version: string = VERSION.version;
  public versionDate: string = VERSION.versionDate;

  constructor() {
  }

  ngOnInit() {
    this.supportEmail = environment.supportEmail;
  }

}
