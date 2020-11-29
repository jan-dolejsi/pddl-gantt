const path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
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
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'pddlGantt',
    libraryTarget: 'var',
  },
  // externals: {
  //   'pddl-workspace': {
  //     commonjs: 'pddl-workspace',
  //     commonjs2: 'pddl-workspace',
  //     amd: 'pddl-workspace',
  //     root: 'pddlWorkspace',
  //     // root: 'index.js', // what is this for? for 'lodash' it is '_'
  //   }
  // },
};

module.exports = config;