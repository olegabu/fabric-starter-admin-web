import {inject} from "aurelia-dependency-injection";
import {customElement, bindable} from 'aurelia-framework';
import {IdentityService} from "../../services/identity-service";
import {EventAggregator} from "aurelia-event-aggregator";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {WebAppService} from "../../services/webapp-service";
import {DialogService} from 'aurelia-dialog';
import {EditOrderer} from './edit-orderer';


@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, WebAppService, DialogService)
@customElement('orderers-block')
export class OrderersBlock {
  osnList = []; // list of OSNs


  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService, dialogService) {
    this.chaincodeService = chaincodeService;
  }

  attached() {
    this.queryOSNs()
  }


  queryOSNs() {
    this.chaincodeService.queryOSNs().then(osns => {
      this.osnList = osns;
      this.osnList.sort();
    });
  }

}
