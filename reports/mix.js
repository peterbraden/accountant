var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 


var COLS = {
    cls : {title : "Asset Class", ind: 0}
  , value: {title: "Current Value", ind:1}
  , prop : {title : "Proportion", ind: 2}
}

module.exports = function(opts){
  return {
   
    onComplete: function(banks, stocks){
      ac.loadPrices(stocks, function(stocks){
        var t = new Table({
            head : _.map(COLS, function(v, k){return v.title})
          , style : {compact: true, 'padding-left':1, head: ['cyan']} 
        })


      var assets = []
        , asset_classes = {}
        , cash = 0
        , total_worth = 0

      // === Cash ===
      _.each(banks, function(b, k){
        if (!b.balance || !b.last_statement) return;

        cash += b.balance
        total_worth += b.balance
      })

      assets.push({
          cls: "Cash".yellow
        , value: cash
      })

      // === Equities ===
      _.each(stocks, function(s, symbol){
        var value =  s.current * s.quantity
        total_worth += value

        if (s.asset_class){
          var x = asset_classes[s.asset_class] || 0
          asset_classes[s.asset_class] = x + value
        } else {
          var x = asset_classes["Unclassed"] || 0
          asset_classes["Unclassed"] = x + value
        }

      })


      // === Add asset classes to list ==
      
      _.each(asset_classes, function(v, k){
        assets.push({
            cls: k
          , value: v
        })
      })

      //  === Build Table ===
      assets.sort(function(a, b){
        return (b.value) - (a.value)
      })

      _.each(assets, function(x){
        t.push([x.cls
          , ac.c(x.value)
          , ac.c(x.value / total_worth*100)
          ])
      })

        console.log(t.toString())
      })
    }// end onComplete
  
  
  }
}
