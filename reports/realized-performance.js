
var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 

module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){
    }
  , onEquitySell : function(sell, stock, banks, stocks){
      var age = sell.age
        //TODO: Dividend only of sold stock

      console.log(
          sell.date
        , "Sold"
        , ac.pad(sell.symbol, 5).yellow
        , ac.c(sell.quantity)
        , "@".grey
        , ac.$(sell.price)
        , ac.$(sell.cb)
        , "->".grey
        , ac.$(sell.value + stock.dividend)
        , ":".grey
        , ac.c(ac.r2((sell.value + stock.dividend)/sell.cb * 100 - 100), "", "%")
        , "over".grey
        , ((age > 360 ) ? (age + "").green : (age + "").yellow)
        , "yield :".grey
        , ac.c((((sell.value + stock.dividend) - sell.cb )/ age * 30))
        )
    }
 
  }
}
