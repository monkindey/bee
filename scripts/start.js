'use strict';

const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const fse = require('fs-extra');

const dllConfig = require('../config/webpack.dll.config.js');
const paths = require('../config/paths');
const WatchAddPlugin = require('../utils/WatchAddPlugin');

const {
  port,
  filename,
  host,
  vendorPath,
  manifestName
} = require('../config/');

const entry = process.argv.slice(2);

process.on('unhandledRejection', err => {
  throw err;
});

async function createDevServer() {
  const config = await require('../config/webpack.config.js')({ entry });

  const compiler = webpack(config);
  const devServer = new WebpackDevServer(compiler, {
    setup(app) {
      // Customize your View Engine
      app.set('view engine', 'html');
      app.engine('html', require('ejs').renderFile);
      app.set('views', path.resolve(__dirname, '../fixture/'));

      // Add the index router
      app.get('/', (req, res) => {
        res.redirect('index');
      });

      // Add the router and gereator HTML for user
      // depend on the example name you send
      app.get('/:example', (req, res) => {
        let example = req.params.example;
        res.render('example', {
          filename: filename.replace(/\[(\w+)\]/, ($1, name) => example),
          name: example
        });
      });
    },
    // Enable gzip compression of generated files and will save 80% volume
    compress: true,
    contentBase: [paths.example, path.resolve(__dirname, '../fixture')],
    stats: {
      colors: true
    }
  });

  devServer.listen(port, host, () => {
    console.log(chalk.green(`The Webpack Dev Server at ${port}`));
  });

  return devServer;
}

fse.pathExists(path.resolve(vendorPath, manifestName)).then(isExist => {
  if (!isExist) {
    let dllCompiler = webpack(dllConfig);
    dllCompiler.run((err, stats) => {
      if (err) {
        throw err;
      }
      createDevServer();
    });
  } else {
    createDevServer();
  }
});
