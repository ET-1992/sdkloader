import './loader.v2';

window.setCommentEnv = (env, pkgName = 'comment-sdk.commentsdk') => {
  const listId = `${pkgName}.${env}`;
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
};

// env为2中情况：release（测试环境)或者prod(线上环境)
// pkgName为napi的pkname
// window.sdkLoader(window.setCommentEnv(env, pkgName));
