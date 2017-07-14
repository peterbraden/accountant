#!/usr/bin/env node
var acct = require('../accountant')
  , opts = require('nomnom').parse()
  , report = require('../reports/realized-performance')

acct.registerReport(report(opts)).runFile(opts[0]);
