'use strict';

const ReadLine = require('readline');

const secretSign = '*';
const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  historySize: 0
});

/**
 * Secret query (ex: password)
 * @type {String}
 */
rl.secretQuery = null;

/**
 * Overwrite base method
 * @param {String} string
 */
rl._writeToOutput = string => {
  if (rl.output !== null && rl.output !== undefined) {
    let result = string;

    if (rl.secretQuery && string.charCodeAt(0) !== 13) {
      let regExp = new RegExp(`^(${rl.secretQuery})(.*)$`);

      result = regExp.test(string)
        ? string.replace(regExp, (match, g1, g2) => [g1, ...(new Array(g2.length)).fill(secretSign, 0)].join(''))
        : secretSign;
    }

    rl.output.write(result);
  }
};

/**
 * Extra question method
 * @param {String} query
 * @param {Boolean} isSecret
 * @return {Promise}
 */
rl.constructor.prototype.promiseQuestion = (query, isSecret = false) => {
  if (isSecret) {
    // Escape the regular expression special characters
    rl.secretQuery = query.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&');
  }

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      if (isSecret) {
        rl.secretQuery = null;
      }

      return resolve(answer.trim());
    });
  });
};

module.exports = rl;
