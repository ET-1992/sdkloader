const path = require('path');
const os = require('os');
// const webpack = require('webpack');

function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }

  return '127.0.0.1';
}

const curDir = __dirname;
module.exports = {
  entry: {
    'loader': './src/loader.js',
    'loader.v2': './src/loader.v2.js',
    'loader.v3': './src/loader.v3.js',
    'xiss.admin.loader': './src/xiss.admin.loader.js',
    'sdkloader': './src/sdkloader_demo.js'
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
    host: getIPAddress(),
    contentBase: './',
    port: 9090
  }
};
