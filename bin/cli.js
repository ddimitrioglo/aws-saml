#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const cli = require('commander');
const path = require('path');
const login = require('./login');
const configure = require('./configure');
const { version } = require('../package');

function Config() {
  this.name = '.saml.json';
  this.path = path.join(os.homedir(), '.aws', this.name);
  this.template = path.join(__dirname, '../', this.name);

  return {
    name: this.name,
    path: this.path,
    template: this.template
  };
}

const cfg = new Config();

cli.version(version, '-v, --version');

cli
  .command('configure')
  .description('configure ~/.aws/.saml.json')
  .action(() => {
    configure(cfg);
  });

cli
  .command('login')
  .description('login with SAML credentials')
  .action(() => {
    if (!fs.existsSync(cfg.path)) {
      console.log('Please configure ~/.aws/.saml.json first');
      process.exit(1);
    }

    login(cfg);
  });

cli.parse(process.argv);
