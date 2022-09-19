import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {AlertService} from './alert-service';
import {Config} from '../config';

let log = LogManager.getLogger('UtilService');


@inject(HttpClient, IdentityService, AlertService)
export class UtilService {

  constructor(http, identityService, alertService) {
    this.identityService = identityService;
    this.http = http;
    this.alertService = alertService;
  }

  fetch(url, params, method, org, username) {
    log.debug('fetch', params);
    log.debug(JSON.stringify(params));
    return new Promise((resolve, reject) => {
      const jwt = IdentityService.getJwt(org, username);

      let promise;

      if (method === 'get') {
        let query = '';
        if (params) {
          query = '?' + Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
        }

        promise = this.http.fetch(`${url}${query}`, {
          headers: {
            'Authorization': 'Bearer ' + jwt
          }
        });
      } else {
        promise = this.http.fetch(url, {
          method: method,
          body: json(params),
          headers: {
            'Authorization': 'Bearer ' + jwt
          }
        });
      }
      promise.then(response => {
        if (response.status === 401) {
          this.alertService.info('session expired, logging you out');
          this.identityService.logout();
          reject(new Error('Session expired, logging you out'));
        }
        response.json().then(j => {
          log.debug('fetch', j);
          if (!response.ok) {
            const msg = `${response.statusText} ${j}`;
            this.alertService.error(`${msg}. Status: ${response.status}`);
            reject(new Error(msg));
          } else {
            resolve(j);
          }
        });

      }).catch(err => {
        this.alertService.error(`caught ${err}`);
        reject(err);
      });
    });
  }

  fetchForFile(url, file, method, org, username) {
    return new Promise((resolve, reject) => {
      const jwt = IdentityService.getJwt(org, username);

      let promise;

      promise = this.http.fetch(url, {
        method: method,
        body: file,
        headers: {
          'Authorization': 'Bearer ' + jwt
        }
      });

      promise.then(response => {
        if (response.status === 401) {
          this.alertService.info('session expired, logging you out');
          this.identityService.logout();
          reject(new Error('Session expired, logging you out'));
        }
        if (! response || ! response.json) {
          return reject(response);
        }
        response.text().then(j => {
          log.debug('fetch', j);

          if (!response.ok) {
            const msg = `${response.statusText} ${j}`;
            this.alertService.error(`${msg}. Status: ${response.status}`);
            reject(new Error(msg));
          } else {
            try {
              j= JSON.parse(j)
            } catch (e) {
              log.debug('Not json', j)
            }
            resolve(j);
          }
        }).catch(err => {
          this.alertService.error(`caught ${err}`);
          reject(err);
        });
      });
    });
  }

  getRequest(logmessage, path, requestParams, extractResultFn) {
    log.debug(logmessage);
    const url = Config.getUrl(path);
    return new Promise((resolve, reject) => {
      this.fetch(url, requestParams, 'get').then(j => {
        resolve(extractResultFn ? extractResultFn(j) : j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  postRequest(logmessage, path, requestParams, uploadFile, extractResultFn) {
    const url = Config.getUrl(path);

    let resPromise = new Promise((resolve, reject) => {
      if (uploadFile) {
        this.postWithFile(url, uploadFile, reject, resolve);
      } else {
        this.postWithoutFile(url, requestParams, resolve, reject);
      }
    });
    return resPromise.then(response => extractResultFn ? extractResultFn(response) : response);
  }

  postWithFile(url, uploadFile, reject, resolve, org, username ) {
    this.fetchForFile(url, uploadFile, 'post', org, username).then(j => {
      if (j && j.startsWith && j.startsWith('Error')) {
        this.alertService.error(j);
        reject(j);
      } else {
        resolve(j);
      }
    }).catch(err => {
      reject(err);
    });
  }

  postWithoutFile(url, requestParams, resolve, reject, org, username) {
    this.fetch(url, requestParams, 'post', org, username).then(j => {
      resolve(j);
    }).catch(err => {
      reject(err);
    });
  }
}
