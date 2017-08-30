const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

function getPlugins() {
  return [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      comments: false,
      beautify: false,
      sourceMap: false
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ];
}
webpackConfig.output.filename = '[name].min.js';
webpackConfig.plugins = webpackConfig.plugins.concat(getPlugins());
webpackConfig.devtool = 'nosources-source-map';
delete webpackConfig.devServer


module.exports = webpackConfig;
