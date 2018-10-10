import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IdentityService} from './services/identity-service';
import {ChaincodeService} from './services/chaincode-service';
import {ValidationControllerFactory, ValidationRules} from 'aurelia-validation';

let log = LogManager.getLogger('CRUD');

@inject(IdentityService, EventAggregator, ChaincodeService, ValidationControllerFactory)
export class CRUD {
  channel = 'common';
  chaincode = 'reference';

  constructor(identityService, eventAggregator, chaincodeService) {
    this.identityService = identityService;
    this.eventAggregator = eventAggregator;
    this.chaincodeService = chaincodeService;
  }

  attached() {
    this.queryAll();

    this.subscriberBlock = this.eventAggregator.subscribe('block', o => {
      this.queryAll();
    });
  }

  detached() {
    this.subscriberBlock.dispose();
  }

  queryAll() {
    /*['depository', 'deponent'].forEach(entity => {
      this.query(entity);
    });*/
  }

  query(entity) {
    return this.chaincodeService.query(this.channel, this.chaincode, 'list', [entity]).then(o => {
      const a = o || [];
      this[entity + 'List'] = a.map(e => {
        e.id = this.fromKey(e.key)[1];
        return e;
      });
    }).catch(e => {
      log.error('cannot query', e);
    });
  }

  put(o, entity) {
    if (!o.key) {
      o.key = this.toKey([entity, o.id || this.guid()]);
    }
    let args = this.fromKey(o.key).concat([JSON.stringify(o.value)]);
    return this.chaincodeService.invoke(this.channel, this.chaincode, 'put', args).then(() => {
      this.removeEdit(entity);
    }).catch(e => {
      log.error('cannot put', e);
    });
  }

  remove(key) {
    let args = this.fromKey(key);
    let entity = args[0];
    return this.chaincodeService.invoke(this.channel, this.chaincode, 'delete', args).then(() => {
      this.removeEdit(entity)
    }).catch(e => {
      log.error('cannot remove', e);
    });
  }

  removeEdit(entity) {
    this[entity + 'Edit'] = null;
  }

  setCurrent(key) {
    let args = this.fromKey(key);
    let entity = args[0];
    let id = args[1];
    return this.chaincodeService.query(this.channel, this.chaincode, 'get', args).then(o => {
      this[this.getCurrentTag(entity)] = {key: key, value: o, id: id};
    }).catch(e => {
      log.error('cannot query', e);
    });
  }

  setNew(entity) {
    this[this.getCurrentTag(entity)] = {new: true, value: {}};
  }

  getCurrentTag(entity) {
    return entity + (this.canEdit(entity) ? 'Edit' : 'View');
  }

  canEdit(entity) {
    //return this.identityService.org === 'regulator';
    return true;
  }

  keyDelim = '\u0000';

  fromKey(key) {
    let parts = key.split(this.keyDelim);
    return parts.length > 1 ? parts.slice(1, -1) : [key];
  }

  toKey(parts) {
    return this.keyDelim + parts.join(this.keyDelim) + this.keyDelim;
  }

  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
