const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        // options: {
        //   compilerOptions: {
        //       outDir: './dist'
        //   }
        // }
        options: {
          configFile: "webpack.tsconfig.json"
        }
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: { "path": false, "timers": false, "events": false, "buffer": false, "fs": false, "stream": false, "child_process": false }
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};