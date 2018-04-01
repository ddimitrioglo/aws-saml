'use strict';

const url = require('url');
const sax = require('sax');
const request = require('request').defaults({ jar: true });

class Saml {
  /**
   * @param {String} idpUrl
   */
  constructor(idpUrl) {
    let idp = url.parse(idpUrl);

    this._parser = sax.parser(false, { lowercase: true });
    this._domain = `${idp.protocol}//${idp.host}`;
    this._entryPath = idp.path;
    this._samlResponse = null;
  }

  /**
   * Get login path (w/o domain)
   * @returns {Promise}
   */
  getLoginPath() {
    return new Promise((resolve, reject) => {
      let loginPath = '';
      let initUrl = url.resolve(this._domain, this._entryPath);

      request.get({ url: initUrl, rejectUnauthorized: false }, (err, res, body) => {
        if (err) {
          return reject(err);
        }

        this._parser.onopentag = node => {
          if (node.name === 'form' && node.attributes.id === 'loginForm') {
            loginPath = node.attributes.action;
          }
        };

        this._parser.onerror = err => reject(err);
        this._parser.onend = () => resolve(loginPath);
        this._parser.write(body).close();
      });
    });
  }

  /**
   * @param {String} loginPath
   * @param {String} username
   * @param {String} password
   * @returns {Promise}
   * @private
   */
  _login(loginPath, username, password) {
    return new Promise((resolve, reject) => {
      const options = {
        followAllRedirects: true,
        rejectUnauthorized: false,
        url: url.resolve(this._domain, loginPath),
        form: {
          UserName: `CORP\\${username}`,
          Password: password, Kmsi: true,
          AuthMethod: ''
        }
      };

      request.post(options, (err, res, body) => {
        if (err) {
          return reject(err);
        }

        let samlResponse = '';
        let errorText = '';

        this._parser.onopentag = node => {
          if (node.name === 'input' && node.attributes.name === 'SAMLResponse') {
            samlResponse = node.attributes.value;
          }

          if (node.attributes.id === 'errorText') {
            let dirtyError = body.substr(this._parser.position, 300);
            let matched = dirtyError.match(/^(.*)<\//);
            errorText = matched ? matched[1] : dirtyError;
          }
        };

        this._parser.onerror = err => reject(err);
        this._parser.onend = () => {
          if (errorText) {
            return reject(new Error(errorText));
          }

          resolve(samlResponse);
        };
        this._parser.write(body).close();
      });
    });
  }

  /**
   * Get login SAML Response as base64 string
   * @param {String} loginPath
   * @param {String} username
   * @param {String} password
   * @returns {Promise}
   */
  getSamlResponse(loginPath, username, password) {
    if (this._samlResponse) {
      return Promise.resolve(this._samlResponse);
    }

    return this._login(loginPath, username, password).then(samlResponse => {
      this._samlResponse = samlResponse;

      return samlResponse;
    });
  }

  /**
   * Parse SAML Response
   * @param {String} samlResponse
   * @returns {String}
   */
  static parseSamlResponse(samlResponse) {
    return Buffer.from(samlResponse, 'base64').toString('utf8');
  }
}

module.exports = Saml;
