import {DialogController} from 'aurelia-dialog';

export class EditOrderer {
  static inject = [DialogController];

  ordererTypes=[{id: 'solo', name:'Solo'}, {id: 'etcdraft', name:'RAFT'}, {id: 'bft', name:'BFT'} ];

  orderer = {
    type: null,
    name: 'orderer'

  };

  constructor(controller){
    this.controller = controller;
  }
  activate(orderer){
    this.orderer = orderer;
  }
}

