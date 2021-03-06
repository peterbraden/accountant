var ac = require('../accountant')
  , colors = require('colors')
  , utils = require('../utils')




module.exports = function(opts) {
  var SHOW_TRANSACTIONS = opts.showTransactions || false
    , SHOW_DIVIDENDS = opts.showDividends || false
    , SHOW_STOCK = opts.showStock || false
    , EXPANDED = opts.expanded || false
 
  return {
  
    onEquityBuy : function(stock){
      if (SHOW_STOCK)
        console.log(utils.pad(stock.symbol, 5), 'Buy'.red, stock.quantity, stock.cost, ": $", utils.c(stock.costbasis))
    }

  , onEquitySell : function(sell){
      if (SHOW_STOCK)
        console.log(utils.pad(sell.symbol, 5), 'Sell'.red, sell.quantity, sell.price, ": $", utils.c(sell.costbasis), "->", utils.c(sell.value))
    }
    
  , onDividend : function(acct, state){
    var banks = state.banks
      , bank = banks[acct.account]
      , s = bank.equities[acct.symbol]
		  , net = parseInt(s.position * acct.amount * 100) / 100
        
      if (acct.gross){
        if (s)
          acct.amount = parseInt(acct.gross/s.quantity * 100)/100
        net = acct.gross
      }
      if (SHOW_DIVIDENDS){
        console.log(utils.pad(acct.symbol, 5), "Div".blue, acct.date, s.quantity, acct.amount, ": $", net)
      }    
  }
  
  , onTransaction : function(acct, state){
      var banks = state.banks, stocks = state.stocks
      if (SHOW_TRANSACTIONS)
        console.log(acct.date, acct.src, '->', acct.dest, ' : ', acct.amount, "(", utils.c(banks[acct.src].balance), ")")
  }
  
  , onComplete : function(){}
  
  
  
  }
}
