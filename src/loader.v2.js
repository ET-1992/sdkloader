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
  function getLocalStorageItem(key) {
    let val = null;
    const cacheData = root.localStorage.getItem(key);
    if (cacheData) {
      val = JSON.parse(cacheData);
    }
    return val;
  }

  /**
   * [设置localstorage的值]
   * @param {string} key          [localstorage的key]
   * @param {*} data         [localstorage的value]
   * @param {number} expireSecond [多少秒后过期]
   */
  function setLocalStorageItem(key, data, expireSecond) {
    const nowTime = new Date().getTime();
    const expireTime = expireSecond ? nowTime + expireSecond * 1000 : ''; // eslint-disable-line
    const value = { data };
    if (expireTime) value.expireTime = expireTime;
    root.localStorage.setItem(key, JSON.stringify(value));
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
  function objectValueToArray(obj) {
    const arr = [];
    forEach(obj, (val) => arr.push(val));
    return arr;
  }

  class Loader {
    constructor(opts) {
      this.loaderPath = `${opts.cacheSuffix}__LOADER_PATH__`;
      this.loaderStatus = !!root[`${opts.cacheSuffix}__STATUS__`];
      this.results = {};
      this.options = Object.assign({
        mapPath: '',
        cndMapPath: '',
        staticHost: '',
        accuracy: 1, // 版本校验的精度，0:10秒级别，1:分钟级别，2:小时级别，3:天级别，4:周级别
        retryTimes: 2,
        async: false,
        lsCache: false,
        canReload: true // 允许加载相同的sdk
      }, opts);
    }
    getFilePaths() {
      const cacheData = getLocalStorageItem(this.loaderPath);
      return cacheData;
    }
    saveFilePaths(val) {
      setLocalStorageItem(this.loaderPath, val, this.dateStep());
    }
    removeFilePaths() {
      localStorage.removeItem(this.loaderPath);
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
    };
    formatParams = data => {
      const arr = [];
      forEach(data, (val, key) => arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`));
      arr.push(`vsr=${this.randomString()}`);
      return arr.join('&');
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

    randomString = () => {
      const res = parseFloat(`0.${Math.floor(new Date().getTime() / 1000 / this.dateStep()) * 9999}`);
      return (res + 0.2).toString(36)
        .substr(2)
        .split('')
        .reverse()
        .join('');
    }

    insertAfter = (newElement, targetElement) => {
      const parent = targetElement.parentNode;
      if (parent.lastChild === targetElement) {
        parent.appendChild(newElement);
      } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
      }
    }

    /**
     * 动态插入js文件
     *
     * @param urls Array
     * @param callback
     */
    loadScripts = (urls, callback) => {
      const that = this;
      const { options } = that;
      let count = 0;
      const _loadScript = (url = urls[count]) => {
        that.removeLoadedScript(url);
        const { head } = doc;
        const script = doc.createElement('script');
        const src = url.indexOf('//') === -1 && options.staticHost ? options.staticHost + url : url;
        script.id = url.split('/').pop();
        script.async = false;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = src;
        that.insertAfter(script, head.lastChild);
        script.addEventListener('error', e => {
          // console.log(e);
          that.removeFilePaths();
          if (options.retryTimes > 0) {
            that.updateLoaderStatus(false);
            that.run();
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

    formatResult = (res) => {
      let urls = [];
      if (res) {
        let result = JSON.parse(res);
        this.results = result;
        if (result.data) {
          result = isArray(result.data) ? result.data[0].file : result.data.file;
          if (isArray(result)) {
            urls = result;
          } else if (isObject(result)) {
            urls = objectValueToArray(result);
          }
        } else if (isObject(result)) {
          urls = objectValueToArray(result);
        }
      }
      return urls;
    }

    updateFilePath = (callback = noop, fail = noop) => {
      const that = this;
      const { mapPath, cdnMapPath, staticHost } = that.options;
      let hasLoadError = false;
      const _getFilePath = (apiPath = mapPath) => {
        if (hasLoadError) return;
        if (apiPath === cdnMapPath) hasLoadError = true;
        const url = apiPath.indexOf('//') === -1 && staticHost ? staticHost + apiPath : apiPath;
        that.ajax({
          url,
          success(res) {
            const urls = that.formatResult(res);
            if (urls.length) {
              // that.saveFilePaths(urls);
              callback(urls);
            } else {
              throw new Error('No javascript files needed to load?');
            }
          },
          fail() {
            cdnMapPath && _getFilePath(cdnMapPath);
          }
        });
      };
      _getFilePath(mapPath);
    }

    updateLoaderStatus = (status = true) => {
      root[`${this.options.cacheSuffix}__STATUS__`] = status;
      this.loaderStatus = status;
    }

    doCallback = () => {
      const that = this;
      const { options } = that;
      const res = Object.assign({}, {
        res: this.results
      });
      options.callback(res);
    }

    run = callback => {
      const that = this;
      const { options } = that;

      if (this.loaderStatus && !options.canReload) {
        that.doCallback();
        return;
      }
      that.updateLoaderStatus();
      const timeNow = new Date().getTime();
      const paths = that.getFilePaths();
      if (paths && paths.data && !options.async) {
        that.loadScripts(paths.data, () => {
          if (paths.expireTime < timeNow) {
            that.updateFilePath((urls) => {
              that.saveFilePaths(urls);
              that.doCallback();
            });
          } else {
            that.doCallback();
          }
        });
      } else {
        that.updateFilePath(urls => {
          that.loadScripts(urls, () => {
            that.saveFilePaths(urls);
            that.doCallback();
          });
        });
      }
    };
  }

  root.sdkLoader = (opts = {}, callback = noop, error = noop) => {
    if (!opts.mapPath) {
      throw new Error('Failed to setting "mapPath"...');
    }
    if (opts.cacheSuffix) {
      opts.cacheSuffix = `${root.location.hostname}_${opts.cacheSuffix}`;
    } else {
      opts.cacheSuffix = `${root.location.hostname}_${opts.mapPath.split('?').shift().split('/').pop()}`;
    }
    opts.callback = callback;
    opts.error = error;
    new Loader(opts).run();
  };
})(window, document);
