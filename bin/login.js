#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const url = require('url');
const sax = require('sax');
const AWS = require('aws-sdk');
const path = require('path');
const rle = require('../lib/extra-readline');
const Saml = require('../lib/saml');
const CredentialsParser = require('../lib/credentials-parser');

const cfgName = '.aws-saml.json';
const cfgExample = path.join(__dirname, '../.aws-saml.json');
const cfgPath = path.join(os.homedir(), cfgName);

if (!fs.existsSync(cfgPath)) {
  fs.writeFileSync(cfgPath, fs.readFileSync(cfgExample), 'utf8');
  console.log(`Please configure aws-saml (vim ${cfgPath})`);
  process.exit(0);
}

const { directoryDomain, username, profile, accountMapping } = require(cfgPath);
const idpEntryUrl = url.resolve(directoryDomain, 'adfs/ls/IdpInitiatedSignOn.aspx?loginToRp=urn:amazon:webservices');
const saml = new Saml(idpEntryUrl);
const parser = new CredentialsParser();

let samlRawResponse = '';

Promise.all([
  askPassword(),
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

  return chooseAccount(availableAccounts);
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

/**
 * Ask a password
 * @returns {Promise}
 */
function askPassword() {
  console.log(`Please enter password for [ ${username} ]:`);

  return new Promise(resolve => {
    rle.password(password => {
      rle.pause();

      return resolve(password);
    });
  });
}

/**
 * Choose AWS account to login
 * @param {Array} accounts
 * @returns {Promise}
 */
function chooseAccount(accounts) {
  const accountsList = accounts.map((account, index) => {
    return `[ ${index} ] ${account.AccountAlias}`;
  });

  console.log(accountsList.join('\n'));

  return new Promise(resolve => {
    rle.resume();
    rle.question('Choose account to login: ', index => {
      rle.close();

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
 * Get AWS account alias from ARN
 * @param {String} roleString
 * @returns {String}
 */
function getAlias(roleString) {
  const accountId = roleString.substr(roleString.search(/[0-9]+/i), 12);

  return accountMapping[accountId] || accountId;
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
        Object.assign({ AccountAlias: getAlias(roleArn) }, data.Credentials)
      );
    })
    .catch(() => Promise.resolve(false))
  ;
}
