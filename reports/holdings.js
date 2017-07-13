var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 

var COLS = {
    asset : {title : "Asset", ind : 0}
  , cbval : {title : "CB Val", ind : 1}
  , val : {title: "Curr Val", ind: 2}
  //, cbprop: {title : "CB % Equity", ind: 2}
  , cbpropnet: {title : "CB % Net", ind: 3}
  , valpropnet: {title : "Val % Net", ind: 4}
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
        , net_worth = 0
        , net_equity = 0
        , cash = 0
        , total_worth = 0

      _.each(banks, function(b, k){
        if (!b.balance || !b.last_statement) return;

        cash += b.balance
        net_worth += b.balance
        total_worth += b.balance
      })

      assets.push({
          symbol: "Cash".yellow
        , current: 1
        , costbasis: cash
        , quantity: cash
      })

      _.each(stocks, function(s, symbol){
        s.symbol = symbol  
        s.equity = true
        assets.push(s);
        net_worth += s.costbasis
        net_equity += s.costbasis
        total_worth += s.current * s.quantity

      })

      assets.sort(function(a, b){
        return (b.current*b.quantity) - (a.current*a.quantity)
      })

      _.each(assets, function(x){
        t.push([x.symbol
          , ac.c(x.costbasis)
          //, x.equity ? ac.c(x.costbasis/net_equity*100) : '-'
          , ac.c(x.current * x.quantity)
          , ac.c(x.costbasis/net_worth*100)
          , ac.c(x.current*x.quantity/total_worth*100)
          ])
      })

      console.log(t.toString());

    })
    }
  }
}
