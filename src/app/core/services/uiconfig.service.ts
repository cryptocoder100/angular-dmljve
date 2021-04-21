import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { ToolBarDialogProps } from 'src/app/shared/models/ToolbarDialogProps';
import { MessageService } from 'primeng/api';
// import { Message } from '@angular/compiler/src/i18n/i18n_ast';
// import { TcwLoggerService } from './tcw-logger.service';
// import { UserEnvironment } from 'src/app/shared/models/user-environment.model';
// import { FunctionLock } from 'src/app/shared/models/function-lock.model';

@Injectable({
  providedIn: 'root'
})
export class UIConfigService {

  // set this variable to true when the app loads
  // private selectionModeSingle$: Observable<boolean>;
  private IsSelectedModeMulti = false;
  private messageService: MessageService;







  // subject for groupschedule button visible
  private ShowRollOverDialogSubject = new BehaviorSubject<boolean>(false);
  showRollOver$ = this.ShowRollOverDialogSubject.asObservable();

  // subject to set the focus on first element for any dialog (generic)
  private canSetFocusOnDialogElemSubject = new BehaviorSubject<boolean>(false);
  canSetFocusOnDialogElem$ = this.canSetFocusOnDialogElemSubject.asObservable();

  // subject for dialog
  private IsPopupVisibleSubject = new BehaviorSubject<ToolBarDialogProps>(new ToolBarDialogProps());
  ShowPopupVisible$ = this.IsPopupVisibleSubject.asObservable();

   // subject for dialog
   private IsTraniningEnvironmentSubject = new BehaviorSubject<boolean>(false);
   isTraniningEnvironment$ = this.IsTraniningEnvironmentSubject.asObservable();


 // subject for making notes feature readonly
 private IsReadOnlyNotesSubject = new BehaviorSubject<boolean>(false);
    isReadOnlyNotes$ = this.IsReadOnlyNotesSubject.asObservable();

    //Allan track if notes is displayed for focus
    public IsNotesDisplayed = false;

  // subject for dialog
  private disabeDailerSubject = new BehaviorSubject<boolean>(false);
  disableDialer$ = this.disabeDailerSubject.asObservable();

  // subject for making save feature readonly
  private IsReadOnlySaveFeaturesSubject = new BehaviorSubject<boolean>(false);
  isReadOnlySaveFeatures$ = this.IsReadOnlySaveFeaturesSubject.asObservable();

  // subject for groupschedule button visible
  private IsGroupScheduleSubject = new BehaviorSubject<boolean>(false);
  enabledGroupSchedule$ = this.IsGroupScheduleSubject.asObservable();

  // subject for OpenCase button enable/disabele
  private DisableOpenCaseSubject = new BehaviorSubject<boolean>(true);
  disableOpenCase$ = this.DisableOpenCaseSubject.asObservable();

  // subject for parked case dropdown visible
  private IsParkedCaseSubject = new BehaviorSubject<boolean>(false);
  showParkedCaseDropdown$ = this.IsParkedCaseSubject.asObservable();

  private ErrorDialogMessageSubject: Subject<string> = new Subject<string>();
  errorDialogMessage$ = this.ErrorDialogMessageSubject.asObservable();

  private InfoDialogMessageSubject: Subject<string> = new Subject<string>();
  infoDialogMessage$ = this.InfoDialogMessageSubject.asObservable();

  private WarningBannerMessageSubject: Subject<string> = new Subject<string>();
  warningBannerMessage$ = this.WarningBannerMessageSubject.asObservable();

  private addressEnrollmentUnitGridZoomedSubject: Subject<boolean> = new Subject<boolean>();
  addressEnrollmentUnitGridZoomed$ = this.addressEnrollmentUnitGridZoomedSubject.asObservable();

  constructor(private msgService: MessageService) {
    console.log('ui config');
    this.messageService = msgService;
  }





  ShowPopUp(props: ToolBarDialogProps): void {
    // returns an observable of booelan
    this.IsPopupVisibleSubject.next(props);
  }
  setFocusOnDialogsFirstElem() {
    this.canSetFocusOnDialogElemSubject.next(true);
  }


  HidePopUp(): void {
    const props = new ToolBarDialogProps();
    props.StyleClass = null;
    props.Show = false;
    props.ShowHeader = false;
    props.PositionLeft = 0;
    props.PositionTop = 0;
    this.IsPopupVisibleSubject.next(props);
  }

  zoomAddressEnrollmentUnitGrid(isZoomed: boolean) {
    this.addressEnrollmentUnitGridZoomedSubject.next(isZoomed);
  }


  // Prasad - indicator to let notes component know that we are in collection mode
  setCollectionModeActive(isActive: boolean){
    this.IsReadOnlyNotesSubject.next(isActive);
  }

  // getCollectionModeActive() {
  //   return this.IsCollectionModeActive;
  // }

   // Prasad - method to call when disabling save/cancel/savclose button from collections
  setCaseSaveFeaturesReadOnly(isReadOnly: boolean) {
    this.IsReadOnlySaveFeaturesSubject.next(isReadOnly);
  }

  SetToolbarToSelectedMode(IsSelectedMulti: boolean): void {
    // set the class variable
    this.IsSelectedModeMulti = IsSelectedMulti;

    // emit observable for group scheduler button
    this.IsGroupScheduleSubject.next(this.IsSelectedModeMulti);

    // emit observable for open-case button to disable if selected mode is multi
    this.DisableOpenCaseSubject.next(this.IsSelectedModeMulti);
  }

  SetOpenCaseDisabledOrEnabled(value: boolean): void {
    if (!this.IsSelectedModeMulti) {
      // open-case button enable/disable only applies in Single select mode
      this.DisableOpenCaseSubject.next(value);
    }
  }

  setDialerButtonDisabled(disable: boolean) {
    this.disabeDailerSubject.next(disable);
  }

  SetParkCaseDropDown(visible: boolean): void {
    this.IsParkedCaseSubject.next(visible);
  }

  ToggleRollOverDialog(visible: boolean): void {
    this.ShowRollOverDialogSubject.next(visible);
  }


  SetErrorDialogMessage(msg: string): void {
    this.ErrorDialogMessageSubject.next(msg);
  }

  SetInfoMessage(msg: string) {
    this.InfoDialogMessageSubject.next(msg);
  }

  setTraningEnvironmentBanner(on: boolean) {
    this.IsTraniningEnvironmentSubject.next(on);
  }

  SetWarningBannerMessage(msg: string) {
    this.WarningBannerMessageSubject.next(msg);
  }

  ShowToast(severitytxt: string, summarytxt: string, msg: string): void {
    this.messageService.clear();
    this.messageService.add({ severity: severitytxt, summary: summarytxt, detail: msg });
  }

  ShowSuccessToast(msg: string): void {
    this.messageService.clear();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: msg });
  }

  ShowInfoToast(msg: string) {
    this.messageService.add({ severity: 'info', summary: '', detail: msg });
  }
}
