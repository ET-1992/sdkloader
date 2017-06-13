/* eslint no-console: 0*/
/* eslint no-unused-expressions: 0*/
/* eslint no-underscore-dangle: 0*/
((root, doc) => {
  class Loader {
    constructor(opts) {
      this.options = {
        cacheKey: `${root.location.hostname}__LOADER_PATH__`,
        mapPath: '',
        mapKeys: null,
        accuracy: 1, // sdk更新的精度，0:秒级别，1:分钟级别，2: 小时级别，3, 天级别，4：月级别
        async: false,
        retryTimes: 2
      };
      Object.assign(this.options, opts);
    }
    getFilePaths() {
      return getLocalStorageItem(this.options.cacheKey);
    }
    saveFilePaths(val) {
      setLocalStorageItem(this.options.cacheKey, val);
    }
    removeFilePaths() {
      localStorage.removeItem(this.options.cacheKey);
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
      arr.push((`v=${this.dateStep()}`).replace('.', ''));
      return arr.join('&');
    }

    dateStep = () => {
      const timeArr = new Date().toLocaleString().replace(/:| /g, '-').split('-');
      const length = timeArr.length;
      return timeArr.slice(0, length - Math.min(4, this.options.accuracy)).join('');
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
        const head = doc.head;
        const script = doc.createElement('script');
        script.async = false;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = url;
        that.insertAfter(script, head.lastChild);
        script.addEventListener('error', (e) => {
          that.removeFilePaths();
          if (this.options.retryTimes > 0) {
            that.run();
            this.options.retryTimes += -1;
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
    run = () => {
      const that = this;
      const options = that.options;
      const async = options.async;
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
    // throw new Error('Failed to setting "mapPath"...');
    if (!opts.mapPath) {
      throw new Error('Failed to setting "mapPath"...');
    } else {
      opts.callback = callback;
      new Loader(opts).run();
    }
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
