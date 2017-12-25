const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

function getPlugins() {
  return [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        comparisons: false
      },
      output: {
        comments: false,
        ascii_only: true
      },
      sourceMap: false
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ];
}

webpackConfig.entry =  {
  'loader': './src/loader.js',
  'loader.v2': './src/loader.v2.js',
  'loader.ls': './src/loader.ls.js',
  'loader.ls.demo': './src/loader.ls.demo.js'
}

webpackConfig.output.filename = '[name].min.js';
webpackConfig.plugins = webpackConfig.plugins.concat(getPlugins());
webpackConfig.devtool = false;
delete webpackConfig.devServer


module.exports = webpackConfig;
