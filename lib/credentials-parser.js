'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

class CredentialsParser {
  /**
   * @param {String} credsPath
   */
  constructor(credsPath = path.join(os.homedir(), '.aws/credentials')) {
    this._path = credsPath;
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
    let credentials = fs.readFileSync(this._path, 'utf8');

    credentials.split('\n').filter(Boolean).forEach(line => {
      let found = line.match(/^\[\s?(\S*)\s?]$/);

      if (found && found.length) {
        profile = found[1];
        result[profile] = {};
      } else {
        let [property, value] = line.split(/=[^$]/).map(x => x.trim());
        result[profile][property] = value;
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
      Object.keys(this._profiles).map(profile => this.getProfile(profile)).join('\n\n')
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

    return result.join('\n');
  }

  /**
   * Update given frofile credentials
   * @param {String} name
   * @param {Object} patch
   * @returns {CredentialsParser}
   */
  updateProfile(name, patch) {
    if (!this._profiles[name]) {
      throw new Error(`Cannot find AWS CLI profile: ${name}`);
    }

    this._profiles[name] = Object.assign(this._profiles[name], patch);

    return this;
  }
}

module.exports = CredentialsParser;
