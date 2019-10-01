import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {UtilService} from './util-service';


@inject(HttpClient, IdentityService, UtilService)
export class WebAppService {

  constructor(http, identityService, utilService) {
    this.identityService = identityService;
    this.http = http;
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
