import './loader.v2';

function setOptions() {
  const { host } = window.location;
  const env = host.indexOf('release.fe') > -1 ? 'release' : 'prod';
  const listId = `comment-sdk.commentdetailsdk.${env}`;
  const apiPath = `//napi.uc.cn/3/classes/sdk_loader_maps/lists/${listId}`;
  const apiQuery = [
    '_app_id=zdl',
    '_fetch=1',
    '_size=1'
  ];
  const protocol = window.location.protocol === 'https:' ? 'https://image.uc.cn' : 'http://image1.uc.cn';
  return {
    mapPath: `${apiPath}?${apiQuery.join('&')}`,
    cacheSuffix: listId,
    staticHost: `${protocol}/s/uae/g/1y/`
  };
}

window.sdkLoader(setOptions());
