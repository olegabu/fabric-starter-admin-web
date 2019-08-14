import {inject, LogManager} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IdentityService} from './services/identity-service';
import {ChaincodeService} from './services/chaincode-service';
import {ConfigService} from './services/config-service';
import {AlertService} from './services/alert-service';
import {ConsortiumService} from './services/consortium-service';
import {WebAppService} from './services/webapp-service';
import JSONFormatter from '../node_modules/json-formatter-js/dist/json-formatter';
import {json} from "aurelia-fetch-client";

let log = LogManager.getLogger('Home');

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, WebAppService)
export class Home {
//Blocks
  blocks = []; // list of blocks
//Channels
  channelList = []; // list of channels
  channel = null; // chosen channel
  channelJoin = null;
  channelNew = null;
//Consortium
  consortiumInviteeIP = null;
  consortiumInviteeName = null;
  consortiumMembersList = [];
//Install Chaincode
  installLanguage = 'node';
  installedChaincodes = [];
  installVersion = null;
  chaincodeFile = null;
//Instantiate chaincodes
  selectedChaincode = null;
  selectedChain = null;
  initLanguage = 'node';
  initFcn = null;
  initArgs = null;
  chaincodeList = [];
  policy = null;
  orgs = [];
  privateCollectionFile = null;
//ADD orgs to channel
  orgList = [];
  newOrg = null;
  newOrgIp = null;
  anchorPeerPort = null;
//Uploaded WebApps
  installedWebApps = [];
  webAppFile = null;
//Uploaded Middlewares
  installedMiddlewares = [];
  middlewareFile = null;
//Operation
  operation = false;
  fcn = null;
  args = null;
  value = null;
  peers = [];
  targets = [];
//Info
  lastTx = null;
  creator = null;
  creatorCert = null;
  endorses = [];
  endorsesCert = [];
  block = null;
  show = false;
  qu = false;
  logShow = true;

//Load
  load = true;
  loadAdd = true;
  loadJ = true;
  loadI = true;

