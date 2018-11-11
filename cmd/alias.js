'use strict';

const rlex = require('../src/extra-readline');
const Command = require('../src/command');

class AliasCommand extends Command {
  /**
   * @return {Promise}
   */
  run() {
    const config = this.getConfig();
    const aliases = this.getConfig('aliases');
    const isDelete = this.getOption('delete', 'd', false);
    const accountId = this.getOption('account', 'a', false);

    if (!accountId || accountId.constructor === Boolean) {
      return Promise.reject('Account ID is required');
    }

    if (isDelete) {
      delete aliases[accountId];
      this.updateConfig(config);

      return Promise.resolve('Done!');
    }

    return rlex.promiseQuestion(`Alias for account ${accountId} (${aliases[accountId] || accountId}): `).then(answer => {
      if (answer) {
        aliases[accountId] = answer;
      }

      return Promise.resolve();
    }).then(() => {
      this.updateConfig(config);

      return Promise.resolve('Done!');
    });
  }
}

module.exports = AliasCommand;
