var acct = require('../accountant')
  , stock = require('../reports/daily-stock')
  , ls = require('../reports/list-account')
  , holdings = require('../reports/holdings')
  
  
var smokeopts = {0 : './example-accounts.json'}  
  
acct.registerReport(stock({}))
acct.registerReport(ls({
    showTransactions : true
  , showDividends : true
  , showStock : true
  , expanded : true
}))
acct.registerReport(holdings({}))

acct.run(smokeopts[0])
