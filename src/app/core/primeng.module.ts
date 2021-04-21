import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';

import { MenuModule } from 'primeng/menu';
import { AccordionModule } from 'primeng/accordion';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { PanelModule } from 'primeng/panel';
import { WizardModule } from './../extensions/primeng-wizard/primeng-wizard.module';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SidebarModule } from 'primeng/sidebar';
import { DynamicDialogModule} from 'primeng/dynamicdialog';
import { TabMenuModule } from 'primeng/tabmenu';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { MegaMenuModule } from 'primeng/megamenu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { StepsModule } from 'primeng/steps';
import { MenubarModule } from 'primeng/menubar';
import { FocusTrapModule } from 'primeng/focustrap';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { SpinnerModule } from 'primeng/spinner';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { CarouselModule } from 'primeng/carousel';
import { BlockUIModule } from 'primeng/blockui';
import { CalendarModule } from 'primeng/calendar';
import { FieldsetModule } from 'primeng/fieldset';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ListboxModule } from 'primeng/listbox';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AngularSplitModule.forRoot(),
    MenuModule,
    AccordionModule,
    MessageModule,
    MessagesModule,
    PanelModule,
    WizardModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    KeyFilterModule,
    ToggleButtonModule,
    CarouselModule,
    ScrollPanelModule,
    SidebarModule,
    DynamicDialogModule,
    TabMenuModule,
    TabViewModule,
    FieldsetModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    CardModule,
    MegaMenuModule,
    PanelMenuModule,
    StepsModule,
    MenubarModule,
    FocusTrapModule,
    ButtonModule,
    BlockUIModule,
    SpinnerModule,
    InputTextModule,
    TableModule,
    MultiSelectModule,
    CalendarModule,
    InputMaskModule,
    CheckboxModule,
    DropdownModule,
    InputSwitchModule,
    RadioButtonModule,
    ListboxModule,
    OverlayPanelModule
  ],
  exports: [
    AngularSplitModule,
    MenuModule,
    MessageModule,
    MessagesModule,
    AccordionModule,
    PanelModule,
    WizardModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    KeyFilterModule,
    ToggleButtonModule,
    CarouselModule,
    ScrollPanelModule,
    SidebarModule,
    DynamicDialogModule,
    TabMenuModule,
    TabViewModule,
    FieldsetModule,
    DialogModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    ConfirmDialogModule,
    CardModule,
    MegaMenuModule,
    PanelMenuModule,
    StepsModule,
    MenubarModule,
    FocusTrapModule,
    ButtonModule,
    BlockUIModule,
    SpinnerModule,
    InputTextModule,
    TableModule,
    MultiSelectModule,
    CalendarModule,
    InputMaskModule,
    CheckboxModule,
    DropdownModule,
    InputSwitchModule,
    RadioButtonModule,
    ListboxModule,
    OverlayPanelModule
  ]
})
export class PrimngModule { }
