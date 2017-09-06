import './loader';

const STATIC_HOST = '//image.uc.cn/s/uae/g/1y';
window.sdkLoader({mapPath: `${STATIC_HOST}/libs/iflowsdk.json`});

// window.sdkLoader({
//   mapPath: '//image.uc.cn/s/uae/g/1y/xiss.article.sdk/xiss.article.sdk.clb.release.json'
// }, () => {
//   console.log('xiss.article.sdk loaded');
//   window.sdkLoader({
//     mapPath: '//image.uc.cn/s/uae/g/3l/clbmobile-comment-static/clbmobile-comment.release.json'
//   }, () => {
//     console.log('clbmobile-comment loaded');
//   });
// });
