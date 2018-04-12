'use strict';

const url = require('url');
const sax = require('sax');
const AWS = require('aws-sdk');
const Saml = require('../lib/saml');
const rlex = require('../lib/extra-readline');
const CredentialsParser = require('../lib/credentials-parser');

/**
 * Login action
 * @param {Object} config
 */
function login(config) {
  const { directoryDomain, username, profile, accountMapping } = require(config.path);
  const idpEntryUrl = url.resolve(directoryDomain, 'adfs/ls/IdpInitiatedSignOn.aspx?loginToRp=urn:amazon:webservices');
  const saml = new Saml(idpEntryUrl);
  const parser = new CredentialsParser();

  let samlRawResponse = '';

  Promise.all([
    askPassword(username),
    saml.getLoginPath()
  ]).then(([password, loginPath]) => {

    return saml.getSamlResponse(loginPath, username, password);
  }).then(samlResponse => {
    samlRawResponse = samlResponse;

    return parseRoles(Saml.parseSamlResponse(samlRawResponse));
  }).then(roles => {

    return Promise.all(roles.map(role => {
      return assumeRole(role.roleArn, role.principalArn, samlRawResponse);
    })).then(results => {
      return results.filter(Boolean);
    });
  }).then(availableAccounts => {

    return chooseAccount(availableAccounts, accountMapping);
  }).then(chosenAccount => {

    parser.updateProfile(profile, {
      aws_access_key_id: chosenAccount.AccessKeyId,
      aws_secret_access_key: chosenAccount.SecretAccessKey,
      aws_session_token: chosenAccount.SessionToken
    }).persist();

    console.log('Done!');
    process.exit(0);
  }).catch(err => {
    console.error(`Failed with error: ${err.message.trim()}`);
    process.exit(1);
  });
}

module.exports = login;

/**
 * Ask a password
 * @returns {Promise}
 */
function askPassword(username) {
  console.log(`Please enter password for [ ${username} ]:`);

  return new Promise(resolve => {
    rlex.password(password => {
      rlex.pause();

      return resolve(password);
    });
  });
}

/**
 * Choose AWS account to login
 * @param {Array} accounts
 * @param {Object} mapping
 * @returns {Promise}
 */
function chooseAccount(accounts, mapping) {
  const accountsList = accounts.map((account, index) => {
    let [, accountId] = account.Arn.match(/(\d+):role/);

    return `[ ${index} ] ${account.Arn} (${mapping[accountId] || accountId})`;
  });

  console.log(accountsList.join('\n'));

  return new Promise(resolve => {
    rlex.resume();
    rlex.question('Choose account to login: ', index => {
      rlex.close();

      return resolve(accounts[index]);
    });
  });
}

/**
 * Parse role ARNs from xmlSamlResponse
 * @param {String} xmlString
 * @returns {Promise}
 */
function parseRoles(xmlString) {
  return new Promise((resolve, reject) => {
    let roles = [];
    let parser = sax.parser(false);

    parser.ontext = text => {
      if (/^arn:aws:iam::.*/.test(text)) {
        const [ principalArn, roleArn ] = text.split(',');

        roles.push({ principalArn, roleArn });
      }
    };

    parser.onerror = err => reject(err);
    parser.onend = () => resolve(roles);
    parser.write(xmlString).close();
  })
}

/**
 * Assume role (resolve false on fail)
 * @param {String} roleArn
 * @param {String} principalArn
 * @param {String} samlResponse
 * @returns {Promise}
 */
function assumeRole(roleArn, principalArn, samlResponse) {
  const sts = new AWS.STS();
  const params = { RoleArn: roleArn, PrincipalArn: principalArn, SAMLAssertion: samlResponse };

  return sts
    .assumeRoleWithSAML(params)
    .promise()
    .then(data => {
      return Promise.resolve(
        Object.assign({ Arn: roleArn }, data.Credentials)
      );
    })
    .catch(() => Promise.resolve(false));
}
