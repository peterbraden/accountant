
var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 

var r2 = ac.utils.r2
  , c = ac.utils.c

module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){
    }
  , onPreEquitySell : function(sell, state){
      var age = sell.age
      var bank = state.banks[sell.account]
      var stock = bank.equities[sell.symbol]
      var value = sell.value || sell.price * sell.quantity

      //TODO: Dividend only of sold stock
      console.log(
          sell.date
        , "Sold"
        , ac.utils.pad(sell.symbol, 5).yellow
        , ac.utils.c(sell.quantity)
        , "@"
        , ac.utils.$(sell.price|| (sell.gross / sell.quantity))
        , ac.utils.$(stock.costbasis)
        , "->"
        , ac.utils.$(value + (stock.dividend || 0))
        , ":"
        , c(ac.utils.r2((value + (stock.dividend || 0)) / stock.costbasis * 100 - 100), "", "%")
        , "over"
        , ((age > 360 ) ? (age + "").green : (age + "").yellow)
        , "yield :"
        , c(r2((((value + (stock.dividend || 0)) - stock.costbasis ) / sell.age * 30)), "", "%")
        )
    }
 
  }
}
