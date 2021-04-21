import { Injectable } from '@angular/core';
import { ExplCode, Lopp, LoppTemp } from 'src/app/shared/models/expl-code.model';
import { RespCode } from 'src/app/shared/models/resp-code.model';
import { Observable, of } from 'rxjs';
import { Status } from 'src/app/shared/models/status.model';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import { map } from 'rxjs/operators';
import { CollectionsLookupModel, Priority, DdOptions } from 'src/app/shared/models/collections.lookup.model';
import { JoltsReEditStatus } from 'src/app/shared/models/collections-microdata.model';
import { CaseNrpTypes, RollOverLookUpModel, RollOverOptions, RollOverQuestion, CesCMI, JoltsCMI } from 'src/app/shared/models/rollover.model';




@Injectable({
  providedIn: 'root'
})
export class LookupService {

  collectionLookupModel: CollectionsLookupModel;
  rollOverLookupModel: RollOverLookUpModel;



  isCES: boolean;


  IsCES$: Observable<boolean> = this.store.select('authState').pipe(
    map(authState => {
      this.isCES = authState.userEnvironment.environmentDetails.survey === 'C' ? true : false;
      return this.isCES;
     })
  );

  SurveryId$: Observable<string> = this.store.select('authState').pipe(
    map(authState => {
     return authState.userEnvironment.environmentDetails.survey;
     })
  );

  constructor(private store: Store<fromApp.AppState>) {
    this.collectionLookupModel = new CollectionsLookupModel();
    this.rollOverLookupModel = new RollOverLookUpModel();
  }

  getCaseNrpTypes(): CaseNrpTypes[] {
    return this.rollOverLookupModel.caseNrpTypes;
  }

  getJoltsApCodes(): DdOptions[] {
    return this.collectionLookupModel.joltsApCodes;
  }
  getJoltsReEditOptions(): DdOptions[] {
    return this.collectionLookupModel.joltsReEditOptions;
  }


  getJoltsPriorities(): Priority[] {
    return this.collectionLookupModel.joltsPriorities;
  }

  getScreeningErrorScripts(forCES: boolean): Map<string, string> {
    if (forCES) {
      return this.collectionLookupModel.screeningErrorScripts;
    } else {
      return this.collectionLookupModel.joltsscreeningErrorScripts;
    }
  }

  getInterviewScripts(forCES: boolean): Map<string, string> {
    if (forCES) {
      return this.collectionLookupModel.cesInterviewScripts;
    } else {
      return this.collectionLookupModel.joltsInterviewScripts;
    }
  }

  getInterviewErrorScripts(forCES: boolean): Map<string, string> {
    if (forCES) {
      return this.collectionLookupModel.cesInterviewEditErrorScripts;
    } else {
      return this.collectionLookupModel.joltsInterviewEditErrorScripts;
    }
  }

  getExplanationCodeByCode(IsCES: boolean, code: string): ExplCode {
    return this.getExplCode(IsCES).find(c => c.code === code);
  }

  getNENAICSCodes(): string[] {
    return this.collectionLookupModel.NceNAICSCodes;
  }


  getAeLdbExplanationCode(IsCES: boolean): ExplCode[] {
    let explCodes: ExplCode[] = [];
    if (IsCES) {
      explCodes = this.collectionLookupModel.cesAeLdbCheckExplCodes;
    } else {
      explCodes = this.collectionLookupModel.joltsLdbCheckExplCodes;
    }
    return explCodes;
  }