  type = 'None';
  policyType = ['None', 'Any', 'All', 'Majority'];
  policyBuilder = null;
  pol = true;
  selectedRoles = [];
  jsonPolicy = {};
  elements = ['info',
    'json',
    'input',
    'reads',
    'writes',
    'res'];
  domain = null;

  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService) {
    this.identityService = identityService;
    this.eventAggregator = eventAggregator;
    this.chaincodeService = chaincodeService;
    this.configService = configService;
    this.alertService = alertService;
    this.consortiumService = consortiumService;
    this.webAppService = webAppService;
  }

  attached() {
    // this.queryConsortium();
    this.queryChannels();
    this.queryInstalledChaincodes();
    this.queryInstalledWebApps();
    this.subscriberBlock = this.eventAggregator.subscribe('block', o => {
      log.debug('block', o);
      this.queryChannels();
      if (this.channel && (o.channel_id || (o.data.data[0] && o.data.data[0].payload.header.channel_header.channel_id) === this.channel))
        this.updateBlock();
      if (this.channel) {
        this.queryInstantiatedChaincodes();
        this.queryOrgs();
        this.queryPeers();
      }
    });
  }

  detached() {
    this.subscriberBlock.dispose();
  }

  queryChannels() {
    this.chaincodeService.queryChannels().then(channels => {
      this.channelList = channels;
      this.channelList.sort();
    });
  }

  createChannel() {
    this.alertService.info('Sent create channel request');
    this.loadAdd = false;
    this.chaincodeService.createChannel(this.buildProposal(true, this.channelNew)).then(() => {
      this.loadAdd = true;
    }).catch(() => {
      this.loadAdd = true;
    });
    this.channelList.sort();
    this.channelNew = null;
  }

  joinChannel() {
    this.alertService.info('Sent join channel request');
    this.loadJ = false;
    this.chaincodeService.joinChannel(this.channelJoin, this.buildProposal(true, this.channelJoin)).then(() => {
      this.loadJ = true;
    }).catch(() => {
      this.loadJ = true;
    });
    this.channelJoin = null;
  }

  queryInstalledChaincodes() {
    this.chaincodeService.queryInstalledChaincodes().then(chaincodes => {
      this.installedChaincodes = chaincodes;
    });
  }

  installChaincode() {
    this.alertService.info('Sent install chaincode request');
    let formData = new FormData();
    for (let i = 0; i < this.chaincodeFile.length; i++) {
      formData.append('file', this.chaincodeFile[i]);
      formData.append('targets', this.targets);
      formData.append('version', this.installVersion || '1.0');
      formData.append('language', this.installLanguage);
      this.chaincodeService.installChaincode(formData).then(res => {
        this.alertService.success(res);
        this.queryInstalledChaincodes();
      });
    }
  }

  queryInstantiatedChaincodes() {
    this.show = false;
    this.chaincodeService.queryInstantiatedChaincodes(this.channel).then(chaincodes => {
      this.chaincodeList = chaincodes;
    });
  }

  initChaincode() {
    if (this.selectedChain) {
      this.loadI = false;
      let formData;
      try {
        formData = this.createUploadForm();
        this.logger('Instantiate chaincode', this.selectedChain, this.channel, this.initFcn, this.initArgs);
      } catch (e) {
        this.alertService.error(e);
        return;
      }
      this.alertService.info('Sent instantiate request');
      this.chaincodeService.initChaincode(this.channel, formData).then(() => {
        this.loadI = true;
      }).catch(() => {
        this.loadI = true;
      });
    } else
      this.alertService.error('Select chaincode');
  }

  upgradeChaincode() {
    if (this.selectedChain) {
      this.loadI = false;
      let formData;
      try {
        formData = this.createUploadForm();
        this.logger('Upgrade chaincode', this.selectedChain, this.channel, this.initFcn, this.initArgs);

      } catch (e) {
        this.alertService.error(e);
        return;
      }
      this.alertService.info('Sent upgrade request');
      this.chaincodeService.upgradeChaincode(this.channel, formData).then(() => {
        this.loadI = true;
      }).catch(() => {
        this.loadI = true;
      });
    } else
      this.alertService.error('Select chaincode');
  }

  createUploadForm() {
    this.jsonPolicy = {
      identities: [],
      policy: {}
    };
    let formData = new FormData();
    if (this.privateCollectionFile) {
      for (let i = 0; i < this.privateCollectionFile.length; i++) {
        formData.append('file', this.privateCollectionFile[i]);
      }
    }
    formData.append('channelId', this.channel);
    formData.append('chaincodeId', this.selectedChain.split(':')[0]);
    formData.append('waitForTransactionEvent', 'true');
    formData.append('chaincodeType', this.initLanguage);
    formData.append('chaincodeVersion', this.selectedChain.split(':')[1]);
    if (this.initFcn)
      formData.append('fcn', this.initFcn);
    if (this.initArgs)
      formData.append('args', JSON.stringify(this.parseArgs(this.initArgs)));
    if (this.pol && this.type && this.type !== 'None')
      formData.append('policy', this.policyBuilder);
    else if (this.policy)
      formData.append('policy', this.policy.replace(/\s/g, '').trim());
    return formData;
  }

  policyBuild() {
    this.jsonPolicy = {
      identities: [],
      policy: {}
    };
    this.policyBuilder = null;
    Home.clear('policyBuilder');
    if (this.type === 'None') {
      document.getElementById('policyBuilder').value = '';
      return;
    }
    let orgsLenght = this.orgs.length === 0 ? this.orgList : this.orgs;
    if (this.type === 'Any')
      this.jsonPolicy.policy["1-of"] = this.countOrgs(orgsLenght.length);
    else if (this.type === 'All')
      this.jsonPolicy.policy[orgsLenght.length + "-of"] = this.countOrgs(orgsLenght.length);
    else {
      if (parseInt((orgsLenght.length / 2), 10) + 1 > orgsLenght.length) {
        throw Error('Majority bigger than orgs count')
      }
      this.jsonPolicy.policy[parseInt((orgsLenght.length / 2), 10) + 1 + "-of"] = this.countOrgs(orgsLenght.length);
    }
    for (let i = 0; i < orgsLenght.length; i++) {
      if (this.selectedRoles.indexOf(orgsLenght[i]) !== -1)
        this.jsonPolicy.identities[i] = {role: {name: "admin", mspId: orgsLenght[i]}};
      else
        this.jsonPolicy.identities[i] = {role: {name: "member", mspId: orgsLenght[i]}};
    }
    this.policyBuilder = JSON.stringify(this.jsonPolicy);
    document.getElementById('policyBuilder').value = this.policyBuilder;
  }

  countOrgs(num) {
    let array = [];
    for (let i = 0; i < num; i++) {
      array.push({"signed-by": i})
    }
    return array;
  }

  queryOrgs() {
    this.chaincodeService.queryOrgs(this.channel, {filter:true}).then(orgs => {
      this.orgList = orgs.sort();
    });
  }

  queryPeers() {
    this.peers = [];
    this.chaincodeService.queryPeers(this.channel).then(peers => {
      this.peers = peers;
    });
  }

  addOrgToChannel() {
    this.alertService.info('Sent invite');
    const params = {
      orgId: this.newOrg,
      orgIp: this.newOrgIp,
      peerPort: this.anchorPeerPort
    };
    this.logger('Add org to channel', 'none', this.channel, 'none', [this.newOrg, this.newOrgIp].join(' '));
    this.chaincodeService.addOrgToChannel(this.channel, params);
  }

  invoke() {
    this.load = false;
    this.clearAll();
    this.qu = false;
    this.lastTx = null;
    this.show = true;
    const chaincode = this.selectedChaincode.split(':')[0];
    this.logger('Invoke chaincode', this.selectedChain, this.channel, this.fcn, this.value);
    let args = this.parseArgs(this.value);
    this.alertService.info('Sent invoke');
    this.chaincodeService.invoke(this.channel, chaincode,
      this.buildProposal(true, this.channel, chaincode, this.fcn, args, this.targets)).then(invoke => {
      this.lastTx = invoke.txid;
      this.block = invoke.blockNumber;
      this.qu = true;
      this.load = true;
      Home.output(invoke, 'res');
    }).catch(() => {
      this.load = true;
    });
  }

  query() {
    this.load = false;
    this.clearAll();
    this.lastTx = null;
    this.show = true;
    this.qu = false;
    const chaincode = this.selectedChaincode.split(':')[0];
    this.alertService.info('Sent query');
    this.logger('Query chaincode', this.selectedChain, this.channel, this.fcn, this.value);
    let args = this.parseArgs(this.value);
    this.chaincodeService.query(this.channel, chaincode,
      this.buildProposal(false, this.channel, chaincode, this.fcn, args, this.targets)).then(query => {
      this.lastTx = query;
      Home.output(JSON.parse(query), 'res');
      this.load = true;
    }).catch(() => {
      this.load = true;
    });
  }

  parseArgs(value) {
    let args = [];
    let kova = false;
    let kovb = false;
    let skoba = 0;
    let skobb = 0;
    let prob = false;
    let comma = false;
    let arg = '';
    if (value) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] === '\'' && !kovb && skoba === 0 && skobb === 0) {
          prob = false;
          if (kova) {
            kova = false;
            args.push(arg.replace(/^\s/g, '').trim());
            arg = '';
          } else {
            kova = true;
          }
        } else if (value[i] === '\"' && !kova && skoba === 0 && skobb === 0) {
          prob = false;
          if (kovb) {
            kovb = false;
            args.push(arg.replace(/^\s/g, '').trim());
            arg = '';
          } else {
            kovb = true;
          }
        } else if (value[i] === '\[' && !kova && !kovb && skobb === 0) {
          prob = false;
          skoba++;
          arg += value[i];
        } else if (value[i] === '\]' && !kova && !kovb && skobb === 0) {
          prob = false;
          skoba--;
          arg += value[i];
          if (skoba === 0) {
            try {
              args.push(JSON.parse(arg.replace(/^\s/g, '').trim()));
            } catch (e) {
              args.push(arg.replace(/^\s/g, '').trim());
            }
            arg = '';
          }
        } else if (value[i] === '\{' && !kova && !kovb && skoba === 0) {
          prob = false;
          skobb++;
          arg += value[i];
        } else if (value[i] === '\}' && !kova && !kovb && skoba === 0) {
          prob = false;
          skobb--;
          arg += value[i];
          if (skobb === 0) {
            args.push(arg.replace(/^\s/g, '').trim());
            arg = '';
          }
        } else if (value[i] === ' ' && !kova && !kovb && skoba === 0 && skobb === 0) {
          if (prob && arg !== '') {
            prob = false;
            args.push(arg.replace(/^\s/g, '').trim());
            arg = '';
          } else {
            prob = true;
            if (arg !== '') {
              args.push(arg.replace(/^\s/g, '').trim());
              arg = '';
            }
          }
        } else if (value[i] === ',' && !kova && !kovb && skoba === 0 && skobb === 0) {
          if (comma && arg !== '') {
            comma = false;
            args.push(arg.replace(/^\s/g, '').trim());
            arg = '';
          } else {
            comma = true;
            if (arg !== '') {
              args.push(arg.replace(/^\s/g, '').trim());
              arg = '';
            }
          }
        } else {
          arg += value[i];
        }
      }
      if (arg !== '') {
        args.push(arg.replace(/^\s/g, '').trim());
      }
    }
    return args;
  }

  queryBlocks() {
    this.blocks = [];
    let bl = [];
    this.selectedChaincode = null;
    this.chaincodeService.queryLastBlock(this.channel).then(block => {
      for (let i = block - 5; i < block; i++) {
        if (i < 0)
          continue;
        this.chaincodeService.queryBlock(i, this.channel).then(block => {
          let txid = [];
          for (let j = 0; j < block.data.data.length; j++) {
            txid.push(block.data.data[j].payload.header.channel_header.tx_id);
          }
          bl.push({blockNumber: block.header.number, txid: txid.join('; ')});
          bl.sort(function (a, b) {
            return a.blockNumber - b.blockNumber;
          });
        });
      }
    });
    bl.sort(function (a, b) {
      return a.blockNumber - b.blockNumber;
    });
    this.blocks = bl;
  }

  updateBlock() {
    this.chaincodeService.queryLastBlock(this.channel).then(lastBlock => {
      this.chaincodeService.queryBlock(lastBlock - 1, this.channel).then(block => {
        let txid = [];
        if ((lastBlock - 1).toString() === this.block) {
          this.endorses = [];
          Home.clear('json');
          Home.output(block, 'json');
        }
        for (let j = 0; j < block.data.data.length; j++) {
          const info = block.data.data[j].payload;
          if (info.header.channel_header.tx_id === this.lastTx) {
            Home.parseBlock(info);
            this.decodeCert(info.header.signature_header.creator.IdBytes).then(o => {
                this.creator = o.subject.commonName + '@' + o.issuer.organizationName;
                this.creatorCert = o;
              }
            );
            const endorsers = info.data.actions[0].payload.action.endorsements;
            for (let i = 0; i < endorsers.length; i++) {
              this.decodeCert(endorsers[i].endorser.IdBytes).then(o => {
                this.endorses.push(o.subject.commonName);
                this.endorsesCert.push(o);
              });
            }
          }
          txid.push(info.header.channel_header.tx_id);
        }

        if (!(lastBlock - 1 + '' === this.blocks[this.blocks.length - 1].blockNumber)) {
          if (this.blocks.length > 4)
            this.blocks.splice(0, 1);
          this.blocks.push({blockNumber: lastBlock - 1 + '', txid: txid.join('; ')});
        }

      });
    });
  }

  decodeCert(cert) {
    const params = {
      cert: cert
    };
    return this.chaincodeService.decodeCert(params);
  }

  hideTx() {
    this.lastTx = null;
    this.qu = false;
  }


  queryConsortium() {
    this.consortiumService.queryOrgInconsortium().then((orgs) => {
      console.log(consortiumMembersList);
      this.consortiumMembersList = orgs;
    });
  }

  addToConsortium() {
    const params = {orgId: this.consortiumInviteeName};
    this.consortiumService.inviteByName(params).then((result) => {
      this.alertService.success(`${this.consortiumInviteeName} added to the consortium`);
      this.queryConsortium();
    });
  }

  queryInstalledWebApps() {
    this.webAppService.getWebApps().then(items => {
      this.installedWebApps = items;
    });
    this.webAppService.getMiddlewares().then(items => {
      this.installedMiddlewares = items;
    });
  }

  installWebApp() {
    let formUrlEncoded = this.createUploadFileForm(this.webAppFile);
    return this.webAppService.installWebApp(formUrlEncoded).then(() => this.queryInstalledWebApps());
  }

  installMiddleware() {
    let formUrlEncoded = this.createUploadFileForm(this.middlewareFile);
    return this.webAppService.installMiddleware(formUrlEncoded).then(() => this.queryInstalledWebApps());
  }

  createUploadFileForm(fileElement, fields) {
    let formData = new FormData();
    for (let i = 0; i < fileElement.length; i++) {
      formData.append('file', fileElement[i]);
    }
    if (fields) Object.keys(fields).forEach(k => formData.append(k, fields[k]));
    return formData;
  }

  static output(inp, id) {
    const formatter = new JSONFormatter(inp);
    const el = document.getElementById(id);
    if (el)
      el.appendChild(formatter.render());
  }

  static clear(id) {
    const el = document.getElementById(id);
    if (el && el.firstChild) {
      while (el.firstChild)
        el.removeChild(el.firstChild);
    }
  }

  clearAll() {
    this.endorsesCert = [];
    this.endorses.forEach(function (elements) {
      Home.clear(elements);
    });
    this.endorses = [];
    this.elements.forEach(function (element) {
      Home.clear(element);
    });
  }

  static parseBlock(block) {
    let action = block.data.actions;
    let rwset = [];
    for (let i = 0; i < action.length; i++) {
      let payload = action[i].payload.chaincode_proposal_payload.input.chaincode_spec.input.args;
      for (let j = 0; j < payload.length; j++) {
        let str = '';
        for (let k = 0; k < payload[j].data.length; k++) {
          str += String.fromCharCode(payload[j].data[k]);
        }
        rwset.push(str);
      }
      Home.clear('input');
      Home.output(rwset, 'input');
    }
    rwset = [];
    for (let i = 0; i < action.length; i++) {
      let payload = action[i].payload.action.proposal_response_payload.extension.results.ns_rwset;
      for (let j = 0; j < payload.length; j++) {
        for (let k = 0; k < payload[j].rwset.writes.length; k++) {
          rwset.push(payload[j].rwset.writes[k])
        }
      }
    }
    Home.clear('writes');
    Home.output(rwset, 'writes');
    rwset = [];
    for (let i = 0; i < action.length; i++) {
      let payload = action[i].payload.action.proposal_response_payload.extension.results.ns_rwset;
      for (let j = 0; j < payload.length; j++) {
        for (let k = 0; k < payload[j].rwset.reads.length; k++) {
          rwset.push(payload[j].rwset.reads[k]);
        }
      }
    }
    Home.clear('reads');
    Home.output(rwset, 'reads');
  }

  showCert(o, creator) {
    let btn = document.getElementById(o + 'b').childNodes[0].nodeValue.replace(/^\s/g, '').trim();
    document.getElementById(o + 'b').childNodes[0].nodeValue = btn === 'Show cert' ? 'Hide cert' : 'Show cert';
    const el = document.getElementById(o);
    if (el && el.firstChild) {
      while (el.firstChild)
        el.removeChild(el.firstChild);
    } else if (creator) {
      Home.clear(o);
      Home.output(this.creatorCert, o);
    } else {
      for (let i = 0; i < this.endorsesCert.length; i++) {
        if (this.endorsesCert[i].subject.commonName === o) {
          Home.clear(o);
          Home.output(this.endorsesCert[i], o);
        }
      }
    }
  }

  select(value) {
    this.pol = value;
  }

  hide() {
    this.logShow = !this.logShow;
  }

  logger(operation, chaincode, channel, fcn, args) {
    const el = document.getElementById('log');
    if (el)
      el.appendChild(document.createTextNode(`[${new Date().toISOString()}] - DEBUG: Operation[${operation}] chaincode[${chaincode}] channel[${channel}] function[${fcn}] arguments[${args}] `));
    el.appendChild(document.createTextNode("\n"));
  }

  clearLog() {
    Home.clear('log')
  }

  buildProposal(invoke, channel, chaincode, fcn, args, targets) {
    let requestParams = {
      channelId: channel
    };
    if (chaincode)
      requestParams.chaincodeId = chaincode;
    if (fcn)
      requestParams.fcn = fcn.trim();
    if (invoke) {
      requestParams.waitForTransactionEvent = true;
      requestParams.args = args;
      requestParams.targets = targets;
    } else {
      requestParams.args = json(args);
      requestParams.targets = json(targets);
    }
    return requestParams;
  }
}
