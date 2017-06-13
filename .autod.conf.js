module.exports = {
  write: true,
  prefix: '~',
  devprefix: '^',
  exclude: [
    'lib',
  ],
  dep: [
    'babel-core',
    'babel-loader',
    'eslint-loader'
  ],
  devdep: [
    'autod',
    'babel-eslint',
    'babel-plugin-transform-async-to-generator',
    'babel-plugin-transform-decorators-legacy',
    'babel-plugin-transform-es2015-destructuring',
    'babel-plugin-transform-es2015-for-of',
    'babel-plugin-transform-es2015-modules-commonjs',
    'babel-plugin-transform-es2015-parameters',
    'babel-plugin-transform-es2015-spread',
    'babel-plugin-transform-es2015-arrow-functions',
    'babel-plugin-transform-object-assign',
    'babel-preset-es2015',
    'babel-preset-stage-1',
    // 'babel-register',
    'eslint',
    'eslint-config-airbnb',
    'eslint-plugin-import'
  ]
};
