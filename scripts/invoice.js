#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/invoices')
  , opts = require('nomnom').parse()
  
acct.registerReport(report({})).runFile(opts[0]);  
