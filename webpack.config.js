const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
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
