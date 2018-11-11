'use strict';

const rlex = require('../src/extra-readline');
const Command = require('../src/command');

class ConfigureCommand extends Command {
  /**
   * @return {Promise}
   */
  run() {
    const config = this.getConfig();
    const options = ['profile', 'username', 'directoryDomain'];

    return options.reduce((prev, prop) => {
      return prev.then(() => {
        return rlex.promiseQuestion(`${prop} (${config[prop]}): `).then(answer => {
          if (answer) {
            config[prop] = answer;
          }

          return Promise.resolve(config);
        });
      });
    }, Promise.resolve()).then(updated => {
      this.updateConfig(updated);

      return Promise.resolve('Done!');
    });
  }
}

module.exports = ConfigureCommand;