  getExplCode(IsCES: boolean): ExplCode[] {
    let explCodes: ExplCode[] = [];
    if (IsCES) {
      explCodes = [
        { code: null, displayOrder: ' ', ecDir: '', desc: '', text: '' },
        { code: null, displayOrder: ' ', ecDir: '', desc: 'Employment Shifts', text: 'Employment Shifts' },
        { code: '01', displayOrder: '01', ecDir: '(>)', desc: 'Seasonal increase', text: '01 (>) Seasonal increase' },
        { code: '02', displayOrder: '02', ecDir: '(<)', desc: 'Seasonal decrease', text: '02 (<) Seasonal decrease' },
        { code: '03', displayOrder: '03', ecDir: '(<)', desc: 'More business (expansion)', text: '03 (<) More business (expansion)' },
        { code: '04', displayOrder: '04', ecDir: '(<)', desc: 'Less business (contraction)', text: '04 (<) Less business (contraction)' },
        { code: '05', displayOrder: '05', ecDir: '(>)', desc: 'Short term/specific business project starting or continuing', text: '05 (>) Short term/specific business project starting or continuing' },
        { code: '06', displayOrder: '06', ecDir: '(<)', desc: 'Short-term/specific business project ending or approaching', text: '(<) Short-term/specific business project ending or approaching' },
        { code: '06', displayOrder: '06', ecDir: '...', desc: 'completion', text: '... completion' },
        { code: '07', displayOrder: '07', ecDir: '(<)', desc: 'Layoff', text: '(<) Layoff' },
        { code: '08', displayOrder: '08', ecDir: '(<)', desc: 'Strike, lockout or other labor dispute', text: '(<) Strike, lockout or other labor dispute' },
        { code: '61', displayOrder: '61', ecDir: '(=)', desc: 'Employment returns to normal after strike', text: '(=) Employment returns to normal after strike)' },
        { code: '09', displayOrder: '09', ecDir: '(<)', desc: 'Temporary shutdown of physical location', text: '(<) Temporary shutdown of physical location' },
        { code: '12', displayOrder: '12', ecDir: '(<)', desc: 'Internal reorganization, downsizing or bankruptcy resulting', text: '(<) Internal reorganization, downsizing or bankruptcy resulting' },
        { code: '12', displayOrder: '12', ecDir: '...', desc: 'in an employment decrease', text: '... in an employment decrease' },
        { code: '14', displayOrder: '14', ecDir: '(=)', desc: 'Nonstandard work schedule', text: '(=) Nonstandard work schedule' },
        { code: '15', displayOrder: '15', ecDir: '(=)', desc: 'Intra-account (firm) transfer', text: '(=) Intra-account (firm) transfer' },
        { code: '18', displayOrder: '18', ecDir: '( )', desc: 'Active employer reporting zero employment and wages', text: '( ) Active employer reporting zero employment and wages' },
        { code: '19', displayOrder: '19', ecDir: '( )', desc: 'Employment returns or returning back to normal after 07 or 09-18', text: '( ) Employment returns or returning back to normal after 07 or 09-18' },
        { code: '37', displayOrder: '37', ecDir: '(=)', desc: 'Other reasons for employment change', text: '(=) Other reasons for employment change' },
        { code: '64', displayOrder: '64', ecDir: '(=)', desc: 'WW change is verified by respondent', text: '(=) WW change is verified by respondent' },

        // payshifts
        { code: null, displayOrder: ' ', ecDir: '', desc: 'Pay Shifts', text: 'Pay Shifts' },
        { code: '20', displayOrder: '20', ecDir: '(<)', desc: 'Wage rate decrease', text: '(<) Wage rate decrease' },
        { code: '21', displayOrder: '21', ecDir: '(>)', desc: 'Wage rate increase', text: '(>) Wage rate increase' },
        { code: '22', displayOrder: '22', ecDir: '(<)', desc: 'Increase in percentage of lower-paid employees', text: '(<) Increase in percentage of lower-paid employees' },
        { code: '23', displayOrder: '23', ecDir: '(>)', desc: 'Increase in percentage of higher-paid employees', text: '(>) Increase in percentage of higher-paid employees' },
        { code: '24', displayOrder: '24', ecDir: '(<)', desc: 'Lower hourly earnings because of piecework', text: '(<) Lower hourly earnings because of piecework' },
        { code: '24', displayOrder: '24', ecDir: '...', desc: 'lower incentive pay, or tips', text: '... lower incentive pay, or tips' },
        { code: '25', displayOrder: '25', ecDir: '(>)', desc: 'Higher hourly earnings because of piecework', text: '(>) Higher hourly earnings because of piecework' },
        { code: '25', displayOrder: '25', ecDir: '...', desc: 'higher incentive pay, or tips', text: '... higher incentive pay, or tips' },
        { code: '26', displayOrder: '26', ecDir: '(<)', desc: 'Less overtime worked at premium pay or less overtime worked', text: '(<) Less overtime worked at premium pay or less overtime worked' },
        { code: '27', displayOrder: '27', ecDir: '(>)', desc: 'Overtime worked at premium pay or more overtime pay', text: '(>) Overtime worked at premium pay or more overtime pay' },
        { code: '29', displayOrder: '29', ecDir: '(>)', desc: 'Severance pay distributed', text: '(>) Severance pay distributed' },
        { code: '32', displayOrder: '32', ecDir: '( )', desc: 'Change in commissions', text: '( ) Change in commissions' },
        { code: '34', displayOrder: '34', ecDir: '( )', desc: 'Change in hourly earnings or pay because of change in amount', text: '( ) Change in hourly earnings or pay because of change in amount' },
        { code: '34', displayOrder: '34', ecDir: '...', desc: 'of shift work with pay differential', text: '... of shift work with pay differential' },
        { code: '35', displayOrder: '35', ecDir: '( )', desc: 'Change in hours, earnings, or wages due to legislation or', text: '( ) Change in hours, earnings, or wages due to legislation or' },
        { code: '35', displayOrder: '35', ecDir: '...', desc: 'administrative regulations', text: '... administrative regulations' },
        { code: '36', displayOrder: '36', ecDir: '( )', desc: 'Pay returns or returning to normal or a new normal', text: '( ) Pay returns or returning to normal or a new normal' },
        { code: '38', displayOrder: '38', ecDir: '( )', desc: 'Other reasons for payroll and hours change', text: '( ) Other reasons for payroll and hours change' },
        { code: '62', displayOrder: '62', ecDir: '(>)', desc: 'AHE/AWH are higher than industry average', text: '(>) AHE/AWH are higher than industry average' },
        { code: '63', displayOrder: '63', ecDir: '(<)', desc: 'AHE/AWH are lower than industry average', text: '(<) AHE/AWH are lower than industry average' },


        // Hours (Time and Vacation)
        { code: null, displayOrder: ' ', ecDir: '', desc: 'Hours (Time and Vacation)', text: 'Hours (Time and Vacation)' },
        { code: '40', displayOrder: '40', ecDir: '(<)', desc: 'Shorter scheduled workweek or fewer hours worked', text: '(<) Shorter scheduled workweek or fewer hours worked' },
        { code: '41', displayOrder: '41', ecDir: '(>)', desc: 'Longer scheduled workweek or more hours worked', text: '(>) Longer scheduled workweek or more hours worked' },
        { code: '42', displayOrder: '42', ecDir: '(<)', desc: 'Decrease in part-time workers', text: '(<) Decrease in part-time workers' },
        { code: '43', displayOrder: '43', ecDir: '(>)', desc: 'Increase in part-time workers', text: '(>) Increase in part-time workers' },
        { code: '46', displayOrder: '46', ecDir: '( )', desc: 'Employees on unpaid vacation or unpaid leave', text: '( ) Employees on unpaid vacation or unpaid leave' },
        { code: '47', displayOrder: '47', ecDir: '( )', desc: 'Return to normal after end of unpaid vacation or unpaid leave', text: '( ) Return to normal after end of unpaid vacation or unpaid leave' },
        { code: '49', displayOrder: '49', ecDir: '( )', desc: 'Employees working and receiving vacation pay', text: '( ) Employees working and receiving vacation pay' },
        // Hours (Time and Vacation)
        { code: null, displayOrder: ' ', ecDir: '', desc: 'Special Conditions', text: 'Special Conditions' },
        { code: '50', displayOrder: '50', ecDir: '( )', desc: 'Large scale external events', text: '( ) Large scale external events' },
        { code: '53', displayOrder: '53', ecDir: '( )', desc: 'Worksite specific events', text: '( ) Worksite specific events' },
        { code: '55', displayOrder: '55', ecDir: '( )', desc: 'Data return or returning to normal or a new normal', text: '( ) Data return or returning to normal or a new normal' },
        { code: '56', displayOrder: '56', ecDir: '(<)', desc: 'Secondary-effects decrease', text: '(<) Secondary-effects decrease' },
        { code: '57', displayOrder: '57', ecDir: '(>)', desc: 'Secondary-effects increase', text: '(>) Secondary-effects increase' },
        // Reporting Issues)
        { code: null, displayOrder: ' ', ecDir: '', desc: 'Reporting Issues', text: 'Reporting Issues' },
        { code: '65', displayOrder: '65', ecDir: '( )', desc: 'AE contains non-covered employment', text: '( ) AE contains non-covered employment' },
        { code: '86', displayOrder: '86', ecDir: '( )', desc: 'Establishment going or is permanently out of business', text: '( ) Establishment going or is permanently out of business' },
        { code: '88', displayOrder: '88', ecDir: '(<)', desc: 'Establishment dissolution', text: '(<) Establishment dissolution' },
        { code: '89', displayOrder: '89', ecDir: '( )', desc: 'Establishment merger/acquisition', text: '( ) Establishment merger/acquisition' },
        { code: '90', displayOrder: '90', ecDir: '( )', desc: 'Reporter changes basis of reporting for AE', text: '( ) Reporter changes basis of reporting for AE' },

        { code: '91', displayOrder: '91', ecDir: '( )', desc: 'Reporter changes basis of reporting for all data items but AE', text: '( ) Reporter changes basis of reporting for all data items but AE' }
      ];
    } else {
      explCodes = [
        { code: null, displayOrder: ' ', desc: '', text: ' ' },
        { code: '01', displayOrder: '01', desc: 'More business (expansion)', text: 'More business (expansion)' },
        { code: '02', displayOrder: '02', desc: 'Less business (contraction)', text: 'Less business (contraction)' },
        { code: '03', displayOrder: '03', desc: 'Seasonal change, beginning season', text: 'Seasonal change, beginning season' },
        { code: '04', displayOrder: '04', desc: 'Seasonal change, ending season', text: 'Seasonal change, ending season' },
        { code: '05', displayOrder: '05', desc: 'Short-term/specific business project starting or continuing', text: 'Short-term/specific business project starting or continuing' },
        { code: '06', displayOrder: '06', desc: 'Short-term/specific business project completed or approaching completion', text: 'Short-term/specific business project completed or approaching completion' },
        { code: '07', displayOrder: '07', desc: 'Establishment relocated and expanded', text: 'Establishment relocated and expanded' },
        { code: '08', displayOrder: '08', desc: 'Establishment relocated and downsized', text: 'Establishment relocated and downsized' },
        { code: '09', displayOrder: '09', desc: 'Expansion due to merger', text: 'Expansion due to merger' },
        { code: '10', displayOrder: '10', desc: 'Contraction due to merger', text: 'Contraction due to merger' },
        { code: '11', displayOrder: '11', desc: 'Hiring freeze imposed', text: 'Hiring freeze imposed' },
        { code: '12', displayOrder: '12', desc: 'Hiring freeze lifted', text: 'Hiring freeze lifted' },
        { code: '20', displayOrder: '20', desc: 'Establishment going out of business (employment declining, layoffs high)', text: 'Establishment going out of business (employment declining, layoffs high)' },
        { code: '21', displayOrder: '21', desc: 'Active employer reporting zero employment', text: 'Active employer reporting zero employment' },
        { code: '22', displayOrder: '22', desc: 'Strike, lockout, or other labor dispute', text: 'Strike, lockout, or other labor dispute' },
        { code: '23', displayOrder: '23', desc: 'Temporary shutdown for remodeling, retooling, or repairs', text: 'Temporary shutdown for remodeling, retooling, or repairs' },
        { code: '24', displayOrder: '24', desc: 'Reorganization, downsizing, or bankruptcy resulting in employment decrease and layoffs', text: 'Reorganization, downsizing, or bankruptcy resulting in employment decrease and layoffs' },
        { code: '25', displayOrder: '25', desc: 'Disruption due to natural disaster or other problem', text: 'Disruption due to natural disaster or other problem' },
        { code: '26', displayOrder: '26', desc: 'Returning to normal after shutdown, seasonal closing, disaster, or other disruption', text: 'Returning to normal after shutdown, seasonal closing, disaster, or other disruption' },
        { code: '27', displayOrder: '27', desc: 'Employees of the establishment are now employed by an employee leasing company or vice versa', text: 'Employees of the establishment are now employed by an employee leasing company or vice versa' },
        { code: '28', displayOrder: '28', desc: 'High hires verified as actual hires not just new assignments (temp help agencies)', text: 'High hires verified as actual hires not just new assignments (temp help agencies)' },
        { code: '29', displayOrder: '29', desc: 'Purging employees from system (high quits or layoffs)', text: 'Purging employees from system (high quits or layoffs)' },
        { code: '30', displayOrder: '30', desc: 'Transfers to a different location of the same business', text: 'Transfers to a different location of the same business' },
        { code: '31', displayOrder: '31', desc: 'Retirements increased', text: '31 Retirements increased' },
        { code: '40', displayOrder: '40', desc: 'Part-time workers worked the pay period (employment up with no corresponding hires)', text: 'Part-time workers worked the pay period (employment up with no corresponding hires)' },
        { code: '41', displayOrder: '41', desc: 'Part-time workers did not work the pay period (employment down with no corresponding separations)', text: 'Part-time workers did not work the pay period (employment down with no corresponding separations)' },
        { code: '42', displayOrder: '42', desc: 'On-call workers worked the pay period (employment up with no corresponding hires)', text: 'On-call workers worked the pay period (employment up with no corresponding hires)' },
        { code: '43', displayOrder: '43', desc: 'On-call workers did not work the pay period (employment down with no corresponding separations)', text: 'On-call workers did not work the pay period (employment down with no corresponding separations)' },
        { code: '44', displayOrder: '44', desc: 'Employees returning from unpaid vacation or unpaid leave (employment up with no corresponding hires)', text: 'Employees returning from unpaid vacation or unpaid leave (employment up with no corresponding hires)' },
        { code: '45', displayOrder: '45', desc: 'Employees going on unpaid vacation or unpaid leave (employment down with no corresponding separations)', text: 'Employees going on unpaid vacation or unpaid leave (employment down with no corresponding separations)' },
        { code: '50', displayOrder: '50', desc: 'School break/vacation beginning - employment down and separations up due to non-contract employees', text: 'School break/vacation beginning - employment down and separations up due to non-contract employees' },
        { code: '51', displayOrder: '51', desc: 'School break/vacation ending - employment and hires up due to non-contract employees', text: 'School break/vacation ending - employment and hires up due to non-contract employees' },
        { code: '52', displayOrder: '52', desc: 'Student workers began working (capture in hires if hired)', text: 'Student workers began working (capture in hires if hired)' },
        { code: '53', displayOrder: '53', desc: 'Student workers did not work (capture in separations if separated)', text: 'Student workers did not work (capture in separations if separated)' },
        { code: '54', displayOrder: '54', desc: 'Substitute teachers/adjunct professors worked the pay period', text: 'Substitute teachers/adjunct professors worked the pay period' },
        { code: '55', displayOrder: '55', desc: 'Substitute teachers/adjunct professors did not work the pay period', text: 'Substitute teachers/adjunct professors did not work the pay period' },
        { code: '60', displayOrder: '60', desc: 'Reporting more sites than sampled, agg code A', text: 'Reporting more sites than sampled, agg code A' },
        { code: '61', displayOrder: '61', desc: 'Reporting fewer sites than sampled, agg code P', text: 'Reporting fewer sites than sampled, agg code P' },
        { code: '62', displayOrder: '62', desc: 'Change in basis of reporting - reporting more sites than before (may need agg code A entered)', text: 'Change in basis of reporting - reporting more sites than before (may need agg code A entered)' },
        { code: '63', displayOrder: '63', desc: 'Change in basis of reporting - reporting fewer sites than before (may need agg code P entered)', text: 'Change in basis of reporting - reporting fewer sites than before (may need agg code P entered)' },
        { code: '64', displayOrder: '64', desc: 'Change in basis of reporting - now reporting for sampled site(s) (remove agg code A or P)', text: 'Change in basis of reporting - now reporting for sampled site(s) (remove agg code A or P)' },
        { code: '70', displayOrder: '70', desc: 'Consolidated report, only sampled units reported (enter rept_with_id and rept_part_id)', text: 'Consolidated report, only sampled units reported (enter rept_with_id and rept_part_id)' },
        { code: '71', displayOrder: '71', desc: 'Consolidated report, sampled and non-sampled units reported (enter rept_with_id and rept_part_id)', text: 'Consolidated report, sampled and non-sampled units reported (enter rept_with_id and rept_part_id)' },
        { code: '80', displayOrder: '80', desc: 'New unit not reporting all data elements (enter note)', text: 'New unit not reporting all data elements (enter note)' },
        { code: '81', displayOrder: '81', desc: 'Respondent reporting more / fewer / different data elements (enter note)', text: 'Respondent reporting more / fewer / different data elements (enter note)' },
        { code: '82', displayOrder: '82', desc: 'New respondent reporting differently (enter note)', text: 'New respondent reporting differently (enter note)' },
        { code: '83', displayOrder: '83', desc: 'JO=Hires values verified', text: 'JO=Hires values verified' },
        { code: '97', displayOrder: '97', desc: 'Wrong unit was being collected, data corrected', text: 'Wrong unit was being collected, data corrected' },
        { code: '98', displayOrder: '98', desc: 'Wrong unit was being collected, data deleted and unit re-refined', text: 'Wrong unit was being collected, data deleted and unit re-refined' },
        { code: '99', displayOrder: '99', desc: 'Other, please explain in notes', text: 'Other, please explain in notes' }
        ];
    }
    return explCodes;
  }



