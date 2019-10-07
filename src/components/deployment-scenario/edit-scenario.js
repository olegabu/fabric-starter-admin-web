import 'bootstrap';
import {DialogController} from 'aurelia-dialog';
import {customElement, bindable} from 'aurelia-framework';

export class EditScenario {
  static inject = [DialogController];

  @bindable templates = null;
  ordererTypes = [{id: 'solo', name: 'Solo'}, {id: 'etcdraft', name: 'RAFT'}, {id: 'bft', name: 'BFT'}];

  orderer = {
    type: null,
    name: 'orderer'

  };

  constructor(controller) {
    this.controller = controller;
  }

  activate(templates) {
    this.templates = templates;
    this.scenarios = (templates && templates.scenarios && this.objToArray(templates.scenarios)) || [];
    if (this.scenarios.length) this.scenarios[1].active = true;

    if (this.scenarios) {
      this.scenarios.forEach(scenario => {
        let i = 1;
        if (scenario.steps) scenario.steps.forEach(step => {
          step.stepNum = i++;
        })
      })
    }
  }

  scenarioKeys(scenario, stepNum) {
    return scenario.steps[stepNum].params && Object.keys(scenario.steps[stepNum].params);
  }

  objToArray(obj) {
    let arr = obj && Object.keys(obj).map(key => Object.assign({}, obj[key], {id: key, label: obj[key].name}));
    return arr || [];
  }
}
