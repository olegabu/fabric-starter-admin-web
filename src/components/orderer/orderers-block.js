import {inject} from "aurelia-dependency-injection";
import {customElement, bindable} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {EventAggregator} from "aurelia-event-aggregator";

import {IdentityService} from "../../services/identity-service";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {WebAppService} from "../../services/webapp-service";
import {EditOrderer} from './edit-orderer';


@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, WebAppService, DialogService)
export class OrderersBlock {

  @bindable osnList; // list of OSNs

  osn={};

  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService, dialogService) {
    this.chaincodeService = chaincodeService;
    this.dialogService = dialogService;
  }

  attached() {
  }


  createOSN() {
    this.dialogService.open({ viewModel: EditOrderer, model: this.osn, lock: false }).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }

}
