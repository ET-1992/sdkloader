import './loader.ls';

function setOptions() {
  const { host } = window.location;
  const condition = host.indexOf(':') !== -1 || host.indexOf('test.uae.uc.cn') !== -1;
  const env = condition ? 'release' : 'master';
  const packageName = 'jssdk-dev-demo';
  const listId = `index_1.${env}`;
  const apiPath = `//napi.uc.cn/3/classes/${packageName}/lists/${listId}`;
  const domain = '//image.uc.cn';
  const apiQuery = [
    '_app_id=8c7ac8cb18b54a138b832adc5e626a0c',
    '_fetch=1',
    '_size=2'
  ];
  return {
    mapPath: `${apiPath}?${apiQuery.join('&')}`,
    cdnMapPath: `${packageName}/index.release.json`,
    cacheSuffix: listId,
    staticHost: `${domain}/s/uae/g/1y/`,
    lsCache: true,
    accuracy: 0,
    comboPattern: `${domain}/e/uaeext/m;1y/$1;$2`
  };
}
window.sdkLoader(setOptions(), (res) => {
  // console.log(res);
});
