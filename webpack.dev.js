const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: 'build'
  },
  plugins: [
    new webpack.DefinePlugin({
      DEVMODE: JSON.stringify(true)
    }),
    new webpack.DefinePlugin({
      WEBSOCKET_HOST: JSON.stringify('localhost')
    }),
  ],
});
