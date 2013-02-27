#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/balances')
  , opts = require('nomnom').parse()

acct.registerReport(report(opts)).run(opts[0]);
