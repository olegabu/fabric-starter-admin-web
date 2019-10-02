import {DialogController} from 'aurelia-dialog';

export class EditOrderer {
  static inject = [DialogController];
  orderer = { name: 'orderer' };
  constructor(controller){
    this.controller = controller;
  }
  activate(orderer){
    this.orderer = orderer;
  }
}

