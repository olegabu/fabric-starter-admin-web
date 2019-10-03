import {inject} from "aurelia-dependency-injection";
import {DialogService} from 'aurelia-dialog';
import {IdentityService} from "../../services/identity-service";
import {EventAggregator} from "aurelia-event-aggregator";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {WebAppService} from "../../services/webapp-service";
import {EditScenario} from "./edit-scenario";

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, WebAppService, DialogService)
export class DeploymentScenario {

  osn = {};

  scenario = {
    steps: [
      {
        step: "1",
        name: 'Start RAFT node',
        params: {ordererName: 'raft1', configtxTemplate: '3-raft-node-template.yaml'},
        auto: 'true',
      },
      {
        step: "2",
        name: 'Start RAFT node',
        param: {ordererName: 'raft2', genesisBlockPath: "configtx/genesis.pb"},
        auto: 'true',
      },
      {
        step: "3",
        name: 'Start RAFT node',
        params: {ordererName: 'raft3', genesisBlockPath: "configtx/genesis.pb"},
        auto: 'true',
      },
      {
        step: "4",
        name: 'Wait for RAFT OSN is active',
        params: {address: "raft1.org1.example.com:7050"},
        auto: 'true',
      },
      {
        step: "5",
        name: 'Wait for RAFT OSN is active',
        params: {address: "raft1.org1.example.com:7050"},
        auto: 'true',
      },
      {
        step: "6",
        name: 'Signal org2 to prepere RAFT node',
        params: {address: "api.org2.example.com:4000/raft/prepare"},
        auto: 'true',
      },
      {
        step: "7",
        name: 'Add RAFT node to RAFT-OSN configuration',
        params: {raftNode:"raft1.org2.example.com", wwwPort:"80"},
        auto: 'true',
      },
      {
        step: "8",
        name: 'Add RAFT node to RAFT-OSN configuration',
        params: {raftNode:"raft1.org2.example.com", wwwPort:"80"},
        auto: 'true',
      },
      {
        step: "9",
        name: 'Signal org2 to start RAFT node',
        params: {address: "api.org2.example.com:4000/raft/start"},
        auto: 'true',
      },
    ]
  };


  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService, dialogService) {
    this.dialogService = dialogService;
  }

  createScenario() {
    this.dialogService.open({viewModel: EditScenario, model: this.osn, lock: false}).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }
}

