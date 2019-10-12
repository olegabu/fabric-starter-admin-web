import {inject} from "aurelia-dependency-injection";
import {customElement, bindable} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {EventAggregator} from "aurelia-event-aggregator";

import {IdentityService} from "../../services/identity-service";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {UtilService} from "../../services/util-service";
import {EditScenario} from "../deployment-scenario/edit-scenario";



@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, UtilService, DialogService)
export class OrgsBlock {

  @bindable orgList; // list of OSNs

  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, utilService, dialogService) {
    this.utilService = utilService;
    this.dialogService = dialogService;
  }


  keys(obj) {
    return obj ? Object.keys(obj) : [];
  }

  createScenario() {
    this.dialogService.open({viewModel: EditScenario, model: this.templates, lock: false}).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }
}