  getResponseCodeByCode(IsCES: boolean, code: string): RespCode {
    // find returns undefined but checking for null rules out both; undefined - something hasn't been initialized;
    // null - something isn't avaialble.
    let respCode = this.getRespCode(IsCES).find(c => c.code === code);
    if (respCode == null) {
      respCode = new RespCode(); // rempty object to avoid null exception on the receiving service
    }
    return respCode;
  }

  getReEditCodeByCode(code: string): JoltsReEditStatus {
    let reEditCode = this.collectionLookupModel.joltsReEditOptions.find(c => c.code === code);
    if (reEditCode == null) {
      reEditCode = new JoltsReEditStatus();
    }
    return reEditCode;
  }

  getRespCode(IsCES: boolean): RespCode[] {
    let respCode: RespCode[] = [];
    if (IsCES) {
                // tslint:disable-next-line: no-unused-expression
        respCode = [
                  { code: '00', desc: 'Non response', text: '00 Non response' },
                  { code: '11', desc: 'Pending Review (Edit Error)', text: '11 Pending Review (Edit Error)' },
                  { code: '12', desc: 'Pending Review (Screening Error)', text: '12 Pending Review (Screening Error)' },
                  { code: '15', desc: 'Pending Interviewer Review', text: '15 Pending Interviewer Review' },
                  { code: '16', desc: 'Pending Supervisory Review', text: '16 Pending Supervisory Review' },
                  { code: '17', desc: 'Pending Waiting for Respondent', text: '17 Pending Waiting for Respondent' },
                  { code: '81', desc: 'Non Response last month', text: '81 Non Response last month' },
                  { code: '82', desc: 'Non Response last two months or more', text: '82 Non Response last two months or more' },
                  { code: '90', desc: 'Successfully collected microdata', text: '90 Successfully collected microdata' }
            ];
    } else {
              // tslint:disable-next-line: no-unused-expression
        respCode =       [
                { code: '00', desc: 'Non response', text: '00 Non response' },
                { code: '01', desc: 'Ring no answer/busy', text: '01 Ring no answer/busy' },
                { code: '02', desc: 'Voicemail', text: '02 Voicemail' },
                { code: '03', desc: 'Reschedule Call', text: '03 Reschedule Call' },
                { code: '04', desc: 'Further Research', text: '04 Further Research' },
                { code: '06', desc: 'Refuse to provide contact information', text: '06 Refuse to provide contact information' },
                { code: '08', desc: 'Re-mail/Fax Packet', text: '08 Re-mail/Fax Packet' },
                { code: '10', desc: 'Pending Callback', text: '10 Pending Callback' },
                { code: '11', desc: 'Pending Review (Edit Error)', text: '11 Pending Review (Edit Error)' },
                { code: '12', desc: 'Pending Review (Screening Error)', text: '12 Pending Review (Screening Error)' },
                { code: '14', desc: 'Pending Supervisory Review Refusal', text: '14 Pending Supervisory Review Refusal' },

                { code: '15', desc: 'Pending Respondent Mgmt Approval', text: '15 Pending Respondent Mgmt Approval' },
                { code: '16', desc: 'Pending Interviewer Review', text: '16 Pending Interviewer Review' },
                { code: '17', desc: 'Pending Supervisory Review', text: '17 Pending Supervisory Review' },
                { code: '18', desc: 'Pending First Collection', text: '18 Pending First Collection' },

                { code: '19', desc: 'Refusal, pending follow-up', text: '19 Refusal, pending follow-up' },
                { code: '20', desc: 'Refusal, no reason given', text: '20 Refusal, no reason given' },
                { code: '21', desc: 'Refusal, non-mandatory survey', text: '21 Refusal, non-mandatory survey' },
                { code: '22', desc: 'Refusal, no time', text: '22 Refusal, no time' },
                { code: '23', desc: 'Refusal, confidentiality concern', text: '23 Refusal, confidentiality concern' },
                { code: '24', desc: 'Refusal, company policy against survey', text: '24 Refusal, company policy against survey' },
                { code: '25', desc: 'Refusal, no benefit to company', text: '25 Refusal, no benefit to company' },
                { code: '26', desc: 'Refusal, government intruding', text: '26 Refusal, government intruding' },
                { code: '27', desc: 'Refusal, too difficult', text: '27 Refusal, too difficult' },
                { code: '28', desc: 'Refusal, company too small', text: '28 Refusal, company too small' },
                { code: '29', desc: 'Refusal, other reason', text: '29 Refusal, other reason' },
                { code: '50', desc: 'Out of business', text: '50 Out of business' },
                { code: '51', desc: 'Out of scope, not in US', text: '51 Out of scope, not in US' },
                { code: '52', desc: 'Out of scope, business sold', text: '52 Out of scope, business sold' },
                { code: '53', desc: 'Out of scope, employees leased', text: '53 Out of scope, employees leased' },
                { code: '54', desc: 'Out of scope, industry', text: '54 Out of scope, industry' },
                { code: '60', desc: 'Data Unusable. For Supervisor use only.', text: '60 Data Unusable. For Supervisor use only.' },
                { code: '70', desc: 'Duplicate unit', text: '70 Duplicate unit' },
                { code: '71', desc: 'Cannot locate firm', text: '71 Cannot locate firm' },
                { code: '72', desc: 'Cannot locate a respondent', text: '72 Cannot locate a respondent' },
                { code: '81', desc: 'Non Response last month', text: '81 Non Response last month' },
                { code: '82', desc: 'Non Response last two months or more', text: '82 Non Response last two months or more' },
                { code: '83', desc: 'Firm Inactive', text: '83 Firm Inactive' },
                { code: '84', desc: 'Unable to report current month. But will report in the future.',
                              text: '84 Unable to report current month. But will report in the future.' },
                { code: '85', desc: 'Maximum Calls', text: '85 Maximum Calls' },
                { code: '90', desc: 'Successfully collected microdata', text: '90 Successfully collected microdata' },
                { code: '91', desc: 'Partial TE Reported', text: '91 Partial TE Reported' },
            ];
    }

    return respCode;
  }

