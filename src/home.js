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
  orgs = [];
  installedChain = [];
  blocks = [];
  targets = [];
  lastBlock = null;
  oneChannel = null;
  oneChaincode = null;
  oneOrg = null;
  fnc = null;
  args = null;
  invoke = null;
  query = null;
  selectedChain = null;
  oneCh = null;
  i = 0;

  constructor(identityService, eventAggregator, chaincodeService, configService) {
    this.identityService = identityService;
    this.eventAggregator = eventAggregator;
    this.chaincodeService = chaincodeService;
    this.configService = configService;
    this.colors = ['red', 'green', 'blue'];
    this.selectedColor = 'red';
  }

  attached() {
    this.queryChannels();
    this.subscriberBlock = this.eventAggregator.subscribe('block', o => {
      log.debug('block', o);
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

  }

  queryChaincodes(evt) {
    this.oneChannel = evt;
    this.targets = [];
    this.chaincodeService.getChaincodes(evt).then(chaincodes => {
      this.chaincodeList = chaincodes;
    });
    this.queryBlocks();
    this.queryOrgs();
    this.queryAllChain();
  }

  queryOrgs() {
    this.chaincodeService.getOrgs(this.oneChannel).then(orgs => {
      this.orgList = orgs;
    });
  }

  queryTarg(evt) {
    this.oneChaincode = evt;
    this.targets = JSON.parse(JSON.stringify(this.orgList));
    let pos = this.targets.indexOf("Orderer");
    this.targets.splice(pos, 1);
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
          bl.push(block);
          bl.sort();
        });
      }
    });
    bl.sort();
    this.blocks = bl;
    console.log(this.blocks);
  }

  // addChannelChaincode() {
  //   this.chaincodeService.installChaincode(this.oneChannel, this.selectedChain).then(inf => {
  //     this.inf = inf;
  //   });
  //   this.queryChaincodes();
  // }

  // addChannelChaincode() {
  //   this.chaincodeService.installChaincode(this.oneChannel, this.selectedChain).then(inf => {
  //     this.inf = inf;
  //   });
  //   this.queryChaincodes();
  // }

  addChannelOrg() {
    this.chaincodeService.addOrg(this.oneChannel, this.oneOrg);
    this.queryOrgs();
  }

  getInvoke() {
    this.query = null;
    this.chaincodeService.invoke(this.oneChannel, this.oneChaincode, this.fnc, this.args).then(invoke => {
      console.log(invoke);
      if (this.blocks.length > 4)
        this.blocks.splice(0, 1);
      this.blocks.push(invoke.txid.substring(0,2));
      this.invoke = invoke;
    });
  }

  getQuery() {
    this.invoke = null;
    this.chaincodeService.query(this.oneChannel, this.oneChaincode, this.fnc, this.args).then(query => {
      this.query = query;
    });
  }
//docker rm -i

}
