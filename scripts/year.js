#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/yearly')
  , opts = require('nomnom').parse()

acct.registerReport(report(opts)).runFile(opts[0]);
