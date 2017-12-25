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
    'loader.ls': './src/loader.ls.js',
    'loader.ls.demo': './src/loader.ls.demo.js'
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
  devtool: 'source-map',
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
