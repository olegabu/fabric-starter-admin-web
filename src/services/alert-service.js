import {inject} from 'aurelia-framework';
import {LogManager} from 'aurelia-framework';
import * as toastr from 'toastr';

let log = LogManager.getLogger('AlertService');

@inject(toastr)
export class AlertService {

  constructor(toastr) {
    this.toastr = toastr;
    this.toastr.options.positionClass = 'toast-bottom-right';
    this.toastr.options.progressBar = true;
    this.toastr.options.closeButton = true;
    this.toastr.options.timeOut = 1000;
    this.toastr.options.extendedTimeOut = 2000;
  }

  info(m) {
    this.toastr.info(m);
  }

  error(m) {
    this.toastr.error(m);
  }

  success(m) {
    this.toastr.success(m);
  }

}
