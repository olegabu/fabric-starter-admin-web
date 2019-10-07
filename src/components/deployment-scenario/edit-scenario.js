import 'bootstrap';
import {inject} from "aurelia-dependency-injection";
import {DialogController} from 'aurelia-dialog';
import {customElement, bindable} from 'aurelia-framework';
import {UtilService} from '../../services/util-service';

@inject(UtilService, DialogController)
export class EditScenario {
  // static inject = [DialogController];

  @bindable templates = null;
  ordererTypes = [{id: 'solo', name: 'Solo'}, {id: 'etcdraft', name: 'RAFT'}, {id: 'bft', name: 'BFT'}];

  orderer = {
    type: null,
    name: 'orderer'

  };

  constructor(utilService, controller) {
    this.controller = controller;
    this.utilService = utilService;
  }

  async activate(templates) {

    let env = await this.utilService.getRequest('get Env', 'env');
    this.env = env;


    this.templates = templates;
    this.scenarios = (templates && templates.scenarios && this.objToArray(templates.scenarios)) || [];
    if (this.scenarios.length) this.scenarios[0].active = true;

    if (this.scenarios) {
      this.scenarios.forEach(scenario => {
        this.stepsAutoNambering(scenario);
        this.evaluateDefaultParamValues(scenario, env);

      })
    }
  }


  stepsAutoNambering(scenario) {
    let i = 1;
    if (scenario.steps) scenario.steps.forEach(step => {
      step.stepNum = i++;
    });
  }

  evaluateDefaultParamValues(scenario, env) {
    if (scenario.params && this.env) {
      scenario.params.forEach(param => {
        for (let key of Object.keys(env)) {
          if (param && param.value) {
            param.value = param.value.replace(new RegExp("\\${" + key + "}", 'g'), env[key]);
          }
          console.log(param.value);
        }
      });
    }
  }

  objToArray(obj) {
    let arr = obj && Object.keys(obj).map(key => Object.assign({}, obj[key], {
      id: key,
      label: obj[key] ? obj[key].name : key
    }));
    return arr || [];
  }


  async launchScenario(scenarioId) {
    let scenario = this.templates.scenarios[scenarioId];
    if (scenario && scenario.params && scenario.params.length) {
      const paramsObject = scenario.params.reduce((result, param)=>{
      if (param.name) {
        result[param.name] = param.value;
      }
      return result;
    }, {});
    let launchResult = await this.utilService.postRequest("Request launch scenario", "deploy", paramsObject);
    }

  }
}

