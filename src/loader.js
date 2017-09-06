/* eslint no-console: */
/* eslint no-unused-expressions: */
/* eslint no-underscore-dangle: */
((root, doc) => {
  class Loader {
    constructor(opts) {
      this.loaderPath = `${opts.cacheSuffix}__LOADER_PATH__`;
      this.loaderStatus = !!root[`${opts.cacheSuffix}__STATUS__`];
      this.options = {
        mapPath: '',
        // mapKeys: null,
        accuracy: 1, // 版本校验的精度，0:10秒级别，1:分钟级别，2:小时级别，3:天级别，4:周级别
        retryTimes: 2,
        async: false,
        canReload: true // 允许加载相同的sdk
      };
      Object.assign(this.options, opts);
    }
    getFilePaths() {
      return getLocalStorageItem(this.loaderPath);
    }
    saveFilePaths(val) {
      setLocalStorageItem(this.loaderPath, val);
    }
    removeFilePaths() {
      localStorage.removeItem(this.loaderPath);
    }
    ajax = (opts) => {
      const options = opts || {};
      options.dataType = options.dataType || 'json';
      const params = this.formatParams(options.data);
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const status = xhr.status;
          if (status >= 200 && status < 300 && options.success) {
            options.success(xhr.responseText, xhr.responseXML);
          } else if (options.fail) {
            options.fail(status);
          }
        }
      };
      xhr.open('GET', `${options.url}?${params}`, true);
      xhr.send(null);
    }
    formatParams = (data) => {
      const arr = [];
      for (const name in data) {
        if ({}.hasOwnProperty.call(data, name)) {
          arr.push(`${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`);
        }
      }
      const ver = this.dateStep();
      arr.push((`v=${ver}`));
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
      return Math.floor(Date.parse(new Date()) / 1000 / step);
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
      let count = 0;
      const _loadScript = (url = urls[count]) => {
        that.removeLoadedScript(url);
        const head = doc.head;
        const script = doc.createElement('script');
        script.id = url;
        script.async = false;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = url;
        that.insertAfter(script, head.lastChild);
        script.addEventListener('error', (e) => {
          that.removeFilePaths();
          if (that.options.retryTimes > 0) {
            that.updateLoaderStatus(false);
            that.run();
            that.options.retryTimes += -1;
          } else {
            throw new Error(`${e.target.src} no found!`);
          }
        });
        script.addEventListener('load', () => {
          const _url = urls[count += 1];
          if (_url) {
            _loadScript(_url);
          } else {
            callback && callback();
          }
        }, false);
      };
      _loadScript();
    }

    removeLoadedScript = (name) => {
      const script = document.getElementById(name);
      if (script && script.remove) script.remove();
    }

    updateFilePath = (callback) => {
      const that = this;
      const mapPath = that.options.mapPath;
      that.ajax({
        url: mapPath,
        success: (res) => {
          const data = JSON.parse(res);
          let urls = [];
          if (isArray(data)) {
            urls = [...data];
          } else if (isObject(data)) {
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                urls.push(data[key]);
              }
            }
          }
          if (urls.length) {
            that.saveFilePaths(urls);
            callback && callback(urls);
          } else {
            throw new Error('No javascript files needed to load?');
          }
        }
      });
    }

    updateLoaderStatus(status = true) {
      root[`${this.options.cacheSuffix}__STATUS__`] = status;
      this.loaderStatus = status;
    }

    run = (callback) => {
      const that = this;
      const options = that.options;
      const async = options.async;

      if (this.loaderStatus && !options.canReload) {
        options.callback();
        return;
      }
      that.updateLoaderStatus();
      const oldUrls = that.getFilePaths();
      if (!async && oldUrls) {
        that.loadScripts(oldUrls, () => {
          that.updateFilePath(() => {
            options.callback();
          });
        });
      } else {
        that.updateFilePath((urls) => {
          that.loadScripts(urls, () => {
            options.callback();
          });
        });
      }
    }
  }


  root.sdkLoader = (opts = {}, callback = () => {}) => {
    if (!opts.mapPath) {
      throw new Error('Failed to setting "mapPath"...');
    }
    if (opts.cacheSuffix) {
      opts.cacheSuffix = `${root.location.hostname}_${opts.cacheSuffix}`;
    } else {
      opts.cacheSuffix = `${root.location.hostname}_${opts.mapPath.split('/').pop()}`;
    }
    opts.callback = callback;
    new Loader(opts).run();
  };

  /**
   * [读取localstorage的值]
   * @param  {string} key [localstorage的key]
   * @return {*}     [返回localstorage的value]
   */
  function getLocalStorageItem(key) {
    let cacheData = root.localStorage.getItem(key);
    if (cacheData) {
      cacheData = JSON.parse(cacheData);
      return cacheData.data;
    }
    return null;
  }

  /**
   * [设置localstorage的值]
   * @param {string} key          [localstorage的key]
   * @param {*} data         [localstorage的value]
   */
  function setLocalStorageItem(key, data) {
    const updateTime = Date.now();
    const value = {updateTime, data};
    root.localStorage.setItem(key, JSON.stringify(value));
  }

  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }

  function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
  }
})(window, document);
