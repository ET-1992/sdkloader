import './loader';

if (window.location.host.indexOf('release') > -1) {
  window.sdkLoader({mapPath: '//image.uc.cn/s/uae/g/1y/ucCommentSdk/releaseCommentDetailSdkJson.json'});
} else {
  window.sdkLoader({mapPath: '//image.uc.cn/s/uae/g/1y/ucCommentSdk/commentDetailSdkJson.json'});
}
