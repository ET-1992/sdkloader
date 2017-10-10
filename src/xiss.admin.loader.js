import './loader.v2';

function setOptions() {
  const { host } = window.location;
  const condition = host.indexOf(':') !== -1 || host.indexOf('test.uae.uc.cn') !== -1;
  const env = condition ? 'release' : 'master';
  const apiPath = '//napi.uc.cn/3/classes/sdk_loader_maps/indexes/maps/search';
  const apiQuery = [
    '_app_id=zdl',
    '_fetch=1',
    '_size=1',
    `_filters=channel:xiss.admin+AND+env:${env}`,
    '_sort=_updated_at:desc'
  ];
  return {
    mapPath: `${apiPath}?${apiQuery.join('&')}`,
    cacheSuffix: `xiss.admin.sdk.${env}`,
    staticHost: '//image.uc.cn/s/uae/g/1y/'
  };
}

window.sdkLoader(setOptions());
