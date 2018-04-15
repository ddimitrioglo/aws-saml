'use strict';

const os = require('os');
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

    if (rl.secretQuery) {
      let regExp = new RegExp(`^(${rl.secretQuery})(.*)$`);

      result = regExp.test(string)
        ? string.replace(regExp, (match, g1, g2) => [g1, ...(new Array(g2.length)).fill(secretSign, 0)].join(''))
        : secretSign;
    }

    rl.output.write(result);
  }
};

/**
 * Add secret question method
 * @param {String} query
 * @param {Function} cb
 */
rl.constructor.prototype.secretQuestion = (query, cb) => {
  rl.secretQuery = query;
  rl.question(query, answer => {
    rl.secretQuery = null;
    rl.output.write(os.EOL);
    cb(answer);
  });
};

module.exports = rl;
