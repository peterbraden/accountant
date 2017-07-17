#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/mix')
  , opts = require('nomnom').parse()
  
acct.registerReport(report(opts)).runFile(opts[0])
