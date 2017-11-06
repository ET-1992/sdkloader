import './loader.v2';

function setOptions() {
  const { host } = window.location;
  const env = host.indexOf('release.fe') > -1 ? 'release' : 'prod';
  const listId = `comment-sdk.commentdetailsdk.${env}`;
  const apiPath = `https://napi.uc.cn/3/classes/sdk_loader_maps/lists/${listId}`;
  const apiQuery = [
    '_app_id=zdl',
    '_fetch=1',
    '_size=1'
  ];
  return {
    mapPath: `${apiPath}?${apiQuery.join('&')}`,
    cacheSuffix: listId,
    staticHost: 'https://image.uc.cn/s/uae/g/1y/'
  };
}

window.sdkLoader(setOptions());
