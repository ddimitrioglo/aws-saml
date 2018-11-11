'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * @info:
 *  AWS_CREDENTIAL_PROFILES_FILE environment variable to the location of your AWS credentials file
 *  AWS_SHARED_CREDENTIALS_FILE – Change the location of the file that the AWS CLI uses to store access keys
 *  AWS_CONFIG_FILE – Change the location of the file that the AWS CLI uses to store configuration profiles
 */
class CredentialsParser {
  /**
   * Constructor
   */
  constructor() {
    this._path = process.env.AWS_CREDENTIAL_PROFILES_FILE || path.join(os.homedir(), '.aws', 'credentials');
    this._profiles = this._parse();
  }

  /**
   * Parse aws cli credentials
   * @returns {Object}
   * @private
   */
  _parse() {
    let result = {};
    let profile = false;
    let credentials = fs.existsSync(this._path) ? fs.readFileSync(this._path, 'utf8') : '';

    credentials.split(os.EOL).filter(Boolean).forEach(line => {
      let found = line.match(/^\[\s?(\S*)\s?]$/);

      if (found && found.length) {
        profile = found[1];
        result[profile] = {};
      } else {
        let [property, ...value] = line.split('=').map(x => x.trim());
        result[profile][property] = value.join('=');
      }
    });

    return result;
  }

  /**
   * Update aws cli credentials
   */
  persist() {
    fs.writeFileSync(
      this._path,
      Object.keys(this._profiles).map(profile => this.getProfile(profile)).join(os.EOL + os.EOL)
    );
  }

  /**
   * Get profile block as string
   * @param {String} name
   * @returns {String}
   */
  getProfile(name) {
    let result = [`[${name}]`];
    let profile = this._profiles[name];

    Object.keys(profile).forEach(property => {
      result.push(`${property} = ${profile[property]}`)
    });

    return result.join(os.EOL);
  }

  /**
   * Update given frofile credentials
   * @param {String} name
   * @param {Object} patch
   * @returns {CredentialsParser}
   */
  updateProfile(name, patch) {
    if (!this._profiles[name]) {
      this._profiles[name] = {};
    }

    this._profiles[name] = Object.assign(this._profiles[name], patch);

    return this;
  }
}

module.exports = CredentialsParser;