  getLOPPByCode(code: string): Lopp {

    let lopp = this.getLOPP(true).find(c => c.code === code);
    if (lopp == null) {
      lopp = this.getLOPP(true).find(c => c.code === '0');
     // rempty object to avoid null exception on the receiving service
    }

    return lopp;
  }

  getLOPP(IsCES: boolean): Lopp[] {
    return [
                  { text: '0 - LOPP Unknown', code: '0' },
                  { text: '1 - Weekly', code: '1' },
                  { text: '2 - Bi-weekly', code: '2' },
                  { text: '3 - Semi-monthly', code: '3' },
                  { text: '4 - Monthly', code: '4' }];
  }

  getLOPPTemp(IsCES: boolean): LoppTemp[] {
    return [
      { desc: 'LOPP Unknown', code: '0' },
      { desc: 'Weekly', code: '1' },
      { desc: 'Bi-weekly', code: '2' },
      { desc: 'Semi-monthly', code: '3' },
      { desc: 'Monthly', code: '4' }];

  }

  getRollOverOptions(): Observable<RollOverOptions[]> {
    const options$ = this.IsCES$.pipe(
      map(isces => {
          if (isces) {
            return this.rollOverLookupModel.rollOverCESOptions;
          } else {
            return this.rollOverLookupModel.rollOverJOLTSOptions;
          }
      }));
    return options$;
  }

