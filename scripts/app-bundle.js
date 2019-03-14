define('services/webapp-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', './identity-service', './alert-service', './util-service'], function (exports, _aureliaFramework, _aureliaFetchClient, _identityService, _alertService, _utilService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.WebAppService = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var WebAppService = exports.WebAppService = (_dec = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient, _identityService.IdentityService, _alertService.AlertService, _utilService.UtilService), _dec(_class = function () {
    function WebAppService(http, identityService, alertService, utilService) {
      _classCallCheck(this, WebAppService);

      this.identityService = identityService;
      this.http = http;
      this.alertService = alertService;
      this.utilService = utilService;
    }

    WebAppService.prototype.getWebApps = function getWebApps(org, username) {
      return this.utilService.getRequest('get WebApps', 'applications');
    };

    WebAppService.prototype.installWebApp = function installWebApp(uploadFile, context, org, username) {
      return this.utilService.postRequest('Install WebApp', 'applications', null, uploadFile);
    };

    WebAppService.prototype.installMiddleware = function installMiddleware(uploadFile, context, org, username) {
      return this.utilService.postRequest('Install Middleware', 'middlewares', null, uploadFile);
    };

    WebAppService.prototype.getMiddlewares = function getMiddlewares(org, username) {
      return this.utilService.getRequest('get Middlewares', 'middlewares');
    };

    return WebAppService;
  }()) || _class);
});
define('services/util-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', './identity-service', './alert-service', '../config'], function (exports, _aureliaFramework, _aureliaFetchClient, _identityService, _alertService, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.UtilService = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('UtilService');

  var UtilService = exports.UtilService = (_dec = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient, _identityService.IdentityService, _alertService.AlertService), _dec(_class = function () {
    function UtilService(http, identityService, alertService) {
      _classCallCheck(this, UtilService);

      this.identityService = identityService;
      this.http = http;
      this.alertService = alertService;
    }

    UtilService.prototype.fetch = function fetch(url, params, method, org, username) {
      var _this = this;

      log.debug('fetch', params);
      log.debug(JSON.stringify(params));
      return new Promise(function (resolve, reject) {
        var jwt = _identityService.IdentityService.getJwt(org, username);

        var promise = void 0;

        if (method === 'get') {
          var query = '';
          if (params) {
            query = '?' + Object.keys(params).map(function (k) {
              return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
          }

          promise = _this.http.fetch('' + url + query, {
            headers: {
              'Authorization': 'Bearer ' + jwt
            }
          });
        } else {
          promise = _this.http.fetch(url, {
            method: method,
            body: (0, _aureliaFetchClient.json)(params),
            headers: {
              'Authorization': 'Bearer ' + jwt
            }
          });
        }
        promise.then(function (response) {
          response.json().then(function (j) {
            log.debug('fetch', j);
            if (!response.ok) {
              var msg = response.statusText + ' ' + j;
              if (response.status === 401) {
                _this.alertService.info('session expired, logging you out');
                _this.identityService.logout();
              } else {
                _this.alertService.error(msg + '. Status: ' + response.status);
              }

              reject(new Error(msg));
            } else {
              resolve(j);
            }
          });
        }).catch(function (err) {
          _this.alertService.error('caught ' + err);
          reject(err);
        });
      });
    };

    UtilService.prototype.fetchForFile = function fetchForFile(url, file, method, org, username) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var jwt = _identityService.IdentityService.getJwt(org, username);

        var promise = void 0;

        promise = _this2.http.fetch(url, {
          method: method,
          body: file,
          headers: {
            'Authorization': 'Bearer ' + jwt
          }
        });

        promise.then(function (response) {
          if (!response || !response.json) {
            return reject(response);
          }
          response.json().then(function (j) {
            log.debug('fetch', j);

            if (!response.ok) {
              var msg = response.statusText + ' ' + j;
              if (response.status === 401) {
                _this2.alertService.info('session expired, logging you out');
                _this2.identityService.logout();
              } else {
                _this2.alertService.error(msg);
              }

              reject(new Error(msg));
            } else {
              resolve(j);
            }
          }).catch(function (err) {
            _this2.alertService.error('caught ' + err);
            reject(err);
          });
        });
      });
    };

    UtilService.prototype.getRequest = function getRequest(logmessage, path, requestParams, extractResultFn) {
      var _this3 = this;

      log.debug(logmessage);
      var url = _config.Config.getUrl(path);
      return new Promise(function (resolve, reject) {
        _this3.fetch(url, requestParams, 'get').then(function (j) {
          resolve(extractResultFn ? extractResultFn(j) : j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    UtilService.prototype.postRequest = function postRequest(logmessage, path, requestParams, uploadFile, extractResultFn) {
      var _this4 = this;

      var url = _config.Config.getUrl(path);

      var resPromise = new Promise(function (resolve, reject) {
        if (uploadFile) {
          _this4.postWithFile(url, uploadFile, reject, resolve);
        } else {
          _this4.postWithoutFile(url, requestParams, resolve, reject);
        }
      });
      return resPromise.then(function (response) {
        return extractResultFn ? extractResultFn(response) : response;
      });
    };

    UtilService.prototype.postWithFile = function postWithFile(url, uploadFile, reject, resolve, org, username) {
      var _this5 = this;

      this.fetchForFile(url, uploadFile, 'post', org, username).then(function (j) {
        if (!j || j.startsWith && j.startsWith('Error')) {
          _this5.alertService.error(j);
          reject(j);
        } else {
          _this5.alertService.success(j);
          resolve(j);
        }
      }).catch(function (err) {
        reject(err);
      });
    };

    UtilService.prototype.postWithoutFile = function postWithoutFile(url, requestParams, resolve, reject) {
      this.fetch(url, requestParams, 'post', org, username).then(function (j) {
        resolve(j);
      }).catch(function (err) {
        reject(err);
      });
    };

    return UtilService;
  }()) || _class);
});
define('services/socket-service',['exports', 'aurelia-framework', 'aurelia-event-aggregator', './alert-service', 'socket.io-client', '../config'], function (exports, _aureliaFramework, _aureliaEventAggregator, _alertService, _socket, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.SocketService = undefined;

  var _socket2 = _interopRequireDefault(_socket);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('SocketService');

  var SocketService = exports.SocketService = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator, _alertService.AlertService), _dec(_class = function () {
    function SocketService(eventAggregator, alertService) {
      _classCallCheck(this, SocketService);

      this.eventAggregator = eventAggregator;
      this.alertService = alertService;

      this.socket = _socket2.default.connect(_config.Config.getUrl());
    }

    SocketService.prototype.subscribe = function subscribe() {
      var _this = this;

      log.info('subscribe socket.connected', this.socket.connected);

      if (!this.subscribed) {
        this.socket.on('chainblock', function (o) {
          log.debug('chainblock', o);

          _this.alertService.success('new block ' + o.number + ' on ' + o.channel_id);
          _this.eventAggregator.publish('block', o);
        });
      }

      this.subscribed = true;
    };

    SocketService.prototype.disconnect = function disconnect() {
      this.subscribed = false;
      this.socket.disconnect();
    };

    return SocketService;
  }()) || _class);
});
define('services/identity-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', './config-service', '../config'], function (exports, _aureliaFramework, _aureliaFetchClient, _configService, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.IdentityService = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('IdentityService');

  var baseUrl = _config.Config.getUrl('users');

  var IdentityService = exports.IdentityService = (_dec = (0, _aureliaFramework.inject)(_aureliaFramework.Aurelia, _aureliaFetchClient.HttpClient, _configService.ConfigService), _dec(_class = function () {
    function IdentityService(aurelia, http, configService) {
      var _this = this;

      _classCallCheck(this, IdentityService);

      this.aurelia = aurelia;
      this.http = http;
      this.configService = configService;

      this.configService.get().then(function (config) {
        _this.org = config.org;
      });
    }

    IdentityService.getJwt = function getJwt(org, username) {
      return localStorage.getItem(IdentityService.key(org, username));
    };

    IdentityService.key = function key(org, username) {
      return 'jwt' + (org ? org.name + username : '');
    };

    IdentityService.setJwt = function setJwt(jwt, org, username) {
      localStorage.setItem(IdentityService.key(org, username), jwt);
    };

    IdentityService.prototype.enroll = function enroll(username, password, org) {
      var _this2 = this;

      var jwt = IdentityService.getJwt(org, username);
      if (jwt) {
        log.debug('already enrolled ' + org.name + ' ' + username, jwt);
        return Promise.resolve();
      }

      var url = org ? org.url + '/users' : baseUrl;

      var params = {
        username: username,
        password: password
      };

      return new Promise(function (resolve, reject) {
        _this2.http.fetch(url, {
          method: 'post',
          body: (0, _aureliaFetchClient.json)(params)
        }).then(function (response) {
          response.json().then(function (j) {
            if (!response.ok) {
              reject(new Error('cannot enroll ' + response.status + ' ' + j));
            } else {
              log.debug(j);

              IdentityService.setJwt(j, org, username);

              _this2.username = username;

              if (!org) {
                _this2.aurelia.setRoot('app');
              }

              resolve();
            }
          });
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    IdentityService.prototype.logout = function logout() {
      localStorage.clear();
      return this.aurelia.setRoot('login');
    };

    return IdentityService;
  }()) || _class);
});
define('services/consortium-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', './identity-service', './alert-service', '../config', './chaincode-service'], function (exports, _aureliaFramework, _aureliaFetchClient, _identityService, _alertService, _config, _chaincodeService) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.ConsortiumService = undefined;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _dec, _class;

    var log = _aureliaFramework.LogManager.getLogger('ChaincodeService');

    var baseUrl = _config.Config.getUrl('channels');

    var ConsortiumService = exports.ConsortiumService = (_dec = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient, _identityService.IdentityService, _alertService.AlertService, _chaincodeService.ChaincodeService), _dec(_class = function () {
        function ConsortiumService(http, identityService, alertService, chaincodeService) {
            _classCallCheck(this, ConsortiumService);

            this.identityService = identityService;
            this.http = http;
            this.alertService = alertService;
            this.chaincodeService = chaincodeService;
        }

        ConsortiumService.prototype.inviteByName = function inviteByName(name, org, username) {
            var _this = this;

            var params = { orgId: name };
            return new Promise(function (resolve, reject) {
                console.log('params:', params);
                _this.chaincodeService.fetch(_config.Config.getUrl('consortium/members'), params, 'post', org, username).then(function (res) {
                    console.log(res);
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            }, setTimeout(4000));
        };

        ConsortiumService.prototype.query = function query(username) {
            var _this2 = this;

            console.log(this.chaincodeService);
            return new Promise(function (resolve, reject) {

                _this2.chaincodeService.fetch(_config.Config.getUrl('consortium/members'), null, 'get', username).then(function (result) {
                    console.log(result);
                    resolve(result);
                }).catch(function (err) {
                    console.log(err);
                    reject(err);
                });
            });
        };

        return ConsortiumService;
    }()) || _class);
});
define('services/config-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', '../config'], function (exports, _aureliaFramework, _aureliaFetchClient, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ConfigService = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('ConfigService');

  var ConfigService = exports.ConfigService = (_dec = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient), _dec(_class = function () {
    function ConfigService(http) {
      _classCallCheck(this, ConfigService);

      this.http = http;
    }

    ConfigService.prototype.get = function get() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.http.fetch(_config.Config.getUrl('mspid')).then(function (response) {
          return response.json();
        }).then(function (mspid) {
          log.debug('mspid', mspid);
          _this.config = {
            org: mspid
          };

          resolve(_this.config);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    return ConfigService;
  }()) || _class);
});
define('services/chaincode-service',['exports', 'aurelia-framework', 'aurelia-fetch-client', './identity-service', './alert-service', '../config'], function (exports, _aureliaFramework, _aureliaFetchClient, _identityService, _alertService, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ChaincodeService = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('ChaincodeService');

  var baseUrl = _config.Config.getUrl('channels');

  var ChaincodeService = exports.ChaincodeService = (_dec = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient, _identityService.IdentityService, _alertService.AlertService), _dec(_class = function () {
    function ChaincodeService(http, identityService, alertService) {
      _classCallCheck(this, ChaincodeService);

      this.identityService = identityService;
      this.http = http;
      this.alertService = alertService;
    }

    ChaincodeService.prototype.fetch = function fetch(url, params, method, org, username) {
      var _this = this;

      log.debug('fetch', params);
      log.debug(JSON.stringify(params));
      return new Promise(function (resolve, reject) {
        var jwt = _identityService.IdentityService.getJwt(org, username);

        var promise = void 0;

        if (method === 'get') {
          var query = '';
          if (params) {
            query = '?' + Object.keys(params).map(function (k) {
              return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
          }

          promise = _this.http.fetch('' + url + query, {
            headers: {
              'Authorization': 'Bearer ' + jwt
            }
          });
        } else {
          promise = _this.http.fetch(url, {
            method: method,
            body: (0, _aureliaFetchClient.json)(params),
            headers: {
              'Authorization': 'Bearer ' + jwt
            }
          });
        }
        promise.then(function (response) {
          response.json().then(function (j) {
            log.debug('fetch', j);
            if (!response.ok) {
              var msg = response.statusText + ' ' + j;
              if (response.status === 401) {
                _this.alertService.info('session expired, logging you out');
                _this.identityService.logout();
              } else {
                _this.alertService.error(msg + '. Status: ' + response.status);
              }

              reject(new Error(msg));
            } else {
              resolve(j);
            }
          });
        }).catch(function (err) {
          _this.alertService.error('caught ' + err);
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.fetchForFile = function fetchForFile(url, file, method, org, username) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var jwt = _identityService.IdentityService.getJwt(org, username);

        var promise = void 0;

        promise = _this2.http.fetch(url, {
          method: method,
          body: file,
          headers: {
            'Authorization': 'Bearer ' + jwt
          }
        });

        promise.then(function (response) {
          response.json().then(function (j) {
            log.debug('fetch', j);

            if (!response.ok) {
              var msg = response.statusText + ' ' + j;
              if (response.status === 401) {
                _this2.alertService.info('session expired, logging you out');
                _this2.identityService.logout();
              } else {
                _this2.alertService.error(msg);
              }

              reject(new Error(msg));
            } else {
              resolve(j);
            }
          });
        }).catch(function (err) {
          _this2.alertService.error('caught ' + err);
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getDomain = function getDomain(org, username) {
      var _this3 = this;

      var url = _config.Config.getUrl('domain');
      return new Promise(function (resolve, reject) {
        _this3.fetch(url, null, 'get', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getLastBlock = function getLastBlock(channel, org, username) {
      var _this4 = this;

      var url = _config.Config.getUrl('channels/' + channel);
      return new Promise(function (resolve, reject) {
        _this4.fetch(url, null, 'get', org, username).then(function (j) {
          var test = j.height;
          resolve(test.low);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.addOrgToChannel = function addOrgToChannel(channel, newOrg, org, username) {
      var _this5 = this;

      var url = _config.Config.getUrl('channels/' + channel + '/orgs');
      var params = {
        orgId: newOrg
      };
      return new Promise(function (resolve, reject) {
        _this5.fetch(url, params, 'post', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getBlock = function getBlock(channel, num, org, username) {
      var _this6 = this;

      log.debug('getChannels ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/blocks/' + num);
      return new Promise(function (resolve, reject) {
        _this6.fetch(url, null, 'get', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getChannels = function getChannels(org, username) {
      var _this7 = this;

      log.debug('getChannels ' + org + ' ' + username);
      var url = baseUrl;
      return new Promise(function (resolve, reject) {
        _this7.fetch(url, null, 'get', org, username).then(function (j) {
          var channels = j.map(function (o) {
            return o.channel_id;
          });
          resolve(channels);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getPeersForOrgOnChannel = function getPeersForOrgOnChannel(channel, org, username) {
      var _this8 = this;

      var url = _config.Config.getUrl('channels/' + channel + '/peers');
      return new Promise(function (resolve, reject) {
        _this8.fetch(url, null, 'get', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getChaincodes = function getChaincodes(channel, org, username) {
      var _this9 = this;

      log.debug('getChaincodes ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes');
      return new Promise(function (resolve, reject) {
        _this9.fetch(url, null, 'get', org, username).then(function (j) {
          var test = j.chaincodes;
          var chaincode = test.map(function (o) {
            return o.name;
          });
          resolve(chaincode);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getInstalledChaincodes = function getInstalledChaincodes(org, username) {
      var _this10 = this;

      log.debug('getChaincodes ' + org + ' ' + username);
      var url = _config.Config.getUrl('chaincodes');
      return new Promise(function (resolve, reject) {
        _this10.fetch(url, null, 'get', org, username).then(function (j) {
          var allChannel = j.map(function (o) {
            return o.name;
          });
          resolve(allChannel);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getOrgs = function getOrgs(channel, org, username) {
      var _this11 = this;

      log.debug('getOrgs ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/orgs');
      return new Promise(function (resolve, reject) {
        _this11.fetch(url, null, 'get', org, username).then(function (j) {
          var orgs = j.map(function (o) {
            return o.id;
          });
          resolve(orgs);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.addChannel = function addChannel(channel, org, username) {
      var _this12 = this;

      log.debug('invoke channel=' + channel);

      var url = _config.Config.getUrl('channels');
      var params = {
        channelId: channel
      };
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _this12.fetch(url, params, 'post', org, username).then(function (j) {
            resolve(j);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, setTimeout(4000));
    };

    ChaincodeService.prototype.joinChannel = function joinChannel(channelId, org, username) {
      var _this13 = this;

      var url = _config.Config.getUrl('channels/' + channelId);
      var params = {
        channelId: channelId
      };
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _this13.fetch(url, params, 'post', org, username).then(function (j) {
            resolve(j);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, setTimeout(4000));
    };

    ChaincodeService.prototype.installChaincode = function installChaincode(file, org, username) {
      var _this14 = this;

      var url = _config.Config.getUrl('chaincodes');

      return new Promise(function (resolve, reject) {
        _this14.fetchForFile(url, file, 'post', org, username).then(function (j) {
          if (j.startsWith('Error')) {
            _this14.alertService.error(j);
            reject(j);
          } else _this14.alertService.success(j);
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.instantiateChaincode = function instantiateChaincode(channel, chaincode, language, version, fcn, args, org, username) {
      var _this15 = this;

      log.debug('getOrgs ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes');
      var params = {
        channelId: channel,
        chaincodeId: chaincode
      };
      params.chaincodeType = language;
      params.chaincodeVersion = version;
      if (fcn) params.fcn = fcn;
      if (args) params.args = args.trim().split(" ");
      return new Promise(function (resolve, reject) {
        _this15.fetch(url, params, 'post', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.query = function query(channel, chaincode, func, key, peers, org, username) {
      var _this16 = this;

      log.debug('query channel=' + channel + ' chaincode=' + chaincode + ' func=' + func + ' ' + org + ' ' + username, key);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes/' + chaincode);
      var params = {
        channelId: channel,
        chaincodeId: chaincode,
        fcn: func,
        targets: (0, _aureliaFetchClient.json)(peers)
      };
      if (key) params.args = (0, _aureliaFetchClient.json)(key.trim().split(" "));
      return new Promise(function (resolve, reject) {
        _this16.fetch(url, params, 'get', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      }, setTimeout(4000));
    };

    ChaincodeService.prototype.invoke = function invoke(channel, chaincode, func, key, value, peers, org, username) {
      var _this17 = this;

      log.debug('invoke channel=' + channel + ' chaincode=' + chaincode + ' func=' + func + ' ' + org + ' ' + username, args);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes/' + chaincode);
      var params = {
        channelId: channel,
        chaincodeId: chaincode,
        targets: peers
      };
      if (func) params.fcn = func.trim();
      var args = [];
      if (key) args = key.trim().split(" ");
      if (value) {
        var some_arg = value.substring(value.indexOf("\"") + 1, value.lastIndexOf("\""));

        if (some_arg) {
          args.push(some_arg);
          params.args = args;
        } else {
          var val = value.trim().split(" ");
          for (var i = 0; i < val.length; i++) {
            args.push(val[i]);
          }
          params.args = args;
        }
      }
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _this17.fetch(url, params, 'post', org, username).then(function (j) {
            if (j.badPeers.length > 0) {
              _this17.alertService.error('Bad peers ' + j.badPeers.join('; '));
            }
            resolve(j);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, setTimeout(4000));
    };

    ChaincodeService.prototype.decodeCert = function decodeCert(cert, org, username) {
      var _this18 = this;

      var url = _config.Config.getUrl('cert');
      var params = {
        cert: cert
      };
      return new Promise(function (resolve, reject) {
        _this18.fetch(url, params, 'post', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    return ChaincodeService;
  }()) || _class);
});
define('services/alert-service',['exports', 'aurelia-framework', 'toastr'], function (exports, _aureliaFramework, _toastr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AlertService = undefined;

  var toastr = _interopRequireWildcard(_toastr);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('AlertService');

  var AlertService = exports.AlertService = (_dec = (0, _aureliaFramework.inject)(toastr), _dec(_class = function () {
    function AlertService(toastr) {
      _classCallCheck(this, AlertService);

      this.toastr = toastr;
      this.toastr.options.positionClass = 'toast-bottom-right';
      this.toastr.options.progressBar = true;
      this.toastr.options.closeButton = true;
      this.toastr.options.timeOut = 3000;
      this.toastr.options.extendedTimeOut = 2000;
    }

    AlertService.prototype.info = function info(m) {
      this.toastr.info(m);
    };

    AlertService.prototype.error = function error(m) {
      this.toastr.error(m);
    };

    AlertService.prototype.success = function success(m) {
      this.toastr.success(m);
    };

    return AlertService;
  }()) || _class);
});
define('resources/index',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(config) {}
});
define('resources/elements/key',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.KeyCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var KeyCustomElement = exports.KeyCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'o', attribute: 'data' }), _dec(_class = function () {
    function KeyCustomElement() {
      _classCallCheck(this, KeyCustomElement);
    }

    KeyCustomElement.prototype.oChanged = function oChanged() {
      if (this.o) {
        var key = this.o;
        var parts = key.split('\0');
        if (parts.length > 2) {
          this.objectType = parts[1];
          this.id = parts[2];
        } else {
          this.id = key;
        }
      }
    };

    return KeyCustomElement;
  }()) || _class);
});
define('text!resources/elements/key.html', ['module'], function(module) { module.exports = "<template>\n  <abbr title=\"key=${o} objectType=${objectType} id=${id}\">${id}</abbr>\n</template>\n"; });
define('main',['exports', './environment', 'aurelia-i18n'], function (exports, _environment, _aureliaI18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;

  var _environment2 = _interopRequireDefault(_environment);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function configure(aurelia) {

    aurelia.use.standardConfiguration().plugin('aurelia-i18n', function (instance) {
      var aliases = ['t', 'i18n'];

      _aureliaI18n.TCustomAttribute.configureAliases(aliases);

      instance.i18next.use(_aureliaI18n.Backend.with(aurelia.loader));


      return instance.setup({
        backend: {
          loadPath: '../locales/{{lng}}/{{ns}}.json' },
        attributes: aliases,
        lng: 'en',
        fallbackLng: 'en',
        debug: false
      });
    }).plugin('aurelia-table').plugin('aurelia-validation').feature('resources');

    if (_environment2.default.debug) {
      aurelia.use.developmentLogging();
    }

    if (_environment2.default.testing) {
      aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(function () {
      var isLoggedIn = localStorage.getItem('jwt');
      if (isLoggedIn) {
        aurelia.setRoot();
      } else {
        aurelia.setRoot('login');
      }
    });
  }
});
define('login',['exports', 'aurelia-framework', './services/identity-service', './services/alert-service'], function (exports, _aureliaFramework, _identityService, _alertService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Login = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('Login');

  var Login = exports.Login = (_dec = (0, _aureliaFramework.inject)(_identityService.IdentityService, _alertService.AlertService), _dec(_class = function () {
    function Login(identityService, alertService) {
      _classCallCheck(this, Login);

      this.identityService = identityService;
      this.alertService = alertService;
    }

    Login.prototype.login = function login() {
      var _this = this;

      this.identityService.enroll(this.username, this.password).then(function () {
        _this.alertService.success(_this.username + ' logged in');
      }).catch(function (e) {
        _this.alertService.error('cannot enroll, caught ' + e);
      });
    };

    _createClass(Login, [{
      key: 'org',
      get: function get() {
        return this.identityService.org;
      }
    }]);

    return Login;
  }()) || _class);
});
define('text!login.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"bootstrap/css/bootstrap.css\"></require>\n  <require from=\"toastr/build/toastr.min.css\"></require>\n\n  <div class=\"container h-100\" style=\"margin-top: 200px\">\n    <div class=\"row h-100 justify-content-center align-items-center\">\n      <form class=\"form-signin\" submit.delegate=\"login()\">\n        <h1 class=\"text-center text-uppercase\">${org}</h1>\n        <p t=\"enrollGreeting\">You're connected to your organization's API server. Login or register.</p>\n        <div class=\"form-group\">\n          <input type=\"text\" class=\"form-control\" placeholder=\"Username\" required autofocus value.bind=\"username\">\n        </div>\n        <div class=\"form-group\">\n          <input type=\"password\" class=\"form-control\" placeholder=\"Password\" required value.bind=\"password\">\n        </div>\n        <div class=\"form-group\">\n          <button class=\"btn btn-lg text-white btn-block\" style=\"background-color: #000000;\" type=\"submit\" t=\"enroll\">enroll</button>\n        </div>\n      </form>\n    </div>\n  </div>\n</template>\n"; });
define('home',['exports', 'aurelia-framework', 'aurelia-event-aggregator', './services/identity-service', './services/chaincode-service', './services/config-service', './services/alert-service', './services/consortium-service', './services/webapp-service', '../node_modules/json-formatter-js/dist/json-formatter'], function (exports, _aureliaFramework, _aureliaEventAggregator, _identityService, _chaincodeService, _configService, _alertService, _consortiumService, _webappService, _jsonFormatter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Home = undefined;

  var _jsonFormatter2 = _interopRequireDefault(_jsonFormatter);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('Home');

  var Home = exports.Home = (_dec = (0, _aureliaFramework.inject)(_identityService.IdentityService, _aureliaEventAggregator.EventAggregator, _chaincodeService.ChaincodeService, _configService.ConfigService, _alertService.AlertService, _consortiumService.ConsortiumService, _webappService.WebAppService), _dec(_class = function () {
    function Home(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService) {
      _classCallCheck(this, Home);

      this.channelList = [];
      this.chaincodeList = [];
      this.orgList = [];
      this.installedChain = [];
      this.blocks = [];
      this.targets = [];
      this.oneChannel = null;
      this.oneChaincode = null;
      this.targs = [];
      this.newOrg = null;
      this.fnc = null;
      this.args = null;
      this.key = null;
      this.value = null;
      this.selectedChain = null;
      this.oneCh = null;
      this.file = null;
      this.initFcn = null;
      this.initArgs = null;
      this.block = null;
      this.joinCh = null;
      this.show = true;
      this.language = 'node';
      this.lastTx = null;
      this.version = null;
      this.instLanguage = 'node';
      this.instVersion = null;
      this.cert = true;
      this.endorse = [];
      this.consortiumInviteeIP = null;
      this.consortiumInviteeName = null;
      this.installedWebApps = [];
      this.webAppFile = null;
      this.installedMiddlewares = [];
      this.middlewareFile = null;

      this.identityService = identityService;
      this.eventAggregator = eventAggregator;
      this.chaincodeService = chaincodeService;
      this.configService = configService;
      this.alertService = alertService;
      this.consortiumService = consortiumService;
      this.webAppService = webAppService;
    }

    Home.prototype.attached = function attached() {
      var _this = this;

      this.queryConsortium();
      this.queryChannels();
      this.queryInstalledChaincodes();
      this.queryInstalledWebApps();
      this.subscriberBlock = this.eventAggregator.subscribe('block', function (o) {
        log.debug('block', o);
        _this.queryChannels();
        if (o.channel_id === _this.oneChannel) _this.updateBlock();
        if (_this.oneChannel) {
          _this.queryChaincodes();
          _this.queryOrgs();
          _this.queryPeers();
        }
      });
    };

    Home.prototype.detached = function detached() {
      this.subscriberBlock.dispose();
    };

    Home.prototype.queryChannels = function queryChannels() {
      var _this2 = this;

      this.chaincodeService.getChannels().then(function (channels) {
        _this2.channelList = channels;
        _this2.channelList.sort();
      });
    };

    Home.prototype.addChannel = function addChannel() {
      this.chaincodeService.addChannel(this.oneCh);
      this.channelList.sort();
      this.oneCh = null;
    };

    Home.prototype.installChaincode = function installChaincode() {
      var _this3 = this;

      var formData = new FormData();
      for (var i = 0; i < this.file.length; i++) {
        formData.append('file', this.file[i]);
        formData.append('targets', this.targs);
        formData.append('version', this.version || '1.0');
        formData.append('language', this.language);
        this.chaincodeService.installChaincode(formData).then(function (j) {
          _this3.queryInstalledChaincodes();
        });
      }
    };

    Home.prototype.initChaincode = function initChaincode() {
      if (this.selectedChain) {
        this.alertService.info('Send instantiate request');
        this.chaincodeService.instantiateChaincode(this.oneChannel, this.selectedChain, this.instLanguage || 'node', this.instVersion || '1.0', this.initFcn, this.initArgs);
      } else this.alertService.error('Select chaincode');
    };

    Home.prototype.queryChaincodes = function queryChaincodes() {
      var _this4 = this;

      this.show = false;
      this.chaincodeService.getChaincodes(this.oneChannel).then(function (chaincodes) {
        _this4.chaincodeList = chaincodes;
      });
    };

    Home.prototype.queryPeers = function queryPeers() {
      var _this5 = this;

      this.targets = [];
      this.chaincodeService.getPeersForOrgOnChannel(this.oneChannel).then(function (peers) {
        for (var i = 0; i < peers.length; i++) {
          _this5.targets.push(peers[i]);
        }
      });
    };

    Home.prototype.queryOrgs = function queryOrgs() {
      var _this6 = this;

      this.chaincodeService.getOrgs(this.oneChannel).then(function (orgs) {
        _this6.orgList = orgs;
        _this6.orgList.sort();
      });
    };

    Home.prototype.queryInstalledChaincodes = function queryInstalledChaincodes() {
      var _this7 = this;

      this.chaincodeService.getInstalledChaincodes().then(function (chain) {
        _this7.installedChain = chain;
      });
    };

    Home.prototype.addOrgToChannel = function addOrgToChannel() {
      this.alertService.info('Send invite');
      this.chaincodeService.addOrgToChannel(this.oneChannel, this.newOrg);
      this.newOrg = null;
    };

    Home.prototype.joinChannel = function joinChannel() {
      this.chaincodeService.joinChannel(this.joinCh);
      this.joinCh = null;
    };

    Home.prototype.getInvoke = function getInvoke() {
      var _this8 = this;

      Home.clear('endorsers');
      Home.clear('endorsersCert');
      Home.clear('creatorName');
      Home.clear('info');
      Home.clear('json');
      Home.clear('input');
      Home.clear('reads');
      Home.clear('writes');
      Home.clear('res');
      this.chaincodeService.invoke(this.oneChannel, this.oneChaincode, this.fnc, this.key, this.value, this.targs).then(function (invoke) {
        _this8.lastTx = invoke._transaction_id;
        Home.output(invoke, 'res');
      });
    };

    Home.prototype.getQuery = function getQuery() {
      var _this9 = this;

      Home.clear('endorsers');
      Home.clear('endorsersCert');
      Home.clear('creatorName');
      Home.clear('info');
      Home.clear('json');
      Home.clear('input');
      Home.clear('reads');
      Home.clear('writes');
      Home.clear('res');
      this.chaincodeService.query(this.oneChannel, this.oneChaincode, this.fnc, this.key, this.targs).then(function (query) {
        _this9.lastTx = query;
        Home.output(query, 'res');
      });
    };

    Home.prototype.queryBlocks = function queryBlocks() {
      var _this10 = this;

      this.blocks = [];
      var bl = [];
      this.oneChaincode = null;
      this.chaincodeService.getLastBlock(this.oneChannel).then(function (block) {
        for (var i = block - 5; i < block; i++) {
          if (i < 0) continue;
          _this10.chaincodeService.getBlock(_this10.oneChannel, i).then(function (block) {
            var txid = [];
            for (var j = 0; j < block.data.data.length; j++) {
              txid.push(block.data.data[j].payload.header.channel_header.tx_id);
            }
            bl.push({ blockNumber: block.header.number, txid: txid.join('; ') });
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
    };

    Home.prototype.updateBlock = function updateBlock() {
      var _this11 = this;

      this.endorse = [];
      if (this.blocks.length > 4) this.blocks.splice(0, 1);
      this.chaincodeService.getLastBlock(this.oneChannel).then(function (lastBlock) {
        _this11.chaincodeService.getBlock(_this11.oneChannel, lastBlock - 1).then(function (block) {
          var txid = [];
          Home.output(block, 'json');
          for (var j = 0; j < block.data.data.length; j++) {
            var info = block.data.data[j].payload;
            if (info.header.channel_header.tx_id === _this11.lastTx) {
              Home.parseBlock(info);
              _this11.decodeCert(info.header.signature_header.creator.IdBytes).then(function (o) {
                Home.output(o, 'info');
                Home.output(o.subject.commonName + '@' + o.issuer.organizationName, 'creatorName');
              });
              Home.clear('endorsers');
              Home.clear('endorsersCert');
              var endorsers = info.data.actions[0].payload.action.endorsements;
              for (var i = 0; i < endorsers.length; i++) {
                _this11.decodeCert(endorsers[i].endorser.IdBytes).then(function (o) {
                  Home.output(o.subject.commonName, 'endorsers');
                  Home.output(o, 'endorsersCert');
                });
              }
            }
            txid.push(info.header.channel_header.tx_id);
          }
          _this11.blocks.push({ blockNumber: lastBlock - 1, txid: txid.join('; ') });
        });
      });
    };

    Home.prototype.decodeCert = function decodeCert(cert) {
      return this.chaincodeService.decodeCert(cert).then(function (o) {
        return o;
      });
    };

    Home.prototype.showCert = function showCert() {
      this.cert ? this.cert = false : this.cert = true;
    };

    Home.prototype.queryConsortium = function queryConsortium() {
      var _this12 = this;

      this.consortiumService.query().then(function (orgs) {
        _this12.consortiumMembersList = orgs;
      });
    };

    Home.prototype.addToConsortium = function addToConsortium() {
      var _this13 = this;

      this.consortiumService.inviteByName(this.consortiumInviteeName).then(function (result) {
        console.log(result);
        _this13.alertService.success(_this13.consortiumInviteeName + ' added to the consortium');
        _this13.queryConsortium();
      });
    };

    Home.prototype.queryInstalledWebApps = function queryInstalledWebApps() {
      var _this14 = this;

      this.webAppService.getWebApps().then(function (items) {
        _this14.installedWebApps = items;
      });
      this.webAppService.getMiddlewares().then(function (items) {
        _this14.installedMiddlewares = items;
      });
    };

    Home.prototype.installWebApp = function installWebApp() {
      var _this15 = this;

      var formUrlEncoded = this.createUploadFileForm(this.webAppFile);
      return this.webAppService.installWebApp(formUrlEncoded).then(function () {
        return _this15.queryInstalledWebApps();
      });
    };

    Home.prototype.installMiddleware = function installMiddleware() {
      var _this16 = this;

      var formUrlEncoded = this.createUploadFileForm(this.middlewareFile);
      return this.webAppService.installMiddleware(formUrlEncoded).then(function () {
        return _this16.queryInstalledWebApps();
      });
    };

    Home.prototype.createUploadFileForm = function createUploadFileForm(fileElement, fields) {
      var formData = new FormData();
      for (var i = 0; i < fileElement.length; i++) {
        formData.append('file', fileElement[i]);
      }
      if (fields) Object.keys(fields).forEach(function (k) {
        return formData.append(k, fields[k]);
      });
      return formData;
    };

    Home.output = function output(inp, id) {
      var formatter = new _jsonFormatter2.default(inp);
      var el = document.getElementById(id);
      if (id !== 'endorsers' && id !== 'endorsersCert') this.clear(id);
      if (el) el.appendChild(formatter.render());
    };

    Home.clear = function clear(id) {
      var el = document.getElementById(id);
      if (el && el.firstChild) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
    };

    Home.parseBlock = function parseBlock(block) {
      var action = block.data.actions;
      for (var i = 0; i < action.length; i++) {
        var payload = action[i].payload.chaincode_proposal_payload.input.chaincode_spec.input.args;
        var arr = [];
        for (var j = 0; j < payload.length; j++) {
          var str = '';
          for (var k = 0; k < payload[j].data.length; k++) {
            str += String.fromCharCode(payload[j].data[k]);
          }
          arr.push(str);
        }
        Home.output(arr, 'input');
      }
      for (var _i = 0; _i < action.length; _i++) {
        var _payload = action[_i].payload.action.proposal_response_payload.extension.results.ns_rwset[1] && action[_i].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes || action[_i].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes;
        for (var _j = 0; _j < _payload.length; _j++) {
          Home.output(_payload[_j], 'writes');
        }
      }
      for (var _i2 = 0; _i2 < action.length; _i2++) {
        var _payload2 = action[_i2].payload.action.proposal_response_payload.extension.results.ns_rwset[1] && action[_i2].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.reads || action[_i2].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.reads;
        for (var _j2 = 0; _j2 < _payload2.length; _j2++) {
          Home.output(_payload2[_j2], 'reads');
        }
      }
    };

    return Home;
  }()) || _class);
});
define('text!home.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"css/style.css\"></require>\n\n  <div style=\"height: 25px\">\n    <div class=\"d-inline p-2 text-white mr-1\" id=\"block\" style=\"background-color: #000000;\" repeat.for=\"o of blocks\"\n         data-toggle=\"tooltip\" data-placement=\"left\" title=\"${o.txid}\">\n      ${o.blockNumber}\n    </div>\n  </div>\n\n  <div class=\"row p-1 row-vdivide\">\n    <div class=\"col-md-4\">\n      <h4 t=\"channelList\">channelList</h4>\n      <div repeat.for=\"o of channelList\">\n        <label>\n          <input type=\"radio\" value.bind=\"o\" autocomplete=\"off\" checked.bind='oneChannel'\n                 change.delegate=\"queryChaincodes() || queryBlocks() || queryOrgs() || queryPeers() || getLastBlock()\">\n          ${o}\n        </label>\n      </div>\n\n\n      <form class=\"form-inline\" submit.delegate=\"addChannel()\">\n        <div class=\"form-group mb-2 mr-3\">\n          <input type=\"text\" class=\"form-control\" value.bind=\"oneCh\" required placeholder=\"New channel\">\n        </div>\n        <button type=\"submit\" class=\"btn text-white mb-2\" t=\"Add channel\">Add channel</button>\n      </form>\n\n\n      <form class=\"form-inline\" submit.delegate=\"joinChannel()\">\n        <div class=\"form-group mb-2 mr-3\">\n          <input type=\"text\" class=\"form-control\" value.bind=\"joinCh\" required placeholder=\"Join channel\">\n        </div>\n        <button type=\"submit\" class=\"btn text-white mb-2\" t=\"Join channel\">Join channel</button>\n      </form>\n\n\n      <form submit.delegate=\"installChaincode()\">\n        <h4 t=\"Uploaded Chaincodes\">Uploaded Chaincodes</h4>\n        <ul>\n          <li repeat.for=\"o of installedChain\">${o}</li>\n        </ul>\n        <div class=\"form-group\">\n          <input class=\"form-control-file\" type=\"file\"\n                 name=\"ChaincodeFile\"\n                 files.bind=\"file\" required accept=\"application/zip\">\n        </div>\n        <div class=\"row p-1 row-vdivide\">\n          <div class=\"form-group mb-2 ml-3 mr-3\">\n            <label for=\"uplanguage\" t=\"Language\">Language</label>\n            <select id=\"uplanguage\" class=\"form-control\" value.bind=\"language\">\n              <option value=\"node\">node</option>\n              <option value=\"car\">car</option>\n              <option value=\"golang\">golang</option>\n              <option value=\"java\">java</option>\n            </select>\n          </div>\n          <div class=\"form-group mb-2 mr-3\">\n            <label for=\"upversion\" t=\"Version\">Version:</label>\n\n            <input type=\"text\" id=\"upversion\" class=\"form-control\" value.bind=\"version\" placeholder=\"1.0\">\n          </div>\n        </div>\n        <button type=\"submit\" class=\"btn text-white mb-2\" t=\"Install chaincode\">Install chaincode</button>\n\n      </form>\n    </div>\n\n\n    <div class=\"col-md-4\">\n      <form hide.bind=\"show\">\n        <h4 t=\"chaincodeList\">chaincodeList</h4>\n        <div repeat.for=\"o of chaincodeList\" class.bind=\"lastTx=null\">\n          <label>\n            <input type=\"radio\"  value.bind=\"o\" autocomplete=\"off\" checked.bind='oneChaincode'>\n            ${o}\n          </label>\n        </div>\n      </form>\n\n\n      <form submit.delegate=\"initChaincode()\" hide.bind=\"show\">\n        <h4 t=\"Install chaincodes\">Install chaincodes</h4>\n        <div class=\"row p-1 row-vdivide\">\n          <div class=\"form-group mb-2 ml-3\">\n            <label for=\"instCh\" t=\"Chaincode for instantiate\">Chaincode for instantiate</label>\n            <select class=\"form-control\" id=\"instCh\" value.bind=\"selectedChain\">\n              <option model.bind=\"null\">Choose chaincode for instantiate</option>\n              <option repeat.for=\"chain of installedChain\">\n                ${chain}\n              </option>\n            </select>\n          </div>\n        </div>\n        <div class=\"row p-1 row-vdivide\">\n          <div class=\"form-group mb-2 ml-3\">\n            <label for=\"language\" t=\"Language\">Language</label>\n            <select class=\"form-control\" id=\"language\" value.bind=\"instLanguage\">\n              <option value=\"node\">node</option>\n              <option value=\"car\">car</option>\n              <option value=\"golang\">golang</option>\n              <option value=\"java\">java</option>\n            </select>\n          </div>\n          <div class=\"form-group mb-2 mr-4 ml-3\">\n            <label for=\"version\" t=\"Version\">Version:</label>\n            <input class=\"form-control\" id=\"version\" type=\"text\" value.bind=\"instVersion\"\n                   placeholder=\"1.0\">\n          </div>\n          <div class=\"form-group ml-3 mb-2\">\n            <label for=\"fcn\" t=\"Function\">Function</label>\n            <input class=\"form-control\" id=\"fcn\" type=\"text\" value.bind=\"initFcn\"\n                   placeholder=\"init\">\n          </div>\n          <div class=\"form-group ml-3 mb-2\">\n            <label for=\"arg\" t=\"Arguments\">Arguments</label>\n            <input class=\"form-control\" id=\"arg\" type=\"text\" value.bind=\"initArgs\"\n                   placeholder=\"a 10 b 5\">\n          </div>\n        </div>\n        <button type=\"submit\" class=\"btn text-white mb-2\" t=\"Instantiate Chaincode\">Instantiate Chaincode</button>\n      </form>\n\n\n      <form submit.delegate=\"addOrgToChannel()\" hide.bind=\"show\">\n        <h4 t=\"orgList\">orgList</h4>\n        <ul>\n          <li repeat.for=\"o of orgList\">${o}</li>\n        </ul>\n        <div class=\"row p-1 row-vdivide\">\n          <div class=\"form-group mb-2 mr-3 ml-3\">\n            <input type=\"text\" class=\"form-control\" value.bind=\"newOrg\" required placeholder=\"New Organizatoin\">\n          </div>\n          <button type=\"submit\" class=\"btn text-white mb-2\" t=\"Add Organization to Channel\">Add Organization to\n            Channel\n          </button>\n        </div>\n      </form>\n    </div>\n\n    <div class=\"col-md-4\" hide.bind=\"oneChaincode? false : true\">\n      <h4 t=\"Targets\">Targets</h4>\n      <div repeat.for=\"o of targets\">\n        <label>\n          <input type=\"checkbox\" value.bind=\"o\" checked.bind=\"targs\">\n          ${o}\n        </label>\n      </div>\n\n      <div class=\"form-group mb-2\">\n        <label for=\"function\" t=\"Function\">Function</label>\n        <input class=\"form-control\" id=\"function\" type=\"text\" value.bind=\"fnc\" placeholder=\"put\">\n      </div>\n      <div class=\"form-group mb-2\">\n        <label for=\"key\" t=\"Key\">Key</label>\n        <input class=\"form-control\" id=\"key\" type=\"text\" value.bind=\"key\"\n               placeholder=\"account 1\">\n      </div>\n      <div class=\"form-group mb-2\">\n        <label for=\"value\" t=\"Value\">Value</label>\n        <input class=\"form-control\" id=\"value\" type=\"text\" value.bind=\"value\"\n               placeholder=\"&quot;{name:&quot;one&quot;}&quot;\">\n      </div>\n      <button type=\"submit\" class=\"btn text-white mr-3 mb-2\"\n              click.trigger=\"getInvoke()\">Invoke\n      </button>\n      <button type=\"submit\" class=\"btn text-white mb-2\" click.trigger=\"getQuery()\">\n        Query\n      </button>\n      <div class=\"form-group mb-2\" hide.bind=\"lastTx? false : true\">\n        <h4 class=\"text\" t=\"Transaction\">Transaction</h4>\n        <pre id=\"res\"></pre>\n        <h6 class=\"text\" t=\"Input\">Input</h6>\n        <pre id=\"input\"></pre>\n        <h6 class=\"text\" t=\"ReadSet\">ReadSet</h6>\n        <pre id=\"reads\"></pre>\n        <h6 class=\"text\" t=\"WriteSet\">WriteSet</h6>\n        <pre id=\"writes\"></pre>\n      </div>\n\n      <div class=\"form-group mb-2\">\n        <div hide.bind=\"lastTx? false : true\">\n          <h4 class=\"text\" t=\"Endorsed\">Endorsed</h4>\n          <h6 class=\"text\" t=\"Creator\">Creator</h6>\n          <pre id=\"creatorName\" hide.bind=\"cert? false : true\"></pre>\n          <pre id=\"info\" hide.bind=\"cert? true : false\"></pre>\n          <h6 class=\"text\" t=\"Endorsers\">Endorsers</h6>\n          <pre id=\"endorsers\" hide.bind=\"cert? false : true\"></pre>\n          <pre id=\"endorsersCert\" hide.bind=\"cert? true : false\"></pre>\n          <button type=\"submit\" class=\"btn text-white mb-3\" click.trigger=\"showCert()\">\n            Show cert\n          </button>\n        </div>\n      </div>\n\n      <div class=\"form-group mb-2\" hide.bind=\"lastTx? false : true\">\n        <h4 class=\"text\" t=\"Block\">Block</h4>\n        <pre id=\"json\"></pre>\n      </div>\n    </div>\n  </div>\n\n  <hr>\n\n  <div class=\"row p-1 row-vdivide\">\n    <div class=\"col-md-4\">\n      <form submit.delegate=\"addToConsortium()\" class=\"form-horizontal\" role=\"form\">\n        <div class=\"form-group\">\n          <legend>Consortium</legend>\n        </div>\n        <div class=\"col-md-8\">\n            <table class=\"table table-bordered table-hover\">\n                <thead>\n                  <tr>\n                    <th>Name</th>\n                    <th>IP</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr repeat.for=\"org of consortiumMembersList\">\n                    <td>${org}</td>\n                    <td></td>\n                  </tr>\n                </tbody>\n              </table>\n        </div>\n        <div class=\"form-group\">\n          <div class=\"col-sm-10 col-sm-offset-2\">\n            <div class=\"form-group row row-no-vdivide\">\n              <label for=\"consortiumInviteeIP\" class=\"col-sm-2\">IP</label>\n              <input type=\"text\" readonly name=\"OrgIP\" id = \"consortiumInviteeIP\" value.bind=\"consortiumInviteeIP\" autocomplete=\"off\">\n            </div>\n            <div class=\"form-group row row-no-vdivide\">\n\n              <label for=\"consortiumInviteeName\" class=\"col-sm-2\">Name</label>\n\n              <input type=\"text\" name=\"OrgName\" id = \"consortiumInviteeName\" value.bind=\"consortiumInviteeName\" autocomplete=\"off\">\n            </div>\n\n            <button type=\"submit\" class=\"btn text-white mb-3\">Invite</button>\n          </div>\n        </div>\n      </form>\n\n    </div>\n\n    <div class=\"col-md-4 col-sm-offset-2\">\n      <div class=\"row row-no-vdivide\">\n        <div class=\"col-md-6\">\n          <form submit.delegate=\"installWebApp()\">\n            <h4 t=\"Uploaded WebApps\">Web Applications</h4>\n            <ul>\n              <li repeat.for=\"app of installedWebApps\"><a href=\"/${app}\">${app}</a></li>\n            </ul>\n            <div class=\"form-group\">\n              <input class=\"form-control-file\" type=\"file\"\n                     name=\"webAppFile\" files.bind=\"webAppFile\" required accept=\"application/zip\">\n            </div>\n            <button type=\"submit\" class=\"btn text-white mb-2\">Install Web App</button>\n\n          </form>\n        </div>\n        <div class=\"col-md-6\">\n          <form submit.delegate=\"installMiddleware()\">\n            <h4 t=\"Uploaded WebApps\">Middlewares</h4>\n            <ul>\n              <li repeat.for=\"item of installedMiddlewares\">${item}</a></li>\n            </ul>\n            <div class=\"form-group\">\n              <input class=\"form-control-file\" type=\"file\"\n                     name=\"middlewareFile\" files.bind=\"middlewareFile\" required accept=\"text/javascript\">\n            </div>\n            <button type=\"submit\" class=\"btn text-white mb-2\">Install Middleware</button>\n\n          </form>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"col-md-4\">\n    </div>\n  </div>\n</template>\n"; });
define('environment',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    baseUrl: 'http://localhost:4000',
    debug: true,
    testing: false
  };
});
define('text!css/style.css', ['module'], function(module) { module.exports = "@keyframes go-left-right {\n  from {\n    right: -85%;\n  }\n  to {\n    right: 0;\n  }\n}\n\n#block {\n  animation: go-left-right 3s;\n  -webkit-animation: go-left-right 3s;\n  position: relative;\n  border-radius: 8px;\n  width: 50px;\n  height: 20px;\n}\n\n.btn{\n  background-color: #000000;\n}\n\n.row-vdivide [class*='col-']:not(:last-child):after {\n  background: #e0e0e0;\n  width: 1px;\n  content: \"\";\n  display:block;\n  position: absolute;\n  top:0;\n  bottom: 0;\n  right: 0;\n  min-height: 70px;\n}\n\n.row-no-vdivide [class*='col-']:not(:last-child):after {\n  background: #e0e0e0;\n  width: 0px;\n  content: \"\";\n  display:block;\n  position: absolute;\n  top:0;\n  bottom: 0;\n  right: 0;\n  min-height: 70px;\n}\n"; });
define('crud',['exports', 'aurelia-framework', 'aurelia-event-aggregator', './services/identity-service', './services/chaincode-service', 'aurelia-validation'], function (exports, _aureliaFramework, _aureliaEventAggregator, _identityService, _chaincodeService, _aureliaValidation) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CRUD = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('CRUD');

  var CRUD = exports.CRUD = (_dec = (0, _aureliaFramework.inject)(_identityService.IdentityService, _aureliaEventAggregator.EventAggregator, _chaincodeService.ChaincodeService, _aureliaValidation.ValidationControllerFactory), _dec(_class = function () {
    function CRUD(identityService, eventAggregator, chaincodeService) {
      _classCallCheck(this, CRUD);

      this.channel = 'common';
      this.chaincode = 'reference';
      this.keyDelim = '\0';

      this.identityService = identityService;
      this.eventAggregator = eventAggregator;
      this.chaincodeService = chaincodeService;
    }

    CRUD.prototype.attached = function attached() {
      var _this = this;

      this.queryAll();

      this.subscriberBlock = this.eventAggregator.subscribe('block', function (o) {
        _this.queryAll();
      });
    };

    CRUD.prototype.detached = function detached() {
      this.subscriberBlock.dispose();
    };

    CRUD.prototype.queryAll = function queryAll() {};

    CRUD.prototype.query = function query(entity) {
      var _this2 = this;

      return this.chaincodeService.query(this.channel, this.chaincode, 'list', [entity]).then(function (o) {
        var a = o || [];
        _this2[entity + 'List'] = a.map(function (e) {
          e.id = _this2.fromKey(e.key)[1];
          return e;
        });
      }).catch(function (e) {
        log.error('cannot query', e);
      });
    };

    CRUD.prototype.put = function put(o, entity) {
      var _this3 = this;

      if (!o.key) {
        o.key = this.toKey([entity, o.id || this.guid()]);
      }
      var args = this.fromKey(o.key).concat([JSON.stringify(o.value)]);
      return this.chaincodeService.invoke(this.channel, this.chaincode, 'put', args).then(function () {
        _this3.removeEdit(entity);
      }).catch(function (e) {
        log.error('cannot put', e);
      });
    };

    CRUD.prototype.remove = function remove(key) {
      var _this4 = this;

      var args = this.fromKey(key);
      var entity = args[0];
      return this.chaincodeService.invoke(this.channel, this.chaincode, 'delete', args).then(function () {
        _this4.removeEdit(entity);
      }).catch(function (e) {
        log.error('cannot remove', e);
      });
    };

    CRUD.prototype.removeEdit = function removeEdit(entity) {
      this[entity + 'Edit'] = null;
    };

    CRUD.prototype.setCurrent = function setCurrent(key) {
      var _this5 = this;

      var args = this.fromKey(key);
      var entity = args[0];
      var id = args[1];
      return this.chaincodeService.query(this.channel, this.chaincode, 'get', args).then(function (o) {
        _this5[_this5.getCurrentTag(entity)] = { key: key, value: o, id: id };
      }).catch(function (e) {
        log.error('cannot query', e);
      });
    };

    CRUD.prototype.setNew = function setNew(entity) {
      this[this.getCurrentTag(entity)] = { new: true, value: {} };
    };

    CRUD.prototype.getCurrentTag = function getCurrentTag(entity) {
      return entity + (this.canEdit(entity) ? 'Edit' : 'View');
    };

    CRUD.prototype.canEdit = function canEdit(entity) {
      return true;
    };

    CRUD.prototype.fromKey = function fromKey(key) {
      var parts = key.split(this.keyDelim);
      return parts.length > 1 ? parts.slice(1, -1) : [key];
    };

    CRUD.prototype.toKey = function toKey(parts) {
      return this.keyDelim + parts.join(this.keyDelim) + this.keyDelim;
    };

    CRUD.prototype.guid = function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    return CRUD;
  }()) || _class);
});
define('config',['exports', './environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Config = undefined;

  var _environment2 = _interopRequireDefault(_environment);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var Config = exports.Config = function () {
    function Config() {
      _classCallCheck(this, Config);
    }

    Config.put = function put(key, val) {
      return localStorage.setItem(key, JSON.stringify(val));
    };

    Config.get = function get(key) {
      var val = localStorage.getItem(key);
      if (val === 'undefined' || val === null) {
        val = _environment2.default[key];
        this.put(key, val);
        return val;
      } else {
        return JSON.parse(val);
      }
    };

    Config.clear = function clear() {
      localStorage.clear();
    };

    Config.getUrl = function getUrl(path) {
      var baseUrl = Config.get('baseUrl');
      if (baseUrl) {
        return path ? baseUrl + '/' + path : baseUrl;
      } else {
        return path ? '/' + path : '/';
      }
    };

    return Config;
  }();
});
define('app',['exports', 'aurelia-i18n', 'aurelia-framework', './services/identity-service', './services/socket-service', './services/alert-service', './services/chaincode-service', 'bootstrap'], function (exports, _aureliaI18n, _aureliaFramework, _identityService, _socketService, _alertService, _chaincodeService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.App = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('App');

  var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_aureliaI18n.I18N, _identityService.IdentityService, _socketService.SocketService, _alertService.AlertService, _chaincodeService.ChaincodeService), _dec(_class = function () {
    function App(i18n, identityService, socketService, alertService, chaincodeService) {
      _classCallCheck(this, App);

      this.domain = null;

      this.i18n = i18n;

      this.i18n.setLocale('ru');
      this.identityService = identityService;
      this.socketService = socketService;
      this.alertService = alertService;
      this.chaincodeService = chaincodeService;
    }

    App.prototype.configureRouter = function configureRouter(config, router) {
      config.title = this.i18n.tr('appName');
      var routes = [{ route: ['', 'home'], name: 'home', moduleId: './home', nav: true, title: this.i18n.tr('home') }];
      config.map(routes);
      this.router = router;
    };

    App.prototype.attached = function attached() {
      var _this = this;

      this.username = this.identityService.username;
      this.org = this.identityService.org;
      this.socketService.subscribe();
      this.chaincodeService.getDomain().then(function (domain) {
        _this.domain = domain;
      });
    };

    App.prototype.getDomain = function getDomain() {
      var _this2 = this;

      this.chaincodeService.getDomain().then(function (domain) {
        _this2.domain = domain;
      });
    };

    App.prototype.detached = function detached() {
      log.debug('detached');
    };

    App.prototype.logout = function logout() {
      var _this3 = this;

      this.identityService.logout().then(function () {
        _this3.alertService.success('logged out');
      }).catch(function (e) {
        _this3.alertService.error('cannot log out, caught ' + e);
      });
    };

    return App;
  }()) || _class);
});
define('text!app.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"bootstrap/css/bootstrap.css\"></require>\n  <require from=\"toastr/build/toastr.min.css\"></require>\n\n  <nav class=\"navbar navbar-expand-md  mb-2 navbar-dark\" style=\"background-color: #000000;\">\n    <img src=\"images/logo-small.png\" width=\"25\" height=\"25\" alt=\"logo\">\n    <a class=\"navbar-brand mb-0 h1 mr-3 ml-2\" href=\"#/\" t=\"appName\"></a>\n    <button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarCollapse\"\n            aria-controls=\"navbarCollapse\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">\n      <span class=\"navbar-toggler-icon\"></span>\n    </button>\n    <div class=\"collapse navbar-collapse\" id=\"navbarCollapse\">\n      <div class=\"mr-auto ml-auto h1 text-white\">\n        ${domain}\n        <!--<img src=\"images/logo.png\" width=\"230\" height=\"50\" alt=\"logo\">-->\n      </div>\n      <!--<ul class=\"navbar-nav mr-auto ml-auto\">-->\n        <!--<li repeat.for=\"row of router.navigation\"-->\n            <!--class=\"nav-item ${row.isActive ? 'active' : ''} text-uppercase font-weight-bold text-center mt-2\">-->\n          <!--<h5><a class=\"nav-link ${row.isActive ? '' : 'disabled'}\" href.bind=\"row.href\">${row.title}</a></h5>-->\n        <!--</li>-->\n      <!--</ul>-->\n\n      <h3><a class=\"badge badge-light mt-2\">${org}</a></h3>\n      <ul class=\"navbar-nav mt-3 ml-3 mt-md-0\">\n        <li><a class=\"btn btn-sm btn-outline-secondary float-right text-uppercase\" href click.delegate=\"logout()\"><span\n          t=\"logout\">logout</span></a></li>\n      </ul>\n    </div>\n  </nav>\n\n  <!-- class=\"container\" -->\n  <main role=\"main\" style=\"width: 100%; margin: 0 auto; padding-right: 15px; padding-left: 15px;\">\n    <router-view></router-view>\n  </main>\n\n</template>\n"; });
define('../node_modules/json-formatter-js/dist/json-formatter',['require','exports','module'],function (require, exports, module) {module.exports = function(modules) {
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: !1,
            exports: {}
        };
        return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
        module.l = !0, module.exports;
    }
    var installedModules = {};
    return __webpack_require__.m = modules, __webpack_require__.c = installedModules, 
    __webpack_require__.i = function(value) {
        return value;
    }, __webpack_require__.d = function(exports, name, getter) {
        __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
            configurable: !1,
            enumerable: !0,
            get: getter
        });
    }, __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ? function() {
            return module.default;
        } : function() {
            return module;
        };
        return __webpack_require__.d(getter, "a", getter), getter;
    }, __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }, __webpack_require__.p = "dist", __webpack_require__(__webpack_require__.s = 6);
}([ function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    Object.defineProperty(__webpack_exports__, "__esModule", {
        value: !0
    });
    var __WEBPACK_IMPORTED_MODULE_0__helpers__ = __webpack_require__(5), __WEBPACK_IMPORTED_MODULE_1__style_less__ = __webpack_require__(4), DATE_STRING_REGEX = (__webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__style_less__), 
    /(^\d{1,4}[\.|\\\/|-]\d{1,2}[\.|\\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/), PARTIAL_DATE_REGEX = /\d{2}:\d{2}:\d{2} GMT-\d{4}/, JSON_DATE_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/, requestAnimationFrame = window.requestAnimationFrame || function(cb) {
        return cb(), 0;
    }, _defaultConfig = {
        hoverPreviewEnabled: !1,
        hoverPreviewArrayCount: 100,
        hoverPreviewFieldCount: 5,
        animateOpen: !0,
        animateClose: !0,
        theme: null,
        useToJSON: !0,
        sortPropertiesBy: null
    }, JSONFormatter = function() {
        function JSONFormatter(json, open, config, key) {
            void 0 === open && (open = 1), void 0 === config && (config = _defaultConfig), this.json = json, 
            this.open = open, this.config = config, this.key = key, this._isOpen = null, void 0 === this.config.hoverPreviewEnabled && (this.config.hoverPreviewEnabled = _defaultConfig.hoverPreviewEnabled), 
            void 0 === this.config.hoverPreviewArrayCount && (this.config.hoverPreviewArrayCount = _defaultConfig.hoverPreviewArrayCount), 
            void 0 === this.config.hoverPreviewFieldCount && (this.config.hoverPreviewFieldCount = _defaultConfig.hoverPreviewFieldCount), 
            void 0 === this.config.useToJSON && (this.config.useToJSON = _defaultConfig.useToJSON);
        }
        return Object.defineProperty(JSONFormatter.prototype, "isOpen", {
            get: function() {
                return null !== this._isOpen ? this._isOpen : this.open > 0;
            },
            set: function(value) {
                this._isOpen = value;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isDate", {
            get: function() {
                return this.json instanceof Date || "string" === this.type && (DATE_STRING_REGEX.test(this.json) || JSON_DATE_REGEX.test(this.json) || PARTIAL_DATE_REGEX.test(this.json));
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isUrl", {
            get: function() {
                return "string" === this.type && 0 === this.json.indexOf("http");
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isArray", {
            get: function() {
                return Array.isArray(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isObject", {
            get: function() {
                return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.a)(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isEmptyObject", {
            get: function() {
                return !this.keys.length && !this.isArray;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isEmpty", {
            get: function() {
                return this.isEmptyObject || this.keys && !this.keys.length && this.isArray;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "useToJSON", {
            get: function() {
                return this.config.useToJSON && "stringifiable" === this.type;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "hasKey", {
            get: function() {
                return void 0 !== this.key;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "constructorName", {
            get: function() {
                return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.b)(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "type", {
            get: function() {
                return null === this.json ? "null" : this.config.useToJSON && this.json && this.json.toJSON ? "stringifiable" : typeof this.json;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "keys", {
            get: function() {
                if (this.isObject) {
                    var keys = Object.keys(this.json).map(function(key) {
                        return key || '""';
                    });
                    return !this.isArray && this.config.sortPropertiesBy ? keys.sort(this.config.sortPropertiesBy) : keys;
                }
                return [];
            },
            enumerable: !0,
            configurable: !0
        }), JSONFormatter.prototype.toggleOpen = function() {
            this.isOpen = !this.isOpen, this.element && (this.isOpen ? this.appendChildren(this.config.animateOpen) : this.removeChildren(this.config.animateClose), 
            this.element.classList.toggle(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("open")));
        }, JSONFormatter.prototype.openAtDepth = function(depth) {
            void 0 === depth && (depth = 1), depth < 0 || (this.open = depth, this.isOpen = 0 !== depth, 
            this.element && (this.removeChildren(!1), 0 === depth ? this.element.classList.remove(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("open")) : (this.appendChildren(this.config.animateOpen), 
            this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("open")))));
        }, JSONFormatter.prototype.getInlinepreview = function() {
            var _this = this;
            if (this.isArray) return this.json.length > this.config.hoverPreviewArrayCount ? "Array[" + this.json.length + "]" : "[" + this.json.map(__WEBPACK_IMPORTED_MODULE_0__helpers__.d).join(", ") + "]";
            var keys = this.keys, narrowKeys = keys.slice(0, this.config.hoverPreviewFieldCount), kvs = narrowKeys.map(function(key) {
                return key + ":" + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)(_this.type, _this.json[key]);
            }), ellipsis = keys.length >= this.config.hoverPreviewFieldCount ? "…" : "";
            return "{" + kvs.join(", ") + ellipsis + "}";
        }, JSONFormatter.prototype.render = function() {
            this.element = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("div", "row");
            var togglerLink = this.isObject ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("a", "toggler-link") : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span");
            if (this.isObject && !this.useToJSON && togglerLink.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "toggler")), 
            this.hasKey && togglerLink.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "key", this.key + ":")), 
            this.isObject && !this.useToJSON) {
                var value = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "value"), objectWrapperSpan = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span"), constructorName = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "constructor-name", this.constructorName);
                if (objectWrapperSpan.appendChild(constructorName), this.isArray) {
                    var arrayWrapperSpan = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span");
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "bracket", "[")), 
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "number", this.json.length)), 
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "bracket", "]")), 
                    objectWrapperSpan.appendChild(arrayWrapperSpan);
                }
                value.appendChild(objectWrapperSpan), togglerLink.appendChild(value);
            } else {
                var value = this.isUrl ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("a") : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span");
                value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)(this.type)), 
                this.isDate && value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("date")), 
                this.isUrl && (value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("url")), 
                value.setAttribute("href", this.json));
                var valuePreview = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)(this.type, this.json, this.useToJSON ? this.json.toJSON() : this.json);
                value.appendChild(document.createTextNode(valuePreview)), togglerLink.appendChild(value);
            }
            if (this.isObject && this.config.hoverPreviewEnabled) {
                var preview = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("span", "preview-text");
                preview.appendChild(document.createTextNode(this.getInlinepreview())), togglerLink.appendChild(preview);
            }
            var children = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)("div", "children");
            return this.isObject && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("object")), 
            this.isArray && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("array")), 
            this.isEmpty && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("empty")), 
            this.config && this.config.theme && this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)(this.config.theme)), 
            this.isOpen && this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("open")), 
            this.element.appendChild(togglerLink), this.element.appendChild(children), this.isObject && this.isOpen && this.appendChildren(), 
            this.isObject && !this.useToJSON && togglerLink.addEventListener("click", this.toggleOpen.bind(this)), 
            this.element;
        }, JSONFormatter.prototype.appendChildren = function(animated) {
            var _this = this;
            void 0 === animated && (animated = !1);
            var children = this.element.querySelector("div." + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("children"));
            if (children && !this.isEmpty) if (animated) {
                var index_1 = 0, addAChild_1 = function() {
                    var key = _this.keys[index_1], formatter = new JSONFormatter(_this.json[key], _this.open - 1, _this.config, key);
                    children.appendChild(formatter.render()), (index_1 += 1) < _this.keys.length && (index_1 > 10 ? addAChild_1() : requestAnimationFrame(addAChild_1));
                };
                requestAnimationFrame(addAChild_1);
            } else this.keys.forEach(function(key) {
                var formatter = new JSONFormatter(_this.json[key], _this.open - 1, _this.config, key);
                children.appendChild(formatter.render());
            });
        }, JSONFormatter.prototype.removeChildren = function(animated) {
            void 0 === animated && (animated = !1);
            var childrenElement = this.element.querySelector("div." + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)("children"));
            if (animated) {
                var childrenRemoved_1 = 0, removeAChild_1 = function() {
                    childrenElement && childrenElement.children.length && (childrenElement.removeChild(childrenElement.children[0]), 
                    childrenRemoved_1 += 1, childrenRemoved_1 > 10 ? removeAChild_1() : requestAnimationFrame(removeAChild_1));
                };
                requestAnimationFrame(removeAChild_1);
            } else childrenElement && (childrenElement.innerHTML = "");
        }, JSONFormatter;
    }();
    __webpack_exports__.default = JSONFormatter;
}, function(module, exports, __webpack_require__) {
    exports = module.exports = __webpack_require__(2)(), exports.push([ module.i, '.json-formatter-row {\n  font-family: monospace;\n}\n.json-formatter-row,\n.json-formatter-row a,\n.json-formatter-row a:hover {\n  color: black;\n  text-decoration: none;\n}\n.json-formatter-row .json-formatter-row {\n  margin-left: 1rem;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty {\n  opacity: 0.5;\n  margin-left: 1rem;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty:after {\n  display: none;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {\n  content: "No properties";\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {\n  content: "[]";\n}\n.json-formatter-row .json-formatter-string,\n.json-formatter-row .json-formatter-stringifiable {\n  color: green;\n  white-space: pre;\n  word-wrap: break-word;\n}\n.json-formatter-row .json-formatter-number {\n  color: blue;\n}\n.json-formatter-row .json-formatter-boolean {\n  color: red;\n}\n.json-formatter-row .json-formatter-null {\n  color: #855A00;\n}\n.json-formatter-row .json-formatter-undefined {\n  color: #ca0b69;\n}\n.json-formatter-row .json-formatter-function {\n  color: #FF20ED;\n}\n.json-formatter-row .json-formatter-date {\n  background-color: rgba(0, 0, 0, 0.05);\n}\n.json-formatter-row .json-formatter-url {\n  text-decoration: underline;\n  color: blue;\n  cursor: pointer;\n}\n.json-formatter-row .json-formatter-bracket {\n  color: blue;\n}\n.json-formatter-row .json-formatter-key {\n  color: #00008B;\n  padding-right: 0.2rem;\n}\n.json-formatter-row .json-formatter-toggler-link {\n  cursor: pointer;\n}\n.json-formatter-row .json-formatter-toggler {\n  line-height: 1.2rem;\n  font-size: 0.7rem;\n  vertical-align: middle;\n  opacity: 0.6;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-row .json-formatter-toggler:after {\n  display: inline-block;\n  transition: transform 100ms ease-in;\n  content: "\\25BA";\n}\n.json-formatter-row > a > .json-formatter-preview-text {\n  opacity: 0;\n  transition: opacity 0.15s ease-in;\n  font-style: italic;\n}\n.json-formatter-row:hover > a > .json-formatter-preview-text {\n  opacity: 0.6;\n}\n.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {\n  transform: rotate(90deg);\n}\n.json-formatter-row.json-formatter-open > .json-formatter-children:after {\n  display: inline-block;\n}\n.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {\n  display: none;\n}\n.json-formatter-row.json-formatter-open.json-formatter-empty:after {\n  display: block;\n}\n.json-formatter-dark.json-formatter-row {\n  font-family: monospace;\n}\n.json-formatter-dark.json-formatter-row,\n.json-formatter-dark.json-formatter-row a,\n.json-formatter-dark.json-formatter-row a:hover {\n  color: white;\n  text-decoration: none;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-row {\n  margin-left: 1rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty {\n  opacity: 0.5;\n  margin-left: 1rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty:after {\n  display: none;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {\n  content: "No properties";\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {\n  content: "[]";\n}\n.json-formatter-dark.json-formatter-row .json-formatter-string,\n.json-formatter-dark.json-formatter-row .json-formatter-stringifiable {\n  color: #31F031;\n  white-space: pre;\n  word-wrap: break-word;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-number {\n  color: #66C2FF;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-boolean {\n  color: #EC4242;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-null {\n  color: #EEC97D;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-undefined {\n  color: #ef8fbe;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-function {\n  color: #FD48CB;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-date {\n  background-color: rgba(255, 255, 255, 0.05);\n}\n.json-formatter-dark.json-formatter-row .json-formatter-url {\n  text-decoration: underline;\n  color: #027BFF;\n  cursor: pointer;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-bracket {\n  color: #9494FF;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-key {\n  color: #23A0DB;\n  padding-right: 0.2rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-toggler-link {\n  cursor: pointer;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-toggler {\n  line-height: 1.2rem;\n  font-size: 0.7rem;\n  vertical-align: middle;\n  opacity: 0.6;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-toggler:after {\n  display: inline-block;\n  transition: transform 100ms ease-in;\n  content: "\\25BA";\n}\n.json-formatter-dark.json-formatter-row > a > .json-formatter-preview-text {\n  opacity: 0;\n  transition: opacity 0.15s ease-in;\n  font-style: italic;\n}\n.json-formatter-dark.json-formatter-row:hover > a > .json-formatter-preview-text {\n  opacity: 0.6;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {\n  transform: rotate(90deg);\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-children:after {\n  display: inline-block;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {\n  display: none;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open.json-formatter-empty:after {\n  display: block;\n}\n', "" ]);
}, function(module, exports) {
    module.exports = function() {
        var list = [];
        return list.toString = function() {
            for (var result = [], i = 0; i < this.length; i++) {
                var item = this[i];
                item[2] ? result.push("@media " + item[2] + "{" + item[1] + "}") : result.push(item[1]);
            }
            return result.join("");
        }, list.i = function(modules, mediaQuery) {
            "string" == typeof modules && (modules = [ [ null, modules, "" ] ]);
            for (var alreadyImportedModules = {}, i = 0; i < this.length; i++) {
                var id = this[i][0];
                "number" == typeof id && (alreadyImportedModules[id] = !0);
            }
            for (i = 0; i < modules.length; i++) {
                var item = modules[i];
                "number" == typeof item[0] && alreadyImportedModules[item[0]] || (mediaQuery && !item[2] ? item[2] = mediaQuery : mediaQuery && (item[2] = "(" + item[2] + ") and (" + mediaQuery + ")"), 
                list.push(item));
            }
        }, list;
    };
}, function(module, exports) {
    function addStylesToDom(styles, options) {
        for (var i = 0; i < styles.length; i++) {
            var item = styles[i], domStyle = stylesInDom[item.id];
            if (domStyle) {
                domStyle.refs++;
                for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j](item.parts[j]);
                for (;j < item.parts.length; j++) domStyle.parts.push(addStyle(item.parts[j], options));
            } else {
                for (var parts = [], j = 0; j < item.parts.length; j++) parts.push(addStyle(item.parts[j], options));
                stylesInDom[item.id] = {
                    id: item.id,
                    refs: 1,
                    parts: parts
                };
            }
        }
    }
    function listToStyles(list) {
        for (var styles = [], newStyles = {}, i = 0; i < list.length; i++) {
            var item = list[i], id = item[0], css = item[1], media = item[2], sourceMap = item[3], part = {
                css: css,
                media: media,
                sourceMap: sourceMap
            };
            newStyles[id] ? newStyles[id].parts.push(part) : styles.push(newStyles[id] = {
                id: id,
                parts: [ part ]
            });
        }
        return styles;
    }
    function insertStyleElement(options, styleElement) {
        var head = getHeadElement(), lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
        if ("top" === options.insertAt) lastStyleElementInsertedAtTop ? lastStyleElementInsertedAtTop.nextSibling ? head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling) : head.appendChild(styleElement) : head.insertBefore(styleElement, head.firstChild), 
        styleElementsInsertedAtTop.push(styleElement); else {
            if ("bottom" !== options.insertAt) throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
            head.appendChild(styleElement);
        }
    }
    function removeStyleElement(styleElement) {
        styleElement.parentNode.removeChild(styleElement);
        var idx = styleElementsInsertedAtTop.indexOf(styleElement);
        idx >= 0 && styleElementsInsertedAtTop.splice(idx, 1);
    }
    function createStyleElement(options) {
        var styleElement = document.createElement("style");
        return styleElement.type = "text/css", insertStyleElement(options, styleElement), 
        styleElement;
    }
    function createLinkElement(options) {
        var linkElement = document.createElement("link");
        return linkElement.rel = "stylesheet", insertStyleElement(options, linkElement), 
        linkElement;
    }
    function addStyle(obj, options) {
        var styleElement, update, remove;
        if (options.singleton) {
            var styleIndex = singletonCounter++;
            styleElement = singletonElement || (singletonElement = createStyleElement(options)), 
            update = applyToSingletonTag.bind(null, styleElement, styleIndex, !1), remove = applyToSingletonTag.bind(null, styleElement, styleIndex, !0);
        } else obj.sourceMap && "function" == typeof URL && "function" == typeof URL.createObjectURL && "function" == typeof URL.revokeObjectURL && "function" == typeof Blob && "function" == typeof btoa ? (styleElement = createLinkElement(options), 
        update = updateLink.bind(null, styleElement), remove = function() {
            removeStyleElement(styleElement), styleElement.href && URL.revokeObjectURL(styleElement.href);
        }) : (styleElement = createStyleElement(options), update = applyToTag.bind(null, styleElement), 
        remove = function() {
            removeStyleElement(styleElement);
        });
        return update(obj), function(newObj) {
            if (newObj) {
                if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) return;
                update(obj = newObj);
            } else remove();
        };
    }
    function applyToSingletonTag(styleElement, index, remove, obj) {
        var css = remove ? "" : obj.css;
        if (styleElement.styleSheet) styleElement.styleSheet.cssText = replaceText(index, css); else {
            var cssNode = document.createTextNode(css), childNodes = styleElement.childNodes;
            childNodes[index] && styleElement.removeChild(childNodes[index]), childNodes.length ? styleElement.insertBefore(cssNode, childNodes[index]) : styleElement.appendChild(cssNode);
        }
    }
    function applyToTag(styleElement, obj) {
        var css = obj.css, media = obj.media;
        if (media && styleElement.setAttribute("media", media), styleElement.styleSheet) styleElement.styleSheet.cssText = css; else {
            for (;styleElement.firstChild; ) styleElement.removeChild(styleElement.firstChild);
            styleElement.appendChild(document.createTextNode(css));
        }
    }
    function updateLink(linkElement, obj) {
        var css = obj.css, sourceMap = obj.sourceMap;
        sourceMap && (css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */");
        var blob = new Blob([ css ], {
            type: "text/css"
        }), oldSrc = linkElement.href;
        linkElement.href = URL.createObjectURL(blob), oldSrc && URL.revokeObjectURL(oldSrc);
    }
    var stylesInDom = {}, memoize = function(fn) {
        var memo;
        return function() {
            return void 0 === memo && (memo = fn.apply(this, arguments)), memo;
        };
    }, isOldIE = memoize(function() {
        return /msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase());
    }), getHeadElement = memoize(function() {
        return document.head || document.getElementsByTagName("head")[0];
    }), singletonElement = null, singletonCounter = 0, styleElementsInsertedAtTop = [];
    module.exports = function(list, options) {
        if ("undefined" != typeof DEBUG && DEBUG && "object" != typeof document) throw new Error("The style-loader cannot be used in a non-browser environment");
        options = options || {}, void 0 === options.singleton && (options.singleton = isOldIE()), 
        void 0 === options.insertAt && (options.insertAt = "bottom");
        var styles = listToStyles(list);
        return addStylesToDom(styles, options), function(newList) {
            for (var mayRemove = [], i = 0; i < styles.length; i++) {
                var item = styles[i], domStyle = stylesInDom[item.id];
                domStyle.refs--, mayRemove.push(domStyle);
            }
            if (newList) {
                addStylesToDom(listToStyles(newList), options);
            }
            for (var i = 0; i < mayRemove.length; i++) {
                var domStyle = mayRemove[i];
                if (0 === domStyle.refs) {
                    for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();
                    delete stylesInDom[domStyle.id];
                }
            }
        };
    };
    var replaceText = function() {
        var textStore = [];
        return function(index, replacement) {
            return textStore[index] = replacement, textStore.filter(Boolean).join("\n");
        };
    }();
}, function(module, exports, __webpack_require__) {
    var content = __webpack_require__(1);
    "string" == typeof content && (content = [ [ module.i, content, "" ] ]);
    __webpack_require__(3)(content, {});
    content.locals && (module.exports = content.locals);
}, function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    function escapeString(str) {
        return str.replace('"', '"');
    }
    function isObject(value) {
        var type = typeof value;
        return !!value && "object" == type;
    }
    function getObjectName(object) {
        if (void 0 === object) return "";
        if (null === object) return "Object";
        if ("object" == typeof object && !object.constructor) return "Object";
        var funcNameRegex = /function ([^(]*)/, results = funcNameRegex.exec(object.constructor.toString());
        return results && results.length > 1 ? results[1] : "";
    }
    function getValuePreview(type, object, value) {
        return "null" === type || "undefined" === type ? type : ("string" !== type && "stringifiable" !== type || (value = '"' + escapeString(value) + '"'), 
        "function" === type ? object.toString().replace(/[\r\n]/g, "").replace(/\{.*\}/, "") + "{…}" : value);
    }
    function getPreview(type, object) {
        var value = "";
        return isObject(object) ? (value = getObjectName(object), Array.isArray(object) && (value += "[" + object.length + "]")) : value = getValuePreview(type, object, object), 
        value;
    }
    function cssClass(className) {
        return "json-formatter-" + className;
    }
    function createElement(type, className, content) {
        var el = document.createElement(type);
        return className && el.classList.add(cssClass(className)), void 0 !== content && (content instanceof Node ? el.appendChild(content) : el.appendChild(document.createTextNode(String(content)))), 
        el;
    }
    __webpack_exports__.a = isObject, __webpack_exports__.b = getObjectName, __webpack_exports__.f = getValuePreview, 
    __webpack_exports__.d = getPreview, __webpack_exports__.c = cssClass, __webpack_exports__.e = createElement;
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(0);
} ]);

});

//# sourceMappingURL=app-bundle.js.map