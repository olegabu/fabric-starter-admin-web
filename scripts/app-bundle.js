define('account',['exports', './crud', 'aurelia-framework', 'aurelia-event-aggregator', './services/identity-service', './services/chaincode-service'], function (exports, _crud, _aureliaFramework, _aureliaEventAggregator, _identityService, _chaincodeService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Account = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var _dec, _class;

  var Account = exports.Account = (_dec = (0, _aureliaFramework.inject)(_identityService.IdentityService, _aureliaEventAggregator.EventAggregator, _chaincodeService.ChaincodeService), _dec(_class = function (_CRUD) {
    _inherits(Account, _CRUD);

    function Account() {
      var _temp, _this, _ret;

      _classCallCheck(this, Account);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, _CRUD.call.apply(_CRUD, [this].concat(args))), _this), _this.accountTypeByName = {}, _temp), _possibleConstructorReturn(_this, _ret);
    }

    Account.prototype.queryAll = function queryAll() {
      var res = [];
      res.push(this.query('account'));

      return Promise.all(res);
    };

    Account.prototype.setNew = function setNew() {
      this.accountEdit = { new: true, value: {} };
    };

    return Account;
  }(_crud.CRUD)) || _class);
});
define('app',['exports', 'aurelia-i18n', 'aurelia-framework', './services/identity-service', './services/socket-service', './services/alert-service', 'bootstrap'], function (exports, _aureliaI18n, _aureliaFramework, _identityService, _socketService, _alertService) {
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

  var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_aureliaI18n.I18N, _identityService.IdentityService, _socketService.SocketService, _alertService.AlertService), _dec(_class = function () {
    function App(i18n, identityService, socketService, alertService) {
      _classCallCheck(this, App);

      this.i18n = i18n;

      this.i18n.setLocale('ru');
      this.identityService = identityService;
      this.socketService = socketService;
      this.alertService = alertService;
    }

    App.prototype.configureRouter = function configureRouter(config, router) {
      config.title = this.i18n.tr('appName');
      var routes = [{ route: ['', 'home'], name: 'home', moduleId: './home', nav: true, title: this.i18n.tr('home') }];

      config.map(routes);
      this.router = router;
    };

    App.prototype.attached = function attached() {
      this.username = this.identityService.username;
      this.org = this.identityService.org;

      this.socketService.subscribe();
    };

    App.prototype.detached = function detached() {
      log.debug('detached');
    };

    App.prototype.logout = function logout() {
      var _this = this;

      this.identityService.logout().then(function () {
        _this.alertService.success('logged out');
      }).catch(function (e) {
        _this.alertService.error('cannot log out, caught ' + e);
      });
    };

    return App;
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
define('home',['exports', 'aurelia-framework', 'aurelia-event-aggregator', './services/identity-service', './services/chaincode-service', './services/config-service'], function (exports, _aureliaFramework, _aureliaEventAggregator, _identityService, _chaincodeService, _configService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Home = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var log = _aureliaFramework.LogManager.getLogger('Home');

  var Home = exports.Home = (_dec = (0, _aureliaFramework.inject)(_identityService.IdentityService, _aureliaEventAggregator.EventAggregator, _chaincodeService.ChaincodeService, _configService.ConfigService), _dec(_class = function () {
    function Home(identityService, eventAggregator, chaincodeService, configService) {
      _classCallCheck(this, Home);

      this.channelList = [];
      this.chaincodeList = [];
      this.orgList = [];
      this.orgs = [];
      this.installedChain = [];
      this.blocks = [];
      this.targets = [];
      this.lastBlock = null;
      this.oneChannel = null;
      this.oneChaincode = null;
      this.oneOrg = null;
      this.fnc = null;
      this.args = null;
      this.invoke = null;
      this.query = null;
      this.selectedChain = null;
      this.i = 0;

      this.identityService = identityService;
      this.eventAggregator = eventAggregator;
      this.chaincodeService = chaincodeService;
      this.configService = configService;
    }

    Home.prototype.attached = function attached() {
      var _this = this;

      this.queryChannels();
      this.subscriberBlock = this.eventAggregator.subscribe('block', function (o) {
        log.debug('block', o);
        _this.queryAll();
      });
    };

    Home.prototype.detached = function detached() {
      this.subscriberBlock.dispose();
    };

    Home.prototype.queryAll = function queryAll() {};

    Home.prototype.queryChannels = function queryChannels() {
      var _this2 = this;

      this.chaincodeService.getChannels().then(function (channels) {
        _this2.channelList = channels;
      });
    };

    Home.prototype.queryChaincodes = function queryChaincodes() {
      var _this3 = this;

      this.chaincodeService.getChaincodes(this.oneChannel).then(function (chaincodes) {
        _this3.chaincodeList = chaincodes;
      });
      this.queryBlocks();
      this.queryOrgs();
      this.queryAllChain();
    };

    Home.prototype.queryOrgs = function queryOrgs() {
      var _this4 = this;

      this.chaincodeService.getOrgs(this.oneChannel).then(function (orgs) {
        _this4.orgList = orgs;
      });
    };

    Home.prototype.queryTarg = function queryTarg() {
      this.targets = JSON.parse(JSON.stringify(this.orgList));
      var pos = this.targets.indexOf("Orderer");
      this.targets.splice(pos, 1);
    };

    Home.prototype.queryAllChain = function queryAllChain() {
      var _this5 = this;

      this.chaincodeService.getInstalledChaincodes().then(function (chain) {
        _this5.installedChain = chain;
      });
    };

    Home.prototype.queryBlocks = function queryBlocks() {
      var _this6 = this;

      this.blocks = [];
      var bl = [];
      this.chaincodeService.getLastBlock(this.oneChannel).then(function (block) {
        for (var i = block - 5; i < block; i++) {
          if (i < 0) continue;
          _this6.chaincodeService.getBlock(_this6.oneChannel, i).then(function (block) {
            bl.push(block);
          });
        }
        bl.sort();
      });
      this.blocks = bl;
      console.log(this.blocks);
    };

    Home.prototype.addChannelOrg = function addChannelOrg() {
      this.chaincodeService.addOrg(this.oneChannel, this.oneOrg);
      this.queryOrgs();
    };

    Home.prototype.getInvoke = function getInvoke() {
      var _this7 = this;

      this.query = null;
      this.chaincodeService.invoke(this.oneChannel, this.oneChaincode, this.fnc, this.args).then(function (invoke) {
        console.log(invoke);
        _this7.blocks.splice(0, 1);
        _this7.blocks.push(invoke.blockNumber);
        _this7.invoke = invoke;
      });
    };

    Home.prototype.getQuery = function getQuery() {
      var _this8 = this;

      this.invoke = null;
      this.chaincodeService.query(this.oneChannel, this.oneChaincode, this.fnc, this.args).then(function (query) {
        _this8.query = query;
      });
    };

    return Home;
  }()) || _class);
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
          loadPath: './locales/{{lng}}/{{ns}}.json' },
        attributes: aliases,
        lng: 'en',
        fallbackLng: 'en',
        debug: false
      });
    }).plugin('aurelia-table').plugin('aurelia-validation').plugin('aurelia-bootstrap', function (config) {
      return config.options.version = 4;
    }).feature('resources');

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
define('resources/index',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(config) {}
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
      this.toastr.options.timeOut = 1000;
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
                _this.alertService.error(msg);
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

    ChaincodeService.prototype.getLastBlock = function getLastBlock(channel, org, username) {
      var _this2 = this;

      var url = _config.Config.getUrl('channels/' + channel);

      return new Promise(function (resolve, reject) {
        _this2.fetch(url, null, 'get', org, username).then(function (j) {
          var test = j.height;
          resolve(test.low);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getBlock = function getBlock(channel, num, org, username) {
      var _this3 = this;

      log.debug('getChannels ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/blocks/' + num);

      return new Promise(function (resolve, reject) {
        _this3.fetch(url, null, 'get', org, username).then(function (j) {
          var test = j.header;
          resolve(test.number);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getChannels = function getChannels(org, username) {
      var _this4 = this;

      log.debug('getChannels ' + org + ' ' + username);

      var url = baseUrl;

      return new Promise(function (resolve, reject) {
        _this4.fetch(url, null, 'get', org, username).then(function (j) {
          var channels = j.map(function (o) {
            return o.channel_id;
          });
          resolve(channels);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.getChaincodes = function getChaincodes(channel, org, username) {
      var _this5 = this;

      log.debug('getChaincodes ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes');
      return new Promise(function (resolve, reject) {
        _this5.fetch(url, null, 'get', org, username).then(function (j) {
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
      var _this6 = this;

      log.debug('getChaincodes ' + org + ' ' + username);

      var url = _config.Config.getUrl('chaincodes');

      return new Promise(function (resolve, reject) {
        _this6.fetch(url, null, 'get', org, username).then(function (j) {
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
      var _this7 = this;

      log.debug('getOrgs ' + org + ' ' + username);
      var url = _config.Config.getUrl('channels/' + channel + '/orgs');

      return new Promise(function (resolve, reject) {
        _this7.fetch(url, null, 'get', org, username).then(function (j) {
          var orgs = j.map(function (o) {
            return o.id;
          });

          resolve(orgs);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.query = function query(channel, chaincode, func, args, org, username) {
      var _this8 = this;

      log.debug('query channel=' + channel + ' chaincode=' + chaincode + ' func=' + func + ' ' + org + ' ' + username, args);
      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes/' + chaincode);

      var params = {
        channelId: channel,
        chaincodeId: chaincode,
        fcn: func,
        args: (0, _aureliaFetchClient.json)(args.trim().split(" "))
      };

      return new Promise(function (resolve, reject) {
        _this8.fetch(url, params, 'get', org, username).then(function (j) {
          resolve(j);
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    ChaincodeService.prototype.invoke = function invoke(channel, chaincode, func, args, org, username) {
      var _this9 = this;

      log.debug('invoke channel=' + channel + ' chaincode=' + chaincode + ' func=' + func + ' ' + org + ' ' + username, args);

      var url = _config.Config.getUrl('channels/' + channel + '/chaincodes/' + chaincode);
      var params = {
        channelId: channel,
        chaincodeId: chaincode,
        fcn: func,
        args: args.trim().split(" ")
      };
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _this9.fetch(url, params, 'post', org, username).then(function (j) {
            console.log(j);
            resolve(j);
          }).catch(function (err) {
            reject(err);
          });
        });
      });
    };

    return ChaincodeService;
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
define('text!account.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./resources/elements/key\"></require>\n\n  <table class=\"table table-striped\"\n         aurelia-table=\"data.bind: accountList; display-data.bind: $accountListDisplayData\">\n    <caption style=\"caption-side: top; text-transform: uppercase; text-align: left;\">\n      <button class=\"float-none btn btn-success\" show.bind=\"canEdit('account')\" click.trigger=\"setNew('account')\">\n        <span t=\"create\"></span></button>\n    </caption>\n    <thead>\n    <tr>\n      <th t=\"key\"></th>\n      <th t=\"name\"></th>\n    </tr>\n    </thead>\n    <tbody>\n    <tr repeat.for=\"o of $accountListDisplayData\">\n      <td>\n        <button class=\"btn btn-link\" click.trigger=\"setCurrent(o.key)\">\n          <key data.bind=\"o.key\"></key>\n        </button>\n      </td>\n      <td>${o.value.name}</td>\n    </tr>\n    </tbody>\n  </table>\n  <form submit.delegate=\"put(accountEdit, 'account')\" show.bind=\"accountEdit.key || accountEdit.new\">\n    <div class=\"form-group row\" show.bind=\"accountEdit.new\">\n      <label class=\"col-sm-2 col-form-label\" t=\"id\"></label>\n      <div class=\"col-sm-10\">\n        <input type=\"text\" class=\"form-control\" value.bind=\"accountEdit.id\">\n      </div>\n    </div>\n    <div class=\"form-group row\">\n      <label class=\"col-sm-2 col-form-label\" t=\"name\"></label>\n      <div class=\"col-sm-10\">\n        <input type=\"text\" class=\"form-control\" value.bind=\"accountEdit.value.name\" required>\n      </div>\n    </div>\n    <div class=\"form-group row\">\n      <div class=\"col-sm-6\">\n        <button type=\"submit\" class=\"btn btn-success\" t=\"save\">save</button>\n      </div>\n      <div class=\"col-sm-6\">\n        <button class=\"btn btn-danger float-right\" show.bind=\"!accountEdit.new\" click.trigger=\"remove(accountEdit.key)\"\n                t=\"delete\">delete\n        </button>\n      </div>\n    </div>\n  </form>\n</template>\n"; });
define('text!app.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"bootstrap/css/bootstrap.css\"></require>\n  <require from=\"toastr/build/toastr.min.css\"></require>\n\n  <nav class=\"navbar navbar-expand-md  mb-4 navbar-dark\" style=\"background-color: #000000;\">\n    <a class=\"navbar-brand mb-0 h1 mr-3\" href=\"#/\" t=\"appName\"></a>\n    <button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarCollapse\" aria-controls=\"navbarCollapse\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">\n      <span class=\"navbar-toggler-icon\"></span>\n    </button>\n    <div class=\"collapse navbar-collapse\" id=\"navbarCollapse\">\n      <ul class=\"navbar-nav mr-auto ml-auto\">\n        <li repeat.for=\"row of router.navigation\" class=\"nav-item ${row.isActive ? 'active' : ''} text-uppercase font-weight-bold text-center mt-2\">\n          <h5><a class=\"nav-link ${row.isActive ? '' : 'disabled'}\" href.bind=\"row.href\">${row.title}</a></h5>\n        </li>\n      </ul>\n      <h3><a href=\"#\" class=\"badge badge-light mt-2\">${org}</a></h3>\n      <ul class=\"navbar-nav mt-3 ml-3 mt-md-0\">\n        <li><a class=\"btn btn-sm btn-outline-secondary float-right text-uppercase\" href click.delegate=\"logout()\"><span t=\"logout\">logout</span></a></li>\n      </ul>\n    </div>\n  </nav>\n<!-- class=\"container\" -->\n  <main role=\"main\" style=\"width: 100%; margin: 0 auto; padding-right: 15px; padding-left: 15px;\">\n    <router-view></router-view>\n  </main>\n\n</template>\n"; });
define('text!home.html', ['module'], function(module) { module.exports = "<template>\n\n  <form>\n    <div class=\"col-md-5\">\n      <div class=\"d-inline p-2 text-white mr-1\" style=\"background-color: #000000;\" repeat.for=\"o of blocks\">\n        ${o}\n      </div>\n    </div>\n  </form>\n\n  <form class=\"bg-light text-dark my-2\">\n    <div class=\"row\">\n\n      <div class=\"col-md-3\">\n        <h4 t=\"channelList\">channelList</h4>\n        <div repeat.for=\"o of channelList\">\n          <label class=\"btn my-2\">\n            <input class=\"form-check-input\" type=\"radio\" value.bind=\"o\" autocomplete=\"off\" checked.bind='oneChannel'\n                   change.delegate=\"queryChaincodes()\">\n            ${o}\n          </label>\n        </div>\n      </div>\n\n      <div class=\"col-md-3\">\n        <h4 t=\"chaincodeList\">chaincodeList</h4>\n        <div repeat.for=\"o of chaincodeList\" toggle>\n          <label class=\"btn my-2\"><input class=\"form-check-input\" type=\"radio\" value.bind=\"o\"\n                                         checked.bind='oneChaincode' change.delegate=\"queryTarg()\">${o}</label>\n        </div>\n\n        <div class=\"form-group\">\n          <h4 t=\"Downloaded Chaincodes\">Downloaded Chaincodes</h4>\n          <label>\n            <select class=\"form-control\" value.bind=\"selectedChain\">\n              <option model.bind=\"null\">Choose...</option>\n              <option repeat.for=\"chain of installedChain\"\n                      model.bind=\"chain\">\n                ${chain}\n              </option>\n            </select>\n          </label>\n          <button type=\"submit\" class=\"btn btn-sm text-white\" style=\"background-color: #000000;\" click.trigger=\"addChannelChaincode()\">Add Chaincode\n          </button>\n        </div>\n\n\n        <h4 t=\"orgList\">orgList</h4>\n        <div repeat.for=\"o of orgList\">\n          <ul class=\"list-group\">\n            <li class=\"list-group-item my-2\">${o}</li>\n          </ul>\n        </div>\n        <div class=\"form-group my-2\">\n          <input type=\"text\" class=\"form-control\" value.bind=\"oneOrg\" placeholder=\"New Organizatoin\">\n          <button type=\"submit\" class=\"btn btn-sm my-2 text-white\" style=\"background-color: #000000;\" click.trigger=\"addChannelOrg()\">Add Organization\n          </button>\n        </div>\n      </div>\n\n      <div class=\"col-md-3\">\n        <h4 t=\"Targets\">Targets</h4>\n\n\n        <div repeat.for=\"o of targets\">\n          <label class=\"btn my-2\"><input type=\"checkbox\" value.bind=\"o\" checked.bind=\"orgs\">${o}</label>\n        </div>\n        <input class=\"form-control\" type=\"text\" value.bind=\"fnc\" placeholder=\"Function, example: put\">\n        <input class=\"form-control my-2\" type=\"text\" value.bind=\"args\"\n               placeholder=\"Args, example: account 1 {name:&quot;one&quot;}\">\n        <button type=\"submit\" class=\"btn my-2 text-white\" style=\"background-color: #000000;\" click.trigger=\"getInvoke()\">Invoke</button>\n        <button type=\"submit\" class=\"btn my-2 text-white\" style=\"background-color: #000000;\" click.trigger=\"getQuery()\">Query</button>\n      </div>\n    </div>\n  </form>\n\n  <form>\n    <p class=\"lead\">Result of query: ${query}</p>\n    <p class=\"lead\">Result of invoke:</p>\n    <p>Txid: ${invoke.txid}</p>\n    <p>Block: ${invoke.blockNumber}</p>\n  </form>\n</template>\n\n"; });
define('text!login.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"bootstrap/css/bootstrap.css\"></require>\n  <require from=\"toastr/build/toastr.min.css\"></require>\n\n  <div class=\"container h-100\" style=\"margin-top: 200px\">\n    <div class=\"row h-100 justify-content-center align-items-center\">\n      <form class=\"form-signin\" submit.delegate=\"login()\">\n        <h1 class=\"text-center text-uppercase\">${org}</h1>\n        <p t=\"enrollGreeting\">You're connected to your organization's API server. Login or register.</p>\n        <div class=\"form-group\">\n          <input type=\"text\" class=\"form-control\" placeholder=\"Username\" required autofocus value.bind=\"username\">\n        </div>\n        <div class=\"form-group\">\n          <input type=\"password\" class=\"form-control\" placeholder=\"Password\" required value.bind=\"password\">\n        </div>\n        <div class=\"form-group\">\n          <button class=\"btn btn-lg text-white btn-block\" style=\"background-color: #000000;\" type=\"submit\" t=\"enroll\">enroll</button>\n        </div>\n      </form>\n    </div>\n  </div>\n</template>\n"; });
define('text!resources/elements/key.html', ['module'], function(module) { module.exports = "<template>\n  <abbr title=\"key=${o} objectType=${objectType} id=${id}\">${id}</abbr>\n</template>\n"; });
//# sourceMappingURL=app-bundle.js.map