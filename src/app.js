import 'bootstrap';
import {I18N} from 'aurelia-i18n';
import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {IdentityService} from './services/identity-service';
import {SocketService} from './services/socket-service';
import {AlertService} from './services/alert-service';
import {ChaincodeService} from "./services/chaincode-service";

let log = LogManager.getLogger('App');

@inject(I18N, IdentityService, SocketService, AlertService, ChaincodeService)
export class App {
  domain = null;

  constructor(i18n, identityService, socketService, alertService, chaincodeService,) {
    this.i18n = i18n;
    // this.i18n.setLocale(navigator.language || 'en');
    this.i18n.setLocale('ru');
    this.identityService = identityService;
    this.socketService = socketService;
    this.alertService = alertService;
    this.chaincodeService = chaincodeService;
  }

  configureRouter(config, router) {
    config.title = this.i18n.tr('appName');
    let routes = [
      {route: ['', 'home'], name: 'home', moduleId: './home', nav: true, title: this.i18n.tr('home')}
    ];
    config.map(routes);
    this.router = router;
  }

  attached() {
    this.username = this.identityService.username;
    this.org = this.identityService.org;
    this.socketService.subscribe();
    this.chaincodeService.getDomain().then(domain => {
      this.domain = domain;
    });
  }

  getDomain() {
    this.chaincodeService.getDomain().then(domain => {
      this.domain = domain;
    });
  }

  detached() {
    log.debug('detached');
    // this.socketService.disconnect();
  }

  logout() {
    this.identityService.logout().then(() => {
      this.alertService.success(`logged out`);
    }).catch(e => {
      this.alertService.error(`cannot log out, caught ${e}`);
    });
  }

}
