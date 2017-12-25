/* eslint no-console: */
/* eslint no-unused-expressions: */
/* eslint no-underscore-dangle: */

/**
 * [sdkloader for napi 版本]
 */
((root, doc) => {
  const { toString, hasOwnProperty } = Object.prototype;
  function noop() {}
  /**
   * [读取localstorage的值]
   * @param  {string} key [localstorage的key]
   * @return {*}     [返回localstorage的value]
   */
  function getLsItem(key) {
    let val = null;
    const cacheData = root.localStorage.getItem(key);
    if (cacheData) {
      val = JSON.parse(cacheData);
    }
    return val;
  }

  function getLsData(key) {
    const lsItem = getLsItem(key);
    return lsItem && lsItem.data;
  }

  /**
   * [设置localstorage的值]
   * @param {string} key          [localstorage的key]
   * @param {*} data         [localstorage的value]
   * @param {number} expireSecond [多少秒后过期]
   */
  function setLsItem(key, data, expireSecond) {
    const nowTime = new Date().getTime();
    const expireTime = expireSecond ? nowTime + expireSecond * 1000 : ''; // eslint-disable-line
    const value = { data };
    if (expireTime) value.expireTime = expireTime;
    root.localStorage.setItem(key, JSON.stringify(value));
  }

  function removeLsItem(key) {
    root.localStorage.removeItem(key);
  }

  function objectValueToArray(obj) {
    const arr = [];
    forEach(obj, (val) => arr.push(val));
    return arr;
  }

  function type(obj) {
    let t;
    if (obj == null) {
      t = String(obj);
    } else {
      t = toString.call(obj).toLowerCase();
      t = t.substring(8, t.length - 1);
    }
    return t;
  }
  function isArray(o) {
    return type(o) === 'array';
  }

  function isObject(o) {
    return type(o) === 'object';
  }

  // object or array 迭代器
  function forEach(obj, iterator, ctx) {
    if (typeof obj !== 'object') return;
    let i;
    let l;
    const t = type(obj);
    const context = ctx || obj;
    if (t === 'array' || t === 'arguments' || t === 'nodelist') {
      for (i = 0, l = obj.length; i < l; i += 1) {
        if (iterator.call(context, obj[i], i, obj) === false) return;
      }
    } else {
      for (i in obj) {
        if (hasOwnProperty.call(obj, i)) {
          if (iterator.call(context, obj[i], i, obj) === false) return;
        }
      }
    }
  }

  // const md5 = (str) => root.__SDKLIB__ && root.__SDKLIB__.md5 && root.__SDKLIB__.md5(str);

  class Loader {
    constructor(opts) {
      this.cachePrefix = opts.cachePrefix;
      this.loaderPath = `${this.cachePrefix}__LOADER_PATH__`;
      this.loaderStatus = !!root[`${this.cachePrefix}__STATUS__`];
      this.results = {};
      this.maps = {};
      this.options = Object.assign({
        mapPath: '',
        cndMapPath: '',
        staticHost: '',
        accuracy: 1, // 版本校验的精度，0:10秒级别，1:分钟级别，2:小时级别，3:天级别，4:周级别
        retryTimes: 2,
        async: false,
        lsCache: false,
        canReload: true, // 允许加载相同的sdk
        comboPattern: '//image.uc.cn/e/uaeext/m;1y/$1;$2',
        maxUrlLength: 1999
      }, opts);
      this.modulePrefix = `${this.cachePrefix}__module__`;
      this.mapsKey = `${this.cachePrefix}__maps`;
      this.moduleOldCache = {};
      this.moduleNewCache = {};
      this.urlPattern = null;
      this.mapsExpireTime = null;
      this.modules = [];
      this.urls = [];
    }
    getLsUrls() {
      return getLsItem(this.loaderPath);
    }
    saveFilePaths() {
      setLsItem(this.loaderPath, this.urls, this.dateStep());
    }
    removeFilePaths() {
      removeLsItem(this.loaderPath);
    }
    removeLoadedScript = (name) => {
      const script = doc.getElementById(name);
      if (script && script.remove) script.remove();
    }
    ajax = opts => {
      const options = opts || {};
      options.dataType = options.dataType || 'json';
      const params = this.formatParams(options.data);
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const { status } = xhr;
          if (status >= 200 && status < 300 && options.success) {
            options.success(xhr.responseText, xhr.responseXML);
          } else if (options.fail) {
            options.fail(status);
          }
        }
      };
      const urlTag = options.url.indexOf('?') !== -1 ? '&' : '?';
      const url = params ? `${options.url}${urlTag}${params}` : options.url;
      xhr.open('GET', url, true);
      xhr.send(null);
    }

    formatParams = data => {
      const arr = [];
      forEach(data, (val, key) => arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`));
      return arr.length ? arr.join('&') : '';
    }

    dateStep = () => {
      let step;
      switch (this.options.accuracy) {
        case 1: // 分钟
          step = 60;
          break;
        case 2: // 小时
          step = 60 * 60;
          break;
        case 3: // 天
          step = 60 * 60 * 24;
          break;
        case 4: // 周
          step = 60 * 60 * 24 * 7;
          break;
        default:
          step = 10;
          break;
      }
      return step;
    }

    insertAfter = (newElement, targetElement) => {
      const parent = targetElement.parentNode;
      if (parent.lastChild === targetElement) {
        parent.appendChild(newElement);
      } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
      }
    }

    createTextNode = (sourceString) => {
      const s = document.createElement('script');
      s.appendChild(document.createTextNode(sourceString));
      document.head.appendChild(s);
    }

    /**
     * 动态插入js文件
     *
     * @param urls Array
     * @param callback
     */
    loadScripts = (urls, callback) => {
      if (urls && urls.length) {
        const { options } = this;
        let count = 0;
        const _loadScript = (url = urls[count]) => {
          this.removeLoadedScript(url);
          const { head } = doc;
          const script = doc.createElement('script');
          const src = url.indexOf('//') === -1 && options.staticHost ? options.staticHost + url : url;
          script.id = url.split('/').pop();
          script.async = false;
          script.type = 'text/javascript';
          script.charset = 'utf-8';
          script.src = src;
          this.insertAfter(script, head.lastChild);
          script.addEventListener('error', e => {
            // console.log(e);
            this.removeFilePaths();
            if (options.retryTimes > 0) {
              this.updateLoaderStatus(false);
              this.run();
              options.retryTimes += -1;
            } else if (options.error) {
              // throw new Error(`${e.target.src} no found!`);
              options.error(`${e.target.src} no found!`);
            }
          });
          script.addEventListener(
            'load',
            () => {
              const _url = urls[(count += 1)];
              if (_url) {
                _loadScript(_url);
              } else {
                callback && callback();
              }
            },
            false
          );
        };
        _loadScript();
      }
    }

    formatResult = () => {
      let results = {...this.results};
      let urls = [];
      if (results.data) {
        results = isArray(results.data) ? results.data[0].file : results.data.file;
        if (isArray(results)) {
          urls = results;
        } else if (isObject(results)) {
          urls = objectValueToArray(results);
        }
      } else if (isObject(results)) {
        urls = objectValueToArray(results);
      }
      this.urls = urls;
    }

    ajaxGet = (callback, dataType) => {
      const { mapPath, cdnMapPath, staticHost } = this.options;
      let hasLoadError = false;
      const _getFilePath = (apiPath = mapPath) => {
        if (hasLoadError) return;
        if (apiPath === cdnMapPath) hasLoadError = true;
        const url = apiPath.indexOf('//') === -1 && staticHost ? staticHost + apiPath : apiPath;
        this.ajax({
          url,
          dataType,
          success(res) {
            callback(res);
          },
          fail() {
            _getFilePath(cdnMapPath);
          }
        });
      };
      _getFilePath(mapPath);
    }


    loadVersionApi = (callback = noop) => {
      const { lsCache } = this.options;
      this.ajaxGet((res) => {
        try {
          const result = JSON.parse(res);
          this.results = {...result};
          // load maps for localstorage
          if (lsCache && result && result.data && result.data[0] && result.data[0].maps) {
            this.maps = result.data[0].maps;
            this.modules = [...this.maps.deps];
            this.urlPattern = this.maps.path;
            callback();
          } else {
            this.formatResult();
            if (this.urls.length) {
              this.saveFilePaths();
              callback();
            } else {
              throw new Error('No javascript files needed to load?');
            }
          }
        } catch (e) {
          throw new Error('Version api error.');
        }
      });
    }


    updateLoaderStatus(status = true) {
      root[`${this.options.cachePrefix}__STATUS__`] = status;
      this.loaderStatus = status;
    }


    saveMaps = () => {
      setLsItem(this.mapsKey, this.maps, this.dateStep());
    }

    getLsMaps = () => {
      const lsItem = getLsItem(this.mapsKey);
      if (lsItem && lsItem.data) {
        this.maps = lsItem.data.maps;
        this.modules = [...lsItem.data.deps];
        this.urlPattern = lsItem.data.path;
        this.mapsExpireTime = lsItem.expireTime;
      }
    }

    getLsModule = (name) => {
      const module = getLsData(this.modulePrefix + name);
      if (module) this.moduleOldCache[name] = module;
    }

    define = (module) => {
      this.runModule(module);
      this.moduleNewCache[module.hash] = module;
    }

    _define = (module) => {
      this.saveModule(module);
    }

    runModule = (module) => {
      const {
        name, chunkName, source, isCommonModule, isExecModule
      } = module;
      if (isCommonModule) {
        if (typeof source === 'string') {
          this.createTextNode(`(${source})()`);
        } else {
          source();
        }
      } else {
        const fnString = typeof source === 'string' ? `(${source})()` : source().toString();
        const chunkId = isExecModule ? `['${chunkName}']` : '[]';
        const webpackFnArr = [chunkId];
        webpackFnArr.push(`{'${name}': ${fnString}}`);
        if (isExecModule) webpackFnArr.push(`['${name}']`);
        const webpackModuleFn = `webpackJsonp(${webpackFnArr.join(',')})`;
        this.createTextNode(webpackModuleFn);
      }
    }


    // 加载单个模块
    loadModule = (name, callback) => {
      const { urlPattern } = this;
      this.getLsModule(name);
      const module = this.moduleOldCache[name];
      if (module) {
        this.runModule(module);
        callback();
      } else {
        const url = `${urlPattern + name}.js`;
        this.loadScripts([url], callback);
      }
    }

    loadModules = (callback = noop, modules = this.modules) => {
      // 首次加载启用combo
      if (this.isComboLoader) {
        forEach(this.modules, (module) => {
          this.urls.push(`${module}.js`);
        });
        const urls = [];
        const {maxUrlLength, comboPattern} = this.options;
        const comboUrlPrefix = comboPattern.replace('$1', this.urlPattern);
        const maxIndex = Math.floor((maxUrlLength - comboUrlPrefix.length) / (this.modules[0].length + 3));
        const count = Math.ceil(this.modules.length / maxIndex);
        let i = 0;
        while (i < count) {
          const tempArr = this.urls.slice(maxIndex * i, maxIndex * (i + 1));
          urls.push(comboUrlPrefix.replace('$2', tempArr.join(';')));
          i += 1;
        }
        this.loadScripts(urls, callback);
      } else {
        // 递归加载所有模块
        const _loadModules = () => {
          const moduleName = modules.shift();

          this.loadModule(moduleName, () => {
            if (modules.length) {
              _loadModules();
            } else {
              callback();
            }
          });
        };
        _loadModules();
      }
    }

    // 模块预加载到localStorage，下一次启动时使用
    preloadModules = (callback = noop) => {
      const modules = [];
      this.loadVersionApi(() => {
        const _lsData = getLsData(this.mapsKey);
        this._maps = _lsData.maps;
        this._modules = [..._lsData.deps];
        forEach(this.modules, (module) => {
          if (this._modules.indexOf(module) === -1) {
            modules.push(module);
          }
        });
        if (modules.length) {
          root.sdkLoader.define = this._define;
          this.loadModules(() => {
            root.sdkLoader.define = this.define;
            callback();
          }, modules);
        } else {
          this.preloading = false;
          callback();
        }
      });
    }

    saveModule = (module) => {
      const prefix = this.modulePrefix;
      module.source = module.source.toString();
      setLsItem(prefix + module.hash, module);
    }

    // 保存全部模块到ls
    saveModules = () => {
      const modules = this.moduleNewCache;
      forEach(modules, (val, key) => {
        if (!this.moduleOldCache[key]) {
          this.saveModule(val);
        }
      });
    }

    // 清理ls中已经被淘汰的模块，避免ls容量溢出
    cleanModules = () => {
      const prefix = this.modulePrefix;
      forEach(localStorage, (val, key) => {
        if (key.indexOf(prefix) !== -1) {
          const hashName = key.replace(prefix, '');
          if (this.modules.indexOf(hashName) === -1) {
            removeLsItem(key);
          }
        }
      });
    }

    // run this class
    run = callback => {
      const timeNow = new Date().getTime();
      const { options } = this;
      const { lsCache } = options;
      // 启动localstorage缓存模块
      if (lsCache) {
        this.getLsMaps();
        if (this.modules.length) {
          this.loadModules(() => {
            if (this.mapsExpireTime && this.mapsExpireTime <= timeNow) {
              this.preloadModules(this.doCallback);
            } else {
              this.doCallback();
            }
          });
        } else {
          this.isComboLoader = root.location.protocol === 'http:';
          this.loadVersionApi(() => {
            this.loadModules(this.doCallback);
          });
        }
      } else {
        if (this.loaderStatus && !options.canReload) {
          this.doCallback();
          return;
        }
        this.updateLoaderStatus();
        const paths = this.getLsUrls();
        if (paths && !options.async) {
          this.urls = paths.data;
          this.loadScripts(this.urls, () => {
            if (paths.expireTime <= timeNow) {
              this.loadVersionApi(this.doCallback);
            } else {
              this.doCallback();
            }
          });
        } else {
          this.loadVersionApi(() => {
            this.loadScripts(this.urls, this.doCallback);
          });
        }
      }
    }

    // 总的回调
    doCallback = () => {
      const { lsCache } = this.options;
      if (lsCache) {
        setTimeout(() => {
          this.saveMaps();
          this.saveModules();
          this.cleanModules();
        }, 50);
      }
      this.options.callback(this);
    }
  }

  root.sdkLoader = (opts = {}, callback = noop, error = noop) => {
    if (!opts.mapPath) {
      throw new Error('Failed to setting "mapPath"...');
    }
    if (opts.cachePrefix) {
      opts.cachePrefix = `${root.location.hostname}_${opts.cachePrefix}`;
    } else {
      opts.cachePrefix = `${root.location.hostname}_${opts.mapPath.split('?').shift().split('/').pop()}`;
    }
    opts.callback = callback;
    opts.error = error;
    const _Loader = new Loader(opts);
    root.sdkLoader.define = _Loader.define;
    _Loader.run();
  };
})(window, document);
