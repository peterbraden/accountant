#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/daily-stock')
  , opts = require('nomnom').parse()
  
acct.registerReport(report({})).run(opts[0])