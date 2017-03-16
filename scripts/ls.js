#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/list-account')
  , opts = require('nomnom').parse()
  
acct.registerReport(report({
    showTransactions : opts.transactions
  , showDividends : opts.dividends
  , showStock : opts.stock
  , expanded : opts.expanded
  , account : opts.account
})).run(opts[0]);  
