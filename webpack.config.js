const path = require('path');
// const webpack = require('webpack');

const curDir = __dirname;
module.exports = {
  entry: {
    'loader': './src/loader.js',
    'loader.v2': './src/loader.v2.js',
    'xiss.admin.loader': './src/xiss.admin.loader.js',
    'sdkloader': './src/sdkloader_demo.js',
  },
  output: {
    path: path.join(curDir, 'lib'),
    filename: '[name].js',
    crossOriginLoading: 'anonymous',
    sourceMapFilename: '[file].map',
    pathinfo: true
  },
  module: {
    rules: [{
      test: /src\/.+\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
      enforce: 'pre' // webpack2写法
    },
    {
      test: /src\/.+\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/
    }]
  },
  devtool: 'eval-source-map',
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //   }
    // })
  ],
  devServer: {
    host: '100.84.248.189',
    contentBase: './',
    port: 9090
  }
};
