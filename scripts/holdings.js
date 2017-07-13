#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/holdings')
  , opts = require('nomnom').parse()
  
acct.registerReport(report(opts)).runFile(opts[0]);
