import {LogManager} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import {IdentityService} from './identity-service';
import {AlertService} from './alert-service';
import {Config} from '../config';

let log = LogManager.getLogger('ChaincodeService');

const baseUrl = Config.getUrl('channels');

@inject(HttpClient, IdentityService, AlertService)
export class ChaincodeService {

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
        response.json().then(j => {
          log.debug('fetch', j);

          if (!response.ok) {
            const msg = `${response.statusText} ${j}`;
            if (response.status === 401) {
              this.alertService.info('session expired, logging you out');
              this.identityService.logout();
            } else {
              this.alertService.error(msg);
            }

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
        response.json().then(j => {
          log.debug('fetch', j);

          if (!response.ok) {
            const msg = `${response.statusText} ${j}`;
            if (response.status === 401) {
              this.alertService.info('session expired, logging you out');
              this.identityService.logout();
            } else {
              this.alertService.error(msg);
            }

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


  getLastBlock(channel, org, username) {
    const url = Config.getUrl(`channels/${channel}`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        const test = j.height;
        resolve(test.low);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  addOrgToChannel(channel, newOrg, org, username) {
    const url = Config.getUrl(`channels/${channel}/orgs`);
    const params = {
      orgId: newOrg
    };
    return new Promise((resolve, reject) => {
      this.fetch(url, params, 'post', org, username).then(j => {
        // this.alertService.success(j);
        console.log(j);
        resolve(j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getBlock(channel, num, org, username) {
    log.debug(`getChannels ${org} ${username}`);
    const url = Config.getUrl(`channels/${channel}/blocks/${num}`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        resolve(j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getChannels(org, username) {
    log.debug(`getChannels ${org} ${username}`);
    const url = baseUrl;
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        const channels = j.map(o => {
          return o.channel_id;
        });
        resolve(channels);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getPeersForOrgOnChannel(channel, org, username) {
    const url = Config.getUrl(`channels/${channel}/peers`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        resolve(j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getChaincodes(channel, org, username) {
    log.debug(`getChaincodes ${org} ${username}`);
    const url = Config.getUrl(`channels/${channel}/chaincodes`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        const test = j.chaincodes;
        const chaincode = test.map(o => {
          return o.name;
        });
        resolve(chaincode);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getInstalledChaincodes(org, username) {
    log.debug(`getChaincodes ${org} ${username}`);
    const url = Config.getUrl(`chaincodes`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        const allChannel = j.map(o => {
          return o.name;
        });
        resolve(allChannel);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getOrgs(channel, org, username) {
    log.debug(`getOrgs ${org} ${username}`);
    const url = Config.getUrl(`channels/${channel}/orgs`);
    return new Promise((resolve, reject) => {
      this.fetch(url, null, 'get', org, username).then(j => {
        const orgs = j.map(o => {
          return o.id;
        });
        resolve(orgs);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  addChannel(channel, org, username) {
    log.debug(`invoke channel=${channel}`);
    //const peerOrg = org ? org.name : this.identityService.org;
    const url = Config.getUrl(`channels`);
    const params = {
      channelId: channel,
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.fetch(url, params, 'post', org, username).then(j => {
          resolve(j);
        })
          .catch(err => {
            reject(err);
          });
      },);
    }, setTimeout(4000));
  }

  joinChannel(channelId, org, username) {
    const url = Config.getUrl(`channels/${channelId}`);
    const params = {
      channelId: channelId,
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.fetch(url, params, 'post', org, username).then(j => {
          resolve(j);
        })
          .catch(err => {
            reject(err);
          });
      },);
    }, setTimeout(4000));
  }

  installChaincode(file, org, username) {
    const url = Config.getUrl(`chaincodes`);

    return new Promise((resolve, reject) => {
      this.fetchForFile(url, file, 'post', org, username).then(j => {
        console.log(j);
        if (j.startsWith('Error')) {
          this.alertService.error(j);
        } else
          this.alertService.success(j);
        resolve(j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  instantiateChaincode(channel, chaincode, arg, org, username) {
    log.debug(`getOrgs ${org} ${username}`);
    const url = Config.getUrl(`channels/${channel}/chaincodes`);
    const params = {
      channelId: channel,
      chaincodeId: chaincode,
    };
    if (arg) {
      let args = arg.trim().split(" ");
      params.chaincodeType = args[0];
      params.chaincodeVersion = args[1];
      params.fnc = args[2];
      params.args = [args[3], args[4], args[5], args[6]];
    }
    return new Promise((resolve, reject) => {
      this.fetch(url, params, 'post', org, username).then(j => {
        resolve(j);
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  query(channel, chaincode, func, args, peers, org, username) {
    log.debug(`query channel=${channel} chaincode=${chaincode} func=${func} ${org} ${username}`, args);
    const url = Config.getUrl(`channels/${channel}/chaincodes/${chaincode}`);
    const params = {
      channelId: channel,
      chaincodeId: chaincode,
      fcn: func,
      // args: json(args.trim().split(" ")),
      targets: json(peers)
    };
    if (args)
      params.args = json(args.trim().split(" "));
    return new Promise((resolve, reject) => {
      this.fetch(url, params, 'get', org, username).then(j => {
        resolve(j);
      }).catch(err => {
        reject(err);
      });
    }, setTimeout(4000));
  }

  invoke(channel, chaincode, func, args, peers, org, username) {
    log.debug(`invoke channel=${channel} chaincode=${chaincode} func=${func} ${org} ${username}`, args);
    const url = Config.getUrl(`channels/${channel}/chaincodes/${chaincode}`);
    const params = {
      channelId: channel,
      chaincodeId: chaincode,
      fcn: func.trim(),
      // args: args.trim().split(" "),
      targets: peers
    };
    if (args)
      params.args = args.trim().split(" ");
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.fetch(url, params, 'post', org, username).then(j => {
          if (j.badPeers.length > 0) {
            this.alertService.error(`Bad peers ${j.badPeers.join('; ')}`);
          }
          resolve(j);
        })
          .catch(err => {
            reject(err);
          });
      },);
    }, setTimeout(4000));
  }
}
