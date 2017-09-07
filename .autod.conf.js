module.exports = {
  write: true,
  prefix: '~',
  devprefix: '^',
  exclude: [
    './lib',
    './webpack.config.js',
    './webpack.publish.js'
  ],
  dep: [

  ],
  devdep: [
    'autod',
    'babel-eslint',
    // 'babel-plugin-transform-async-to-generator',
    'babel-plugin-transform-decorators-legacy',
    'babel-plugin-transform-es2015-destructuring',
    'babel-plugin-transform-es2015-for-of',
    // 'babel-plugin-transform-es2015-modules-commonjs',
    'babel-plugin-transform-es2015-parameters',
    'babel-plugin-transform-es2015-spread',
    'babel-plugin-transform-es2015-arrow-functions',
    'babel-plugin-transform-object-assign',
    'babel-preset-es2015',
    'babel-preset-stage-1',
    'eslint',
    'eslint-config-airbnb-base',
    'eslint-plugin-import',
    'babel-loader',
    'eslint-loader',
    'webpack',
    'webpack-dev-server'
  ]
};
