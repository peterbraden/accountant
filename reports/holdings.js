var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 

var COLS = {
    asset : {title : "Asset", ind : 0}
  , cbval : {title : "CB Val", ind : 1}
  , cbprop: {title : "CB % Equity", ind: 2}
  , cbpropnet: {title : "CB % Net", ind: 3}
}  
  
module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){
     
      var cols = ["Asset", "CB Val"]

      var t = new Table({
          head : _.map(COLS, function(v, k){return v.title})
        , style : {compact: true, 'padding-left':1, head: ['cyan']} 
      })


      var assets = []
        , net_worth = 0
        , net_equity = 0
        , cash = 0

      _.each(banks, function(b, k){
        if (!b.balance || !b.last_statement) return;

        console.log(k, b, b.balance, cash)  
        cash += b.balance
        net_worth += b.balance
      })

      assets.push({
          symbol: "Cash"
        , cost_basis: cash
      })

      _.each(stocks, function(s, symbol){
        s.symbol = symbol  
        s.equity = true
        assets.push(s);
        net_worth += s.cost_basis
        net_equity += s.cost_basis

      })
      
      _.each(assets, function(x){
        t.push([x.symbol
          , ac.c(x.cost_basis)
          , x.equity ? ac.c(x.cost_basis/net_equity*100) : '-'
          , ac.c(x.cost_basis/net_worth*100)])
      })

      console.log(t.toString());

    }
  }
}
