import './loader.v2';

{
  function setOptions() {
    const { host } = window.location;
    const condition = host.indexOf(':') !== -1 || host.indexOf('test.uae.uc.cn') !== -1;
    const env = condition ? 'release' : 'master';
    const listId = `xiss.article.sdk.clb.${env}`;
    const apiPath = `//napi.uc.cn/3/classes/sdk_loader_maps/lists/${listId}`;
    const apiQuery = [
      '_app_id=zdl',
      '_fetch=1',
      '_size=1'
    ];
    return {
      mapPath: `${apiPath}?${apiQuery.join('&')}`,
      cacheSuffix: listId,
      staticHost: '//image.uc.cn/s/uae/g/1y/'
    };
  }
  window.sdkLoader(setOptions());
}