  getRollOverOptionsList(): RollOverOptions[] {
    if (this.isCES) {
      return this.rollOverLookupModel.rollOverCESOptions;
    } else {
      return this.rollOverLookupModel.rollOverJOLTSOptions;
    }
  }


getCesCMICodes() {
    return new CesCMI();
}

getJoltsCMICodes() {
  return new JoltsCMI();
}

  getRollOverQuestions(type): RollOverQuestion[] {
    switch (type) {
      case 'tde': {
        return this.rollOverLookupModel.rolloverTdeQuestions;
      }
      case 'web':
      case 'ftp':
      case 'webPro': {
        return this.rollOverLookupModel.rolloverWebQuestions;
      }
      case 'email': {
        return this.rollOverLookupModel.rolloverEmailQuestions;
      }
      case 'fax': {
        return this.rollOverLookupModel.rolloverFaxQuestions;
      }
    }
  }



  getRollOverScripts(): Map<string, string> {
    return this.rollOverLookupModel.rollOverErrorMessages;
  }




  isDispCodeFinal(dispCode: string) {
    const respCode = dispCode;
    return this.isRespCodeFinal(respCode);

  }

  isRespCodeFinal(respCode: string): boolean {
    return (respCode === '19' || respCode === '20' || respCode === '21' || respCode === '22' || respCode === '23' || respCode === '24'
    || respCode === '25' || respCode === '26' || respCode === '27' || respCode === '28' || respCode === '29' || respCode === '30' || respCode === '39'
    || respCode === '40' || respCode === '50' || respCode === '51' || respCode === '52' || respCode === '53' || respCode === '54' || respCode === '55'
    || respCode === '60' || respCode === '70' || respCode === '71' || respCode === '72' || respCode === '74');
  }

