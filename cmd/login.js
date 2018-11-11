'use strict';

const os = require('os');
const SSH = require('../src/ssh');
const Saml = require('../src/saml');
const rlex = require('../src/extra-readline');
const Command = require('../src/command');
const CredentialsParser = require('../src/credentials-parser');

class LoginCommand extends Command {
  /**
   * @return {Promise}
   */
  run() {
    const domain = this.getConfig('directoryDomain');
    const saml = new Saml(domain);
    const alias = this.getOption('alias', 'a', false);
    const username = this.getConfig('username');
    const credentials = alias ? this.getCredentials() : this.askCredentials();

    if (alias && alias.constructor === Boolean) {
      return Promise.reject('Alias is not valid');
    }

    return credentials
      .then(credentials => saml.getAvailableAccounts(credentials.username, credentials.password))
      .then(accounts => {
        if (!accounts.length) {
          return Promise.reject(`No accounts found for ${username}`);
        }

        return alias ? this.autoSelectAccount(accounts, alias) : this.selectAccount(accounts);
      })
      .then(selected => {
        this.signIn(selected);

        return Promise.resolve('Done!');
      });
  }

  /**
   * Get credentials from config
   * @return {Promise}
   */
  getCredentials() {
    const password = this.getConfig('password');
    const ssh = new SSH(this.getConfigPath());

    if (!password) {
      return Promise.reject('Please configure your password first (run: `aws-saml password`)');
    }

    return Promise.resolve({
      username: this.getConfig('username'),
      password: ssh.decrypt(password)
    });
  }

  /**
   * Ask user's credentials
   * @return {Promise}
   */
  askCredentials() {
    const username = this.getConfig('username');

    return rlex.promiseQuestion(`Username (${username}): `).then(login => {
      return rlex.promiseQuestion('Password: ', true).then(password => {
        return Promise.resolve({
          username: login || username,
          password: password
        });
      });
    });
  }

  /**
   * Select AWS account to login
   * @param {Array} accounts
   * @returns {Promise}
   */
  selectAccount(accounts) {
    const mapping = this.getConfig('aliases');
    const accountsList = accounts.map((account, index) => {
      let [, accountId] = account.Arn.match(/(\d+):role/);

      return `[ ${index + 1} ] ${account.Arn} (${mapping[accountId] || accountId})`;
    });

    console.log(accountsList.join(os.EOL));

    return rlex
      .promiseQuestion('Choose account to login: ')
      .then(selected => Promise.resolve(accounts[selected - 1]));
  }

  /**
   * Auto-select account by ID or alias
   * @param {Array} accounts
   * @param {String} alias
   * @return {Promise}
   */
  autoSelectAccount(accounts, alias) {
    const mapping = this.getConfig('aliases');
    const accountId = Object.keys(mapping).find(it => mapping[it] === alias) || alias;

    if (!/^[0-9]{12}$/.test(accountId)) {
      return Promise.reject(
        `'${accountId}' is neither valid account ID nor predefined alias (run 'aws-saml alias' to add)`
      );
    }

    return Promise.resolve(accounts.find(account => {
      const regExp = new RegExp(`${accountId}:role`);

      return regExp.test(account.Arn);
    }));
  }

  /**
   * Sign in method
   * @param {Object} account
   * @return {void}
   */
  signIn(account) {
    const parser = new CredentialsParser();
    const profile = this.getConfig('profile');
    const patch = {
      aws_access_key_id: account.AccessKeyId,
      aws_session_token: account.SessionToken,
      aws_secret_access_key: account.SecretAccessKey
    };

    parser
      .updateProfile(profile, patch)
      .persist();
  }
}

module.exports = LoginCommand;
