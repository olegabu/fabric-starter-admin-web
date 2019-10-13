import {inject} from "aurelia-dependency-injection";
import {DialogService} from 'aurelia-dialog';
import {IdentityService} from "../../services/identity-service";
import {EventAggregator} from "aurelia-event-aggregator";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {UtilService} from "../../services/util-service";
import {EditScenario} from "./edit-scenario";

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, UtilService, DialogService)
export class DeploymentScenario {

  osn = {};

  templates = {};


  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, utilService, dialogService) {
    this.dialogService = dialogService;
    this.utilService = utilService;
  }

  attached() {
    // this.createScenario();
  }

  createScenario() {
    this.utilService.getRequest("get tasks", "tasks").then(tasks=>{
      this.utilService.getRequest("get tasks settigns", "settings/tasks").then(taskSettings=>{
        Object.keys(tasks).forEach(k=>{
          tasks[k].auto=taskSettings[k] && taskSettings[k].auto;
        });
        this.templates.tasks=tasks;
      });
    });

    this.utilService.getRequest("get scenarios", "scenarios").then(scenarios=>{
      this.templates.scenarios=scenarios;
    });

    this.dialogService.open({viewModel: EditScenario, lock: false}).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }
}

