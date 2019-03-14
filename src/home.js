import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IdentityService} from './services/identity-service';
import {ChaincodeService} from './services/chaincode-service';
import {ConfigService} from './services/config-service';
import {AlertService} from './services/alert-service';
import { ConsortiumService } from './services/consortium-service';
import JSONFormatter from '../node_modules/json-formatter-js/dist/json-formatter';

let log = LogManager.getLogger('Home');

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService)
export class Home {
  channelList = [];
  chaincodeList = [];
  orgList = [];
  installedChain = [];
  blocks = [];
  targets = [];
  oneChannel = null;
  oneChaincode = null;
  targs = [];
  newOrg = null;
  fnc = null;
  args = null;
  selectedChain = null;
  oneCh = null;
  file = null;
  initArgs = null;
  block = null;
  joinCh = null;
  show = true;
  language = 'node';
  lastTx = null;
  version = null;
  instLanguage = 'node';
  instVersion = null;
  cert = true;
  endorse = [];
  consortiumInviteeIP = null;
  consortiumInviteeName = null;

  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService) {
    this.identityService = identityService;
    this.eventAggregator = eventAggregator;
    this.chaincodeService = chaincodeService;
    this.configService = configService;
    this.alertService = alertService;
    this.consortiumService = consortiumService
  }

  attached() {
    this.queryConsortium();
    this.queryChannels();
    this.queryInstalledChaincodes();
    this.subscriberBlock = this.eventAggregator.subscribe('block', o => {
      log.debug('block', o);
      this.queryChannels();
      if (o.channel_id === this.oneChannel)
        this.updateBlock();
      if (this.oneChannel) {
        this.queryChaincodes();
        this.queryOrgs();
        this.queryPeers();
      }
    });
  }

  detached() {
    this.subscriberBlock.dispose();
  }

  queryChannels() {
    this.chaincodeService.getChannels().then(channels => {
      this.channelList = channels;
      this.channelList.sort();
    });
  }

  addChannel() {
    this.chaincodeService.addChannel(this.oneCh);
    this.channelList.sort();
    this.oneCh = null;
  }

  installChaincode() {
    let formData = new FormData();
    for (let i = 0; i < this.file.length; i++) {
      formData.append('file', this.file[i]);
      // formData.append('channelId', this.oneChannel);
      formData.append('targets', this.targs);
      formData.append('version', this.version || '1.0');
      formData.append('language', this.language);
      this.chaincodeService.installChaincode(formData).then(j => {
        this.queryInstalledChaincodes();
      });
    }
  }

  initChaincode() {
    if (this.selectedChain) {
      this.alertService.info("Send instantiate request");
      this.chaincodeService.instantiateChaincode(this.oneChannel, this.selectedChain, this.instLanguage, this.instVersion, this.initArgs);
    }
    else
      this.alertService.error("Select chaincode");

  }

  queryChaincodes() {
    this.show = false;
    this.chaincodeService.getChaincodes(this.oneChannel).then(chaincodes => {
      this.chaincodeList = chaincodes;
    });
  }

  queryPeers() {
    this.targets = [];
    this.chaincodeService.getPeersForOrgOnChannel(this.oneChannel).then(peers => {
      for (let i = 0; i < peers.length; i++) {
        this.targets.push(peers[i]);
      }
    });
  }

  queryOrgs() {
    this.chaincodeService.getOrgs(this.oneChannel).then(orgs => {
      this.orgList = orgs;
      this.orgList.sort();
    });
  }

  queryInstalledChaincodes() {
    this.chaincodeService.getInstalledChaincodes().then(chain => {
      this.installedChain = chain;
    });
  }

  addOrgToChannel() {
    this.alertService.info("Send invite");
    this.chaincodeService.addOrgToChannel(this.oneChannel, this.newOrg);
    this.newOrg = null;
  }

  joinChannel() {
    this.chaincodeService.joinChannel(this.joinCh);
    this.joinCh = null;
  }

  getInvoke() {
    if (this.fnc && this.args)
      this.chaincodeService.invoke(this.oneChannel, this.oneChaincode, this.fnc, this.args, this.targs).then(invoke => {
        this.lastTx = invoke._transaction_id;
        Home.output(invoke, "res");
      });
    else
      this.alertService.error("Write function and arguments");
  }

  getQuery() {
    if (this.oneChaincode === null || this.chaincodeList.indexOf(this.oneChaincode) === -1) {
      this.alertService.error("Choose chaincode");
    }
    else
      this.chaincodeService.query(this.oneChannel, this.oneChaincode, this.fnc, this.args, this.targs).then(query => {
        Home.output(query, "res");
      });
  }

  getLastBlock() {
    this.chaincodeService.getLastBlock(this.oneChannel).then(lastBlock => {
      this.chaincodeService.getBlock(this.oneChannel, lastBlock - 1).then(block => {
        Home.output(block, "json");
        const info = block.data.data[block.data.data.length - 1].payload;
        this.decodeCert(info.header.signature_header.creator.IdBytes).then(o => {
            Home.output(o, "info");
            Home.output(o.subject.commonName + "@" + o.issuer.organizationName, "creatorName");
          }
        );
      });
    });
  }

  queryBlocks() {
    this.blocks = [];
    let bl = [];
    this.oneChaincode = null;
    this.chaincodeService.getLastBlock(this.oneChannel).then(block => {
      for (let i = block - 5; i < block; i++) {
        if (i < 0)
          continue;
        this.chaincodeService.getBlock(this.oneChannel, i).then(block => {
          let txid = [];
          for (let j = 0; j < block.data.data.length; j++) {
            txid.push(block.data.data[j].payload.header.channel_header.tx_id)
          }
          bl.push({blockNumber: block.header.number, txid: txid.join('; ')});
          bl.sort(function (a, b) {
            return a.blockNumber - b.blockNumber
          });
        });
      }
    });
    bl.sort(function (a, b) {
      return a.blockNumber - b.blockNumber
    });
    this.blocks = bl;
  }

  updateBlock() {
    this.endorse = [];
    if (this.blocks.length > 4)
      this.blocks.splice(0, 1);
    this.chaincodeService.getLastBlock(this.oneChannel).then(lastBlock => {
      this.chaincodeService.getBlock(this.oneChannel, lastBlock - 1).then(block => {
        let txid = [];
        Home.output(block, "json");
        for (let j = 0; j < block.data.data.length; j++) {
          const info = block.data.data[j].payload;
          if (info.header.channel_header.tx_id === this.lastTx) {
            Home.parseBlock(info);
            this.decodeCert(info.header.signature_header.creator.IdBytes).then(o => {
                Home.output(o.subject.commonName + "@" + o.issuer.organizationName, "creatorName");
              }
            );
            Home.clear("endorsers");
            Home.clear("endorsersCert");
            const endorsers = info.data.actions[0].payload.action.endorsements;
            for (let i = 0; i < endorsers.length; i++) {
              this.decodeCert(endorsers[i].endorser.IdBytes).then(o => {
                Home.output(o.subject.commonName, "endorsers");
                Home.output(o, "endorsersCert");
              });
            }
          }
          txid.push(info.header.channel_header.tx_id);
        }
        this.blocks.push({blockNumber: lastBlock - 1, txid: txid.join('; ')});
      });
    });
  }

  decodeCert(cert) {
    return this.chaincodeService.decodeCert(cert).then(o => {
      return o;
    });
  }

  showCert() {
    this.cert ? this.cert = false : this.cert = true;
  }

  

  queryConsortium() {
    this.consortiumService.query().then((orgs) => {
      this.consortiumMembersList = orgs
  })
}

