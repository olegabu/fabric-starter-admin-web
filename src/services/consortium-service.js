import {inject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {AlertService} from './alert-service';
import {UtilService} from './util-service';

@inject(HttpClient, IdentityService, AlertService, UtilService)
export class ConsortiumService {

  constructor(http, identityService, alertService, utilService) {
    this.identityService = identityService;
    this.http = http;
    this.alertService = alertService;
    this.utilService = utilService;
  }

  inviteByName(proposal, org, username) {
    return this.utilService.postRequest('invite org by name to consortium', 'consortium/members', proposal);
  }

  queryOrgInconsortium() {
    return this.utilService.getRequest('get org in consortium', 'consortium/members');
  }

  //   info(m) {
  //     this.toastr.info(m);
  //   }

  //   error(m) {
  //     this.toastr.error(m);
  //   }

  //   success(m) {
  //     this.toastr.success(m);
  //   }

}