  isRespCodeRefusal(respCode: string): boolean {
    return (respCode === '19' || respCode === '20' || respCode === '21' || respCode === '22' || respCode === '23' || respCode === '24'
    || respCode === '25' || respCode === '26' || respCode === '27' || respCode === '28' || respCode === '29' || respCode === '30');
  }

  isRespCodeGoodData(respCode: string): boolean {
    return (respCode === '90' || respCode === '91' || respCode === '92' || respCode === '93' || respCode === '94' || respCode === '95'
    || respCode === '96' || respCode === '97' || respCode === '98' || respCode === '99');
  }

  isRespCodeNonResponse(respCode: string): boolean {
    return (respCode === '00' || respCode === '01' || respCode === '02' || respCode === '03' || respCode === '04' || respCode === '06'
    || respCode === '08' || respCode === '81' || respCode === '82');
  }

  isRespCodeCannotLocate(respCode: string): boolean {
    return (respCode === '71' || respCode === '72');
  }

  isRespCodeMaximumCalls(respCode: string): boolean {
    return (respCode === '85');
  }

  isRespCodeOutOfBusiness(respCode: string): boolean {
    return (respCode === '51' || respCode === '52' || respCode === '53' || respCode === '54' || respCode === '55' || respCode === '60');
  }

  isRespCodeDuplicate(respCode: string): boolean {
    return (respCode === '70' || respCode === '71' || respCode === '72' || respCode === '74');
  }

  isRespCodeUserAssigned(respCode: string): boolean {
    return !(respCode === '00' || respCode === '11' || respCode === '12' || respCode === '18' || respCode === '81' || respCode === '82'
    || respCode === '90' || respCode === '91');
  }

  isRespCodePendingFollowup(respCode: string): boolean {
    return (respCode === '19');
  }

  isRespCodePending(respCode: string): boolean {
    return (respCode === '10' || respCode === '11' || respCode === '12' || respCode === '13' || respCode === '14' || respCode === '15'
    || respCode === '16' || respCode === '17' || respCode === '18' || respCode === '19');
  }

  isRespCodeDelinquent(respCode: string): boolean {
    return (respCode === '81' || respCode === '82');
  }

  leftPad(number, targetLength) {
    var output = number + '';
    while (output.length < targetLength) {
        output = '0' + output;
    }
    return output;
  }
}
