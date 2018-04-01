'use strict';

const readline = require('readline');

const secretSign = '🔑 ';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  historySize: 0
});

/**
 * True if password is typing
 * @type {Boolean}
 */
rl.isSecret = false;

/**
 * Overwrite base method
 * @param {String} string
 */
rl._writeToOutput = string => {
  if (rl.output !== null && rl.output !== undefined) {
    if (rl.isSecret && string !== secretSign) {
      string = '*'
    }

    rl.output.write(string);
  }
};

/**
 * Add password question method
 * @param {Function} cb
 */
rl.constructor.prototype.password = cb => {
  rl.isSecret = true;
  rl.question(secretSign, password => {
    rl.isSecret = false;
    rl.output.write('\n');
    cb(password);
  });
};

module.exports = rl;
