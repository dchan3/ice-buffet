var path = require('path');

module.exports = [{
  target: "web",
  entry: {
    "data-load": './src/data-load/index.js',
    "map-load": './src/map-load/index.js'
  },
  output: {
    path: path.resolve(__dirname),
    filename: '[name].js'
  },
  mode: "development",
  module: {
    rules: [{
      exclude: /node_modules/
    }]
  }
}];
