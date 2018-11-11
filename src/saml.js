'use strict';

const url = require('url');
const sax = require('sax');
const AWS = require('aws-sdk');
const request = require('request').defaults({ jar: true });

class Saml {
  /**
   * @param {String} idpDomain
   */
  constructor(idpDomain) {
    this._domain = idpDomain;
    this._parser = sax.parser(false, { lowercase: true });
  }

  /**
   * Get login path (w/o domain)
   * @returns {Promise}
   * @private
   */
  _getLoginPath() {
    let loginPath = '';
    let idpUrl = url.resolve(this._domain, 'adfs/ls/IdpInitiatedSignOn.aspx?loginToRp=urn:amazon:webservices');

    return new Promise((resolve, reject) => {
      request.get({ url: idpUrl, rejectUnauthorized: false }, (err, res, body) => {
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
      const emailRegExp = /.+@.+\..+/;
      const options = {
        followAllRedirects: true,
        rejectUnauthorized: false,
        url: url.resolve(this._domain, loginPath),
        form: {
          UserName: emailRegExp.test(username) ? username : `CORP\\${username}`,
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
   * @param {String} username
   * @param {String} password
   * @returns {Promise}
   */
  getSamlResponse(username, password) {
    return this._getLoginPath().then(loginPath => this._login(loginPath, username, password));
  }

  /**
   * Login and get list of available roles
   * @param {String} username
   * @param {String} password
   * @return {Promise}
   */
  getAvailableAccounts(username, password) {
    return this.getSamlResponse(username, password).then(samlBase64Response => {
      const samlXml = Saml.parseResponse(samlBase64Response);

      return this._getAllRoles(samlXml)
        .then(roles => Promise.all(roles.map(it => this._assumeRole(it.roleArn, it.principalArn, samlBase64Response))))
        .then(results => results.filter(Boolean));
    });
  }

  /**
   * Parse role ARNs from xmlSamlResponse
   * @param {String} xmlString
   * @returns {Promise}
   * @private
   */
  _getAllRoles(xmlString) {
    return new Promise((resolve, reject) => {
      let roles = [];

      this._parser.ontext = text => {
        if (/^arn:aws:iam::.*/.test(text)) {
          const [ principalArn, roleArn ] = text.split(',');

          roles.push({ principalArn, roleArn });
        }
      };

      this._parser.onerror = err => reject(err);
      this._parser.onend = () => resolve(roles);
      this._parser.write(xmlString).close();
    });
  }

  /**
   * Assume role (resolve false on fail)
   * @param {String} roleArn
   * @param {String} principalArn
   * @param {String} samlResponse
   * @returns {Promise}
   * @private
   */
  _assumeRole(roleArn, principalArn, samlResponse) {
    const sts = new AWS.STS();
    const params = { RoleArn: roleArn, PrincipalArn: principalArn, SAMLAssertion: samlResponse };

    return sts
      .assumeRoleWithSAML(params)
      .promise()
      .then(data => Promise.resolve(Object.assign({ Arn: roleArn }, data.Credentials)))
      .catch(() => Promise.resolve(false));
  }

  /**
   * Parse SAML Response (base64 => xml)
   * @param {String} samlResponse
   * @returns {String}
   */
  static parseResponse(samlResponse) {
    return Buffer.from(samlResponse, 'base64').toString('utf8');
  }
}

module.exports = Saml;
