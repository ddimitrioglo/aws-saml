'use strict';

const SSH = require('../src/ssh');
const rlex = require('../src/extra-readline');
const Command = require('../src/command');

class PasswordCommand extends Command {
  /**
   * @return {Promise}
   */
  run() {
    const config = this.getConfig();
    const isDelete = this.getOption('delete', 'd', false);
    const configPath = this.getConfigPath();

    if (isDelete) {
      config.password = false;
      this.updateConfig(config);

      return Promise.resolve('Done!');
    }

    return rlex.promiseQuestion('Password (will be encoded): ', true).then(answer => {
      if (answer) {
        const ssh = new SSH(configPath);
        config.password = ssh.encrypt(answer);
      }

      return Promise.resolve();
    }).then(() => {
      this.updateConfig(config);

      return Promise.resolve('Done!');
    });
  }
}

module.exports = PasswordCommand;
