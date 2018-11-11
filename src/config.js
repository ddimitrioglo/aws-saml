'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

class Config {
  /**
   * Constructor
   */
  constructor() {
    this.name = 'config.json';
    this.path = path.join(os.homedir(), '.aws-saml');
    this.file = path.join(this.path, this.name);
    this.config = this._getConfig();
  }

  /**
   * Default configuration
   * @return {Object}
   */
  static defaults() {
    return {
      profile: 'saml',
      username: 'john.doe',
      password: false,
      directoryDomain: 'https://directory.example.com',
      aliases: {}
    };
  }

  /**
   * Get current config
   * @return {Object}
   */
  _getConfig() {
    return fs.existsSync(this.file) ? require(this.file) : this.saveConfig(Config.defaults());
  }

  /**
   * Save config
   * @param {Object} config
   * @return {Object}
   */
  saveConfig(config) {
    if (!fs.existsSync(this.path)){
      fs.mkdirSync(this.path);
    }

    fs.writeFileSync(this.file, JSON.stringify(config, null, 2));

    return config;
  }

  /**
   * Get config by comma-separated path
   * @param {String} path
   * @return {*}
   */
  getConfig(path = '') {
    const parts = path.split('.').filter(Boolean);

    if (!parts.length) {
      return this.config;
    }

    return parts.reduce((result, part) => {
      if (!result || !result.hasOwnProperty(part)) {
        return null;
      }

      return result[part];
    }, this.config);
  }
}

module.exports = Config;
