const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      DEVMODE: JSON.stringify(false)
    }),
    new webpack.DefinePlugin({
      WEBSOCKET_HOST: JSON.stringify('chrishurt.us')
    }),
  ],
});
