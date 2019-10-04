import {DialogController} from 'aurelia-dialog';
import {customElement, bindable} from 'aurelia-framework';

export class EditScenario {
  static inject = [DialogController];

  @bindable scenario = {};
  ordererTypes = [{id: 'solo', name: 'Solo'}, {id: 'etcdraft', name: 'RAFT'}, {id: 'bft', name: 'BFT'}];

  orderer = {
    type: null,
    name: 'orderer'

  };

  constructor(controller) {
    this.controller = controller;
  }

  activate(scenario) {
    this.scenario = scenario;
  }

  scenarioKeys(stepNum) {
    return this.scenario.steps[stepNum].params && Object.keys(this.scenario.steps[stepNum].params);
  }

}
