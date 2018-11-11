'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const keypair = require('keypair');

class SSH {
  /**
   * @param {String} destPath
   */
  constructor(destPath) {
    const publicPath = path.join(destPath, 'rsa.pubk');
    const privatePath = path.join(destPath, 'rsa.pk');

    if (!fs.existsSync(privatePath)) {
      const rsaPair = keypair();

      fs.writeFileSync(publicPath, rsaPair['public']);
      fs.writeFileSync(privatePath, rsaPair['private']);
    }

    this.public = fs.readFileSync(publicPath, 'utf8');
    this.private = fs.readFileSync(privatePath, 'utf8');
  }

  /**
   * Encrypt message and encode to base64
   * @param {String} message
   * @return {*}
   */
  encrypt(message) {
    return crypto
      .publicEncrypt(this.public, Buffer.from(message))
      .toString('base64');
  }

  /**
   * Decode base64 and decrypt message
   * @param {String} string
   * @return {*}
   */
  decrypt(string) {
    return crypto
      .privateDecrypt(this.private, Buffer.from(string, 'base64'))
      .toString('utf8');
  }
}

module.exports = SSH;