addToConsortium() {
  this.consortiumService.inviteByName(this.consortiumInviteeName).then((result)=>
  {
    // this.consortiumService.query()
    console.log(result);
    this.alertService.success(`${this.consortiumInviteeName} added to the consortium`)
    this.queryConsortium()
  })
}

  static output(inp, id) {
    const formatter = new JSONFormatter(inp);
    const el = document.getElementById(id);
    if (id !== "endorsers" && id !== "endorsersCert")
      this.clear(id);
    el.appendChild(formatter.render());
  }

  static clear(id) {
    const el = document.getElementById(id);
    if (el && el.firstChild) {
      while (el.firstChild)
        el.removeChild(el.firstChild);
    }
  }

  static parseBlock(block) {
    let action = block.data.actions;
    for (let i = 0; i < action.length; i++) {
      let payload = action[i].payload.chaincode_proposal_payload.input.chaincode_spec.input.args;
      let arr = [];
      for (let j = 0; j < payload.length; j++) {
        let str = "";
        for (let k = 0; k < payload[j].data.length; k++) {
          str += String.fromCharCode(payload[j].data[k])
        }
        arr.push(str);
      }
      Home.output(arr, "input");
    }
    for (let i = 0; i < action.length; i++) {
      let payload = (action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[1] && action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes) || action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes;
      for (let j = 0; j < payload.length; j++) {
        Home.output(payload[j], "writes");
      }
    }
    for (let i = 0; i < action.length; i++) {
      let payload = (action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[1] && action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.reads) || action[i].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.reads;
      for (let j = 0; j < payload.length; j++) {
        Home.output(payload[j], "reads");
      }
    }
  }
}
