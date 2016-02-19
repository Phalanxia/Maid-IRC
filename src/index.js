'use strict';

// Dependencies
const program = require('commander');

// package.json
const pjson = require('../package.json');

require('./server/commands/start.js');

// Version command
program.version(pjson.version, '-v, --version');

program.parse(process.argv);
