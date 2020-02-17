const { resolve } = require('path');
const webpack = require('webpack');

process.env.NODE_ENV = 'production';

const compiler = webpack(require(resolve('webpack.config.js')));

console.log('Building Project...');
compiler.run((err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
    process.exit(1);
  }

  console.log(stats.toString({
    colors: true,
  }));

  console.log('Finished building project');
});
