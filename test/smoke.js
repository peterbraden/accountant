var acct = require('../accountant')
  , stock = require('../reports/daily-stock')
  , ls = require('../reports/list-account')
  , holdings = require('../reports/holdings')
  , yearly = require('../reports/yearly')
  , mix = require('../reports/mix')
  
  
var smokeopts = {0 : './example-accounts.json'}  
  
acct.registerReport(stock({}))
acct.registerReport(ls({
    showTransactions : true
  , showDividends : true
  , showStock : true
  , expanded : true
}))
acct.registerReport(holdings({}))
acct.registerReport(yearly())
acct.registerReport(mix())

acct.runFile(smokeopts[0])
