import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IdentityService} from './services/identity-service';
import {ChaincodeService} from './services/chaincode-service';
import {ConfigService} from './services/config-service';


let log = LogManager.getLogger('Home');

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService)
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
  invoke = null;
  query = null;
  selectedChain = null;
  oneCh = null;

  constructor(identityService, eventAggregator, chaincodeService, configService) {
    this.identityService = identityService;
    this.eventAggregator = eventAggregator;
    this.chaincodeService = chaincodeService;
    this.configService = configService;
  }

  attached() {
    this.queryChannels();
    this.subscriberBlock = this.eventAggregator.subscribe('block', o => {
      log.debug('block', o);
      this.updateBlock();
      this.queryAll();
    });
  }

  detached() {
    this.subscriberBlock.dispose();
  }


  queryAll() {
  }

  queryChannels() {
    this.chaincodeService.getChannels().then(channels => {
      this.channelList = channels;
    });
  }

  addChannel() {
    this.chaincodeService.addChannel(this.oneCh).then(ch => {
      this.channelList.push(this.oneCh);
    });
  }

  addChaincode(){
    this.chaincodeService.installChaincode(this.oneChannel, this.selectedChain)
  }

  queryChaincodes() {
    this.targets = [];
    this.chaincodeService.getChaincodes(this.oneChannel).then(chaincodes => {
      this.chaincodeList = chaincodes;
    });
    this.queryBlocks();
    this.queryOrgs();
    this.queryAllChain();
    this.getPeers()
  }

  getPeers() {
    this.chaincodeService.getPeersForOrgOnChannel(this.oneChannel).then(peers => {
      for (let i = 0; i < peers.length; i++) {
        this.targets.push(peers[i]);
      }
    });
  }

  queryOrgs() {
    this.chaincodeService.getOrgs(this.oneChannel).then(orgs => {
      this.orgList = orgs;
    });
  }

  queryAllChain() {
    this.chaincodeService.getInstalledChaincodes().then(chain => {
      this.installedChain = chain;
    });
  }

  queryBlocks() {
    this.blocks = [];
    let bl = [];
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

  getInvoke() {
    this.query = null;
    this.chaincodeService.invoke(this.oneChannel, this.oneChaincode, this.fnc, this.args, this.targs).then(invoke => {
      this.invoke = invoke;
    });
  }

  getQuery() {
    this.invoke = null;
    this.chaincodeService.query(this.oneChannel, this.oneChaincode, this.fnc, this.args, this.targs).then(query => {
      this.query = query;
    });
  }

  updateBlock() {
    if (this.blocks.length > 4)
      this.blocks.splice(0, 1);
    this.chaincodeService.getLastBlock(this.oneChannel).then(lastBlock => {
      this.chaincodeService.getBlock(this.oneChannel, lastBlock - 1).then(block => {
        let txid = [];
        for (let j = 0; j < block.data.data.length; j++) {
          txid.push(block.data.data[j].payload.header.channel_header.tx_id)
        }
        this.blocks.push({blockNumber: lastBlock - 1, txid: txid.join('; ')});
      });
    });

  }
}

