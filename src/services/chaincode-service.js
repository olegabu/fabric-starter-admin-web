import {inject, LogManager} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {AlertService} from './alert-service';
import {UtilService} from './util-service';


@inject(HttpClient, IdentityService, AlertService, UtilService)
export class ChaincodeService {

  constructor(http, identityService, alertService, utilService) {
    this.identityService = identityService;
    this.http = http;
    this.alertService = alertService;
    this.utilService = utilService;
  }

  queryChannels() {
    return this.utilService.getRequest('get Channels', 'channels', null, this.extractChannelId);
  }

  createChannel(proposal) {
    return this.utilService.postRequest('Create Channel', 'channels', proposal);
  }

  joinChannel(channelJoin, proposal) {
    return this.utilService.postRequest('Cannel join', `channels/${channelJoin}`, proposal);
  }

  queryInstalledChaincodes() {
    return this.utilService.getRequest('get Installed Chaincodes', 'chaincodes', null,
      cArr => (cArr.chaincodes || cArr).map(c => Object.assign({}, c, {idKey: c.name + ":" + c.version})));
  }

  installChaincode(formData) {
    return this.utilService.postRequest('Install chaincode', 'chaincodes', null, formData);
  }

  queryInstantiatedChaincodes(channel) {
    return this.utilService.getRequest('get Instantiated Chaincodes', `channels/${channel}/chaincodes`, null, this.extractChaincodes);
  }

  initChaincode(channel, formData) {
    return this.utilService.postRequest('Instantiate chaincode', `channels/${channel}/chaincodes`, null, formData);
  }

  upgradeChaincode(channel, formData) {
    return this.utilService.postRequest('Instantiate chaincode', `channels/${channel}/chaincodes/upgrade`, null, formData);
  }

  queryOrgs(channel, proposal) {
    return this.utilService.getRequest('get Organizations On Channel', `channels/${channel}/orgs`, proposal, this.extractOrgs);
  }

  queryPeers(channel) {
    return this.utilService.getRequest('get Organizations peers', `channels/${channel}/peers`);
  }

  addOrgToChannel(channel, params) {
    return this.utilService.postRequest('add Org to Channel', `channels/${channel}/orgs`, params);
  }

  invoke(channel, chaincode, proposal) {
    return this.utilService.postRequest('Invoke operation', `channels/${channel}/chaincodes/${chaincode}`,
      proposal, null, this.extractInvoke);
  }

  query(channel, chaincode, proposal) {
    return this.utilService.getRequest('Query operation', `channels/${channel}/chaincodes/${chaincode}`,
      proposal);
  }

  queryLastBlock(channel) {
    return this.utilService.getRequest('get Last Block', `channels/${channel}`, null, this.extractLastBlock);
  }

  queryBlock(num, channel) {
    return this.utilService.getRequest(`get Block with num ${num}`, `channels/${channel}/blocks/${num}`);
  }

  decodeCert(params) {
    return this.utilService.postRequest('get decoded certificate', 'cert', params, null)
  }

  getDomain() {
    return this.utilService.getRequest('get Domain', 'domain');
  }

  extractChannelId(result) {
    return result.map(o => {
      return o.channel_id;
    });
  }

  extractChaincodes(result) {
    if (result.chaincodes) {
      const chaincodes = result.chaincodes;
      return chaincodes.map(o => {
        return o.name + ':' + o.version;
      });
    } else
      return result.map(o => {
        return o.name + ':' + o.version;
      });
  }

  extractOrgs(result) {
    return result.map(o => {
      return o.id;
    });
  }

  extractLastBlock(result) {
    const test = result.height;
    return test.low;
  }

  extractInvoke(result) {
    if (result.badPeers && result.badPeers.length > 0) {
      this.alertService.error(`Bad peers ${result.badPeers.join('; ')}`);
    } else if (result.badPeers)
      delete result.badPeers;
    return result;
  }

}
