'use strict';

const Config = require('./config');

class Command {
  /**
   * @param options
   */
  constructor(options) {
    this.options = options;
    this.config = new Config();

    this.initialize();
  }

  /**
   * Initialization
   */
  initialize() {}

  /**
   * @return {Promise}
   */
  validate() {
    return Promise.resolve();
  }

  /**
   * @param {String} full
   * @param {String} short
   * @param {*} defaultVal
   * @return {*}
   */
  getOption(full, short, defaultVal) {
    return this.options[full] || this.options[short] || defaultVal;
  }

  /**
   * @param {String} path
   * @return {*}
   */
  getConfig(path = '') {
    return this.config.getConfig(path);
  }

  /**
   * @return {String}
   */
  getConfigPath() {
    return this.config.path;
  }

  /**
   * @param {Object} config
   * @return {Object}
   */
  updateConfig(config) {
    return this.config.saveConfig(config);
  }

  /**
   * @abstract
   * @return {Promise}
   */
  run() {
    return Promise.reject('`run()` is not implemented');
  }
}

module.exports = Command;
