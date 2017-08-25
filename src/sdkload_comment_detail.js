import './loader';

if (window.location.host.indexOf('release') > -1) {
  window.sdkLoader({mapPath: '//image.uc.cn/s/uae/g/1y/comment-sdk/release/releaseCommentDetailSdkJson.json'});
} else {
  window.sdkLoader({mapPath: '//image.uc.cn/s/uae/g/1y/comment-sdk/prod/commentDetailSdkJson.json'});
}
