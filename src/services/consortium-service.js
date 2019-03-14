import { LogManager } from 'aurelia-framework';
import { inject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { IdentityService } from './identity-service';
import { AlertService } from './alert-service';
import { Config } from '../config';
import { ChaincodeService } from './chaincode-service';

let log = LogManager.getLogger('ChaincodeService');

const baseUrl = Config.getUrl('channels');

@inject(HttpClient, IdentityService, AlertService, ChaincodeService)
export class ConsortiumService {

    constructor(http, identityService, alertService, chaincodeService) {
        this.identityService = identityService;
        this.http = http;
        this.alertService = alertService;
        this.chaincodeService = chaincodeService
    }

    inviteByName(name, org, username) {
        const  params = { orgId: name }
        return new Promise((resolve, reject) => {
            console.log('params:', params);
            this.chaincodeService.fetch(Config.getUrl('consortium/members'), params, 'post', org, username)
                .then(res => {
                    console.log(res);
                    resolve(res)
                })
                .catch(err => {
                    reject(err)
                })
        }, setTimeout(4000));
    }

    query(username) {

        console.log(this.chaincodeService);
        return new Promise((resolve, reject) => {

            this.chaincodeService.fetch(Config.getUrl('consortium/members'), null, 'get', username)
                .then(result => {
                    console.log(result);
                    resolve(result)
                })
                .catch(err => {
                    console.log(err);
                    reject(err)
                })
        });
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
