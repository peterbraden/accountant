
var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 

module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){
    }
  , onEquitySell : function(sell, banks, stocks){
      var age =  ac.stockMaxAge(stocks[sell.symbol])

      console.log(
          sell.date
        , "Sold"
        , ac.pad(sell.symbol, 5).yellow
        , ac.c(sell.quantity)
        , "@".grey
        , ac.$(sell.price)
        , ac.$(sell.cb)
        , "->".grey
        , ac.$(sell.value)
        , ":".grey
        , ac.c(ac.r2(sell.value/sell.cb * 100), "", "%")
        , "over".grey
        , ((age > 360 ) ? (age + "").green : (age + "").yellow)
        , "yield :".grey
        , ac.c(((sell.value - sell.cb )/ age * 30) / sell.cb)
        )
    }
 
  }
}
