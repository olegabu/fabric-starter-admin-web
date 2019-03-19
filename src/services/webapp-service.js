import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {AlertService} from './alert-service';
import {UtilService} from './util-service';


@inject(HttpClient, IdentityService, AlertService, UtilService)
export class WebAppService {

  constructor(http, identityService, alertService, utilService) {
    this.identityService = identityService;
    this.http = http;
    this.alertService = alertService;
    this.utilService = utilService;
  }

  getWebApps(org, username) {
    return this.utilService.getRequest('get WebApps', 'applications');
  }

  installWebApp(uploadFile, context,  org, username) {
    return this.utilService.postRequest('Install WebApp', 'applications', null, uploadFile);
  }

  installMiddleware(uploadFile, context,  org, username) {
    return this.utilService.postRequest('Install Middleware', 'middlewares', null, uploadFile);
  }

  getMiddlewares(org, username) {
    return this.utilService.getRequest('get Middlewares', 'middlewares');
  }

}
