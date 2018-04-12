'use strict';

const fs = require('fs');
const rlex = require('../lib/extra-readline');

/**
 * Configure action
 * @param {Object} config
 */
function configure(config) {
  let cfg = JSON.parse(fs.readFileSync(config.template, 'utf8'));

  if (fs.existsSync(config.path)) {
    cfg = Object.assign(cfg, require(config.path));
  }

  Object.keys(cfg).reduce((prev, prop) => {
    return prev.then(() => {
      return new Promise(resolve => {
        rlex.resume();
        const isObject = prop === 'accountMapping';
        const value = isObject ? JSON.stringify(cfg[prop]) : cfg[prop];

        rlex.question(`${prop} (${value}): `, answer => {
          if (answer) {
            cfg[prop] = isObject ? JSON.parse(answer) : answer;
          }

          rlex.pause();
          return resolve(cfg);
        });
      });
    })
  }, Promise.resolve()).then(res => {
    fs.writeFileSync(config.path, JSON.stringify(res, null, 2), 'utf8');

    console.log('Done!');
    process.exit(0);
  });
}

module.exports = configure;
