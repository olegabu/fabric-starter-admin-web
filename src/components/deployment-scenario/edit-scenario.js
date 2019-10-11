import 'bootstrap';
import {inject} from "aurelia-dependency-injection";
import {DialogController} from 'aurelia-dialog';
import {customElement, bindable, computedFrom} from 'aurelia-framework';
import {UtilService} from '../../services/util-service';

@inject(UtilService, DialogController)
export class EditScenario {
  // static inject = [DialogController];

  @bindable templates = {};
  ordererTypes = [{id: 'solo', name: 'Solo'}, {id: 'etcdraft', name: 'RAFT'}, {id: 'bft', name: 'BFT'}];

  @computedFrom('templates')
  get scenarios() {
    let scenarios = (this.templates && this.templates.scenarios && this.objToArray(this.templates.scenarios)) || [];
    if (scenarios.length) scenarios[scenarios.length-1].active = true;

    if (scenarios) {
      scenarios.forEach(scenario => {
        this.stepsAutoNumbering(scenario);
        this.evaluateDefaultParamValues(scenario, this.env);
      })
    }
    return scenarios;
  }

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
/*
    this.scenarios = (templates && templates.scenarios && this.objToArray(templates.scenarios)) || [];
    if (this.scenarios.length) this.scenarios[this.scenarios.length-1].active = true;

    if (this.scenarios) {
      this.scenarios.forEach(scenario => {
        this.stepsAutoNumbering(scenario);
        this.evaluateDefaultParamValues(scenario, env);

      })
    }
*/
  }

  stepsAutoNumbering(scenario) {
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

  objToArray(obj, prop) {
    if (prop && obj && obj[prop]){
      obj=obj[prop];
    }
    if (Array.isArray(obj)) {
      return obj;
    }
    let arr = obj && Object.keys(obj).map(key => Object.assign({}, obj[key], {
      id: key,
      label: obj[key] ? obj[key].name : key
    }));
    return arr || [];
  }

  async launchScenario(scenarioId) {
    let scenario = this.templates.scenarios[scenarioId];
    if (!scenario) {
      return;
    }
    let paramsObject = this.reduceParamsToKV(scenario.params);

    let launchResult = await this.utilService.postRequest("Request launch scenario", `deploy/${scenarioId}`, paramsObject);

  }

  reduceParamsToKV(params) {
    let result={};
    if (params && params.length) {
      result = params.reduce((result, param) => {
        if (param.name) {
          result[param.name] = param.value;
        }
        return result;
      }, {});
    }
    return result;
  }
}

