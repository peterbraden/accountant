var request = require('request')
  , _ = require('underscore')
  , Table = require('cli-table')
  , ac = require('../accountant') 
  , vals = []
  , c = ac.c
  , $$ = ac.$

var EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.5723 
}

module.exports = function(opts){
  return {

  onComplete: function(banks, stocks){
    ac.loadPrices(stocks, function(stocks){
    var t = new Table({
        head : ["Account", "Value ($)", "Liquid ($)", "Unrealised ($)", "Total ($)", "% Net"]
      , style : {compact: true, 'padding-left':1, head: ['cyan']}
    })

    _.each(banks, function(v, k){
      if (!v.balance || !v.last_statement)
        return;

      var age = parseInt((new Date().getTime() - new Date(v.last_statement).getTime())/(1000*3600*24))
        , dollar_balance = v.balance
        , liquid = v.balance
        , unrealised_gain = 0

      var s = _.filter(stocks, function(x){return x.brokerage == k});
      if (s){
        _.each(s, function(v, k){
      	  dollar_balance += v.cost_basis
          unrealised_gain += (v.current * v.quantity) - v.cost_basis;
        })
      }

      dollar_balance = dollar_balance * EXCHANGE_RATES[v.currency]
      liquid = liquid * EXCHANGE_RATES[v.currency]
      unrealised_gain = unrealised_gain * EXCHANGE_RATES[v.currency]

      if (age > 60){
        k = k.red
      } else if (age > 30){
        k = k.yellow
      }

      vals.push([k, dollar_balance, liquid, unrealised_gain])
    })


    var tot_val = _.reduce(_.pluck(vals, 1), function(x, y){return x+y}, 0)
      , tot_liq= _.reduce(_.pluck(vals, 2), function(x, y){return x+y}, 0)
      , tot_ur = _.reduce(_.pluck(vals, 3), function(x, y){return x+y}, 0)
      , tot_tot = tot_val + tot_ur

    _.each(vals, function(v){
      t.push([v[0], $$(v[1]), $$(v[2]), $$(v[3]), $$(v[1] + v[3]), c((v[1] + v[3]) /tot_tot*100)])
    })
    t.push([]);
    t.push(['Total', $$(tot_val), $$(tot_liq), $$(tot_ur), $$(tot_tot), '']);

    console.log(t.toString())


  })
  }
}
}





 


