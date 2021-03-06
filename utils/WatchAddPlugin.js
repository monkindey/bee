const chokidar = require('chokidar');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const { getFilename } = require('./');

class WatchAddPlugin {
  constructor(options) {
    options = options || {};
    this.context = options.context;
    this.path = options.path;
    this.assets = [];
    this.name = '';
    this.entry = '';
  }

  apply(compiler) {
    chokidar.watch(this.path, {}).on('all', (event, path) => {
      if (event === 'add') {
        const name = getFilename(path);
        // Beacuase initial phase `chokidar` will tigger 
        // `add` event and filter original file but additional file
        if (
          this.assets.length === 0 ||
          this.assets.some(asset => asset === name)
        ) {
          return;
        }

        // compiler.apply(new SingleEntryPlugin(this.context, path, name));
        this.name = name;
        this.entry = path;

        // This is critical
        compiler.watcher._go();
        // compiler.run((err, stats) => {
        //   console.log('running');
        // });
      }
    });

    compiler.plugin('watch-run', (watcher, callback) => {
      compiler.watcher = watcher;
      callback();
    });

    compiler.plugin('make', (compilation, callback) => {
      if (this.entry !== '') {
        const dep = SingleEntryPlugin.createDependency(this.entry, this.name);
        compilation.addEntry(this.context, dep, this.name, callback);
      } else {
        callback();
      }
    });

    compiler.plugin('emit', (compilation, callback) => {
      this.assets = Object.keys(compilation.assets).map(getFilename);
      if (this.entry !== '') {
        compilation.fileDependencies.push(this.entry);
      }
      callback();
    });

    compiler.plugin('after-compile', (compilation, callback) => {
      if (this.entry !== '') {
        compilation.fileDependencies.push(this.entry);
      }

      callback();
    });
  }
}

module.exports = WatchAddPlugin;
