import './loader.v2';

window.setCommentEnv = (obj) => {
  const defaultObj = {
    https: false,
    staticHost: 'image.uc.cn'
  };
  const params = Object.assign(defaultObj, obj);
  const whichProtocal = params.https ? 'https:' : '';
  const listId = `${params.pkgname}.${params.env}`;
  const apiPath = `${whichProtocal}//napi.uc.cn/3/classes/sdk_loader_maps/lists/${listId}`;
  let host = window.STATIC_HOST_PREFIX ?
    `${whichProtocal}${window.STATIC_HOST_PREFIX}` : `${whichProtocal}//${params.staticHost}/s/uae/g/1y/`;
  const apiQuery = [
    '_app_id=zdl',
    '_fetch=1',
    '_size=1'
  ];
  if (window.location.host.indexOf('local.uczzd.cn') > -1) {
    host = `${whichProtocal}//${params.staticHost}/s/uae/g/1y/`;
  }
  return {
    mapPath: `${apiPath}?${apiQuery.join('&')}`,
    cacheSuffix: listId,
    staticHost: host
  };
};

// env为2中情况：release（测试环境)或者prod(线上环境)
// pkgname为napi的pkname
// window.sdkLoader(window.setCommentEnv(env, pkgname));
