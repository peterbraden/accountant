#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/runway')
  , opts = require('nomnom').parse()

acct.registerReport(report)
    .runFile(opts[0]);
