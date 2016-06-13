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
    , CHF : 1.12
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
      if (!v.last_statement)
        return;

      var age = parseInt((new Date().getTime() - new Date(v.last_statement).getTime())/(1000*3600*24))
        , dollar_balance = v.balance
        , liquid = v.balance
        , unrealised_gain = 0
        , positions = v.positions || {}

      _.each(stocks, function(v, k){
        if (!positions[k]) return;
        var _cb = (v.cost_basis / v.quantity) * positions[k]
        dollar_balance += _cb
        unrealised_gain += (ac.stockGain(v) / v.quantity) * positions[k];
      })

      dollar_balance = dollar_balance * EXCHANGE_RATES[v.currency || 'USD']
      liquid = liquid * EXCHANGE_RATES[v.currency || 'USD']
      unrealised_gain = unrealised_gain * EXCHANGE_RATES[v.currency || 'USD']

      if (age > 60){
        k = k.red
      } else if (age > 30){
        k = k.yellow
      }
      if (!v.balance && !unrealised_gain)
        return false;

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





 


