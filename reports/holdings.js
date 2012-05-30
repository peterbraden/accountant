var Table = require('cli-table')
  , _ = require('underscore')
  , ac = require('../accountant') 
  , request = require('request')

var FINANCE_URL ='http://www.google.com/finance/info?client=ig&q='

var COLS = {
    asset : {title : "Asset", ind : 0}
  , cbval : {title : "CB Val", ind : 1}
  , cbprop: {title : "CB % Equity", ind: 2}
  , cbpropnet: {title : "CB % Net", ind: 3}
  , value: {title: "Val"}
  , valprop : {title : "Val %", ind: 5}
  , valpropnet: {title: "Val % Net"}
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
        , net_val = 0

    request.get({uri:FINANCE_URL + _(stocks).keys().join(',')}, function(err, resp, body){
      if (!body) throw "Could not get data from API"
      var finances = JSON.parse(body.slice(3))

       _.each(finances, function(v, k){
         stocks[v.t].current = v.l_cur
         stocks[v.t].change = v.c
         stocks[v.t].change_percent = v.cp
         })

      _.each(banks, function(b, k){
        if (!b.balance || !b.last_statement) return;

        cash += b.balance
        net_worth += b.balance
      })

      assets.push({
          symbol: "Cash".yellow
        , cost_basis: cash
        , value: cash
      })

      _.each(stocks, function(s, symbol){
        s.symbol = symbol  
        s.equity = true
        s.value = s.current * s.quantity
        assets.push(s);
        net_worth += s.cost_basis
        net_equity += s.cost_basis
        net_val += s.value
      })

      assets.sort(function(a, b){
        return b.cost_basis - a.cost_basis
      })


        _.each(assets, function(x){
          t.push([x.symbol
            , ac.c(x.cost_basis)
            , x.equity ? ac.c(x.cost_basis/net_equity*100) : '-'
            , ac.c(x.cost_basis/net_worth*100)
            , ac.c(x.value)
            , ac.c(x.value/net_val*100)
            , ac.c(x.value/(net_val + cash)*100)
            ])
        })
        console.log(t.toString());
      })
    
    }
  }
}
