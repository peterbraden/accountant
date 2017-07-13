
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
        , ac.utils.pad(sell.symbol, 5).yellow
        , ac.utils.c(sell.quantity)
        , "@".grey
        , ac.utils.$(sell.price)
        , ac.utils.$(sell.cb)
        , "->".grey
        , ac.utils.$(sell.value + stock.dividend)
        , ":".grey
        , ac.utils.c(ac.r2((sell.value + stock.dividend)/sell.cb * 100 - 100), "", "%")
        , "over".grey
        , ((age > 360 ) ? (age + "").green : (age + "").yellow)
        , "yield :".grey
        , ac.utils.c((((sell.value + stock.dividend) - sell.cb )/ age * 30))
        )
    }
 
  }
}
