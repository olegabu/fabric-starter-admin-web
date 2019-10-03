import {DialogController} from 'aurelia-dialog';
import {customElement, bindable} from 'aurelia-framework';

export class EditScenario {
  static inject = [DialogController];

  @bindable scenarion = {};
  ordererTypes = [{id: 'solo', name: 'Solo'}, {id: 'etcdraft', name: 'RAFT'}, {id: 'bft', name: 'BFT'}];

  orderer = {
    type: null,
    name: 'orderer'

  };

  constructor(controller) {
    this.controller = controller;
  }

  activate(orderer) {
    this.orderer = orderer;
  }

}
