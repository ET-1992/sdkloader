/* eslint no-console: */
/* eslint no-unused-expressions: */
/* eslint no-underscore-dangle: */

/**
 * [sdkloader for napi 版本]
 */
((root, doc) => {
  const { toString, hasOwnProperty } = Object.prototype;
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

  function isArray(o) {
    return toString.call(o) === '[object Array]';
  }

  function isObject(o) {
    return toString.call(o) === '[object Object]';
  }

  function objectValuesAsArray(obj) {
    const arr = [];
    for (const key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        arr.push(obj[key]);
      }
    }
    return arr;
  }

  class Loader {
    constructor(opts) {
      this.loaderPath = `${opts.cacheSuffix}__LOADER_PATH__`;
      this.loaderStatus = !!root[`${opts.cacheSuffix}__STATUS__`];
      this.options = {
        mapPath: '',
        staticHost: '',
        accuracy: 1, // 版本校验的精度，0:10秒级别，1:分钟级别，2:小时级别，3:天级别，4:周级别
        retryTimes: 2,
        async: false,
        canReload: true // 允许加载相同的sdk
      };
      Object.assign(this.options, opts);
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
      xhr.open('GET', `${options.url}${urlTag}${params}`, true);
      xhr.send(null);
    };
    formatParams = data => {
      const arr = [];
      for (const name in data) {
        if (hasOwnProperty.call(data, name)) {
          arr.push(`${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`);
        }
      }
      const ver = this.randomString();
      arr.push(`vsr=${ver}`);
      return arr.join('&');
    };
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
    };
    randomString = () => {
      const res = parseFloat(`0.${Math.floor(new Date().getTime() / 1000 / this.dateStep()) * 9999}`);
      const newtime =
        (res + 0.2)
          .toString(36)
          .substr(2)
          .split('')
          .reverse()
          .join('') +
        (res + 0.9)
          .toString(36)
          .substr(2)
          .split('')
          .reverse()
          .join('');
      return newtime;
    };

    insertAfter = (newElement, targetElement) => {
      const parent = targetElement.parentNode;
      if (parent.lastChild === targetElement) {
        parent.appendChild(newElement);
      } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
      }
    };

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
        script.id = url;
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
          } else {
            throw new Error(`${e.target.src} no found!`);
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
    };

    removeLoadedScript = name => {
      const script = doc.getElementById(name);
      if (script && script.remove) script.remove();
    };

    updateFilePath = callback => {
      const that = this;
      const { mapPath, staticHost } = that.options;
      const url = mapPath.indexOf('//') === -1 && staticHost ? staticHost + mapPath : mapPath;
      that.ajax({
        url,
        success: res => {
          if (res) {
            let urls = [];
            let result = JSON.parse(res);
            if (result.data) {
              result = isArray(result.data) ? result.data[0].file : result.data.file;
              if (isArray(result)) {
                urls = [...result];
              } else if (isObject(result)) {
                urls = objectValuesAsArray(result);
              }
            } else if (isObject(result)) {
              urls = objectValuesAsArray(result);
            }
            if (urls.length) {
              that.saveFilePaths(urls);
              callback && callback(urls);
            } else {
              throw new Error('No javascript files needed to load?');
            }
          }
        }
      });
    };


    updateLoaderStatus(status = true) {
      root[`${this.options.cacheSuffix}__STATUS__`] = status;
      this.loaderStatus = status;
    }

    run = callback => {
      const that = this;
      const { options } = that;

      if (this.loaderStatus && !options.canReload) {
        options.callback();
        return;
      }
      that.updateLoaderStatus();
      const timeNow = new Date().getTime();
      const paths = that.getFilePaths();
      if (paths && paths.data && !options.async) {
        that.loadScripts(paths.data, () => {
          if (paths.expireTime < timeNow) {
            that.updateFilePath(() => {
              options.callback();
            });
          } else {
            options.callback();
          }
        });
      } else {
        that.updateFilePath(urls => {
          that.loadScripts(urls, () => {
            options.callback();
          });
        });
      }
    };
  }

  root.sdkLoader = (opts = {}, callback = () => {}) => {
    if (!opts.mapPath) {
      throw new Error('Failed to setting "mapPath"...');
    }
    if (opts.cacheSuffix) {
      opts.cacheSuffix = `${root.location.hostname}_${opts.cacheSuffix}`;
    } else {
      opts.cacheSuffix = `${root.location.hostname}_${opts.mapPath.split('?').shift().split('/').pop()}`;
    }
    opts.callback = callback;
    new Loader(opts).run();
  };
})(window, document);
