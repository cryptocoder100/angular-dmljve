import { NgModule, SkipSelf, Optional, ErrorHandler } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TcwSharedModule } from './../shared/shared.module';
import { throwIfAlreadyLoaded } from './throw-if-already-loaded';
import { PrimngModule } from './primng.module';
import { TcwErrorHandlerService } from './services/tcw-error-handler.service';
import { TcwInterceptorService } from './services/tcw-interceptor.service';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Author : Prasad


// Include  artificats like services that are instantiated
// only once singleton across the app here. This module should only be
// improted into root module (app module) while artifacts in the
// sshared folder can be shared and imported many times into
// other moduels (calendarcomponenet, checkboxcustom compoennet)


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    PrimngModule,
    FormsModule,
    BrowserAnimationsModule,
    TcwSharedModule,
  ],
  providers: [
    { provide: ErrorHandler, useClass: TcwErrorHandlerService },
    { provide: HTTP_INTERCEPTORS, useClass: TcwInterceptorService, multi: true }
  ],
  exports: [
    PrimngModule,
    FormsModule,
    TcwSharedModule
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
