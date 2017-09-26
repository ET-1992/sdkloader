import './loader';

function setMapPath() {
  const { host } = window.location;
  const condition = host.indexOf(':') !== -1 || host.indexOf('test.uae.uc.cn') !== -1;
  const env = condition ? 'release' : 'master';
  return `xiss.admin.${env}.json`;
}

window.sdkLoader({
  mapPath: setMapPath(),
  staticHost: '//image.uc.cn/s/uae/g/1y/xiss.admin/'
});
