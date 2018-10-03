const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js'
  },
  devtool: 'source-map',
  devServer: {
    contentBase: 'build'
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: '**/*', to: '', context: 'src', ignore: [ '*.js' ] },
    ], {}), // Options
  ],
};
