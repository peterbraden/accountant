var ac = require('../accountant')
  , colors = require('colors');


var lastDate = 0
var checkDate = function(d){
  if (d < lastDate){
    console.log("Out of order date:".red, d);
  }
  lastDate = d
}


module.exports = function(opts) {
  var SHOW_TRANSACTIONS = opts.showTransactions || false
    , SHOW_DIVIDENDS = opts.showDividends || false
    , SHOW_STOCK = opts.showStock || false
    , EXPANDED = opts.expanded || false
 
  return {
  
    onEquityBuy : function(stock){
      if (SHOW_STOCK)
        console.log(ac.pad(stock.symbol, 5), 'Buy'.red, stock.quantity, stock.cost, ": $", ac.c(stock.cb))
    }
    
  , onDividend : function(acct, banks, stocks){
    var s = stocks[acct.symbol]
        , positions = banks[acct.account].positions
		    , net = parseInt(positions[acct.symbol] * acct.amount * 100) / 100
        
      if (acct.gross){
        acct.amount = parseInt(acct.gross/s.quantity * 100)/100
        net = acct.gross
      }
      if (SHOW_DIVIDENDS){
        console.log(ac.pad(acct.symbol, 5), "Div".blue, acct.date, s.quantity, acct.amount, ": $", net)
      }    
  }
  
  , onTransaction : function(acct, banks){
      checkDate(acct.date)

      if (SHOW_TRANSACTIONS)
        console.log(acct.date, acct.src, '->', acct.dest, ' : ', acct.amount, "(", ac.c(banks[acct.src].balance), ")")
  }
  
  , onPreStatement : function(acct, banks){
     if (banks[acct.acct] ){
      if (Math.abs(banks[acct.acct].balance - acct.balance) > 0.01){
        console.log((["Accounts for", (acct.acct + "").underline, "in"
          , banks[acct.acct].last_statement, "to", acct.date
          , "differ by", Math.round((banks[acct.acct].balance - acct.balance) * 10000)/10000]).join(' ').red, "(", ac.c(banks[acct.acct].balance), ", s:", ac.c(acct.balance), ")")
       } else {
         if (EXPANDED)
           console.log("-- ", acct.acct, " OK:".green, acct.balance, " at ", acct.date)
         else
           process.stdout.write('.')
 	    }
    }
  }
  , onComplete : function(){}
  
  
  
  }
}
