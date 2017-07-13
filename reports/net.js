var request = require('request')
  , _ = require('underscore')
  , Table = require('cli-table')
  , ac = require('../accountant') 
  , vals = []
  , c = ac.utils.c
  , $$ = ac.utils.$

var EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.28
    , CHF : 1.04
}

module.exports = function(opts){
  return {

  onComplete: function(ev, state){
    var banks = state.banks, stocks = state.stocks
    ac.utils.loadPrices(stocks, function(stocks){
    var t = new Table({
        head : ["Account", "Value", "Value ($)", "Liquid", "Liquid ($)", "Unrealised",  "Unrealised ($)", "Total ($)", "% Net"]
      , style : {compact: true, 'padding-left':1, head: ['cyan']}
    })

    _.each(banks, function(v, k){
      if (!v.last_statement)
        return;

      var age = parseInt((new Date().getTime() - new Date(v.last_statement).getTime())/(1000*3600*24))
        , balance = v.balance
        , liquid = v.balance
        , unrealised_gain = 0
        , positions = v.positions || {}

      _.each(stocks, function(v, k){
        if (!positions[k]) return;
        var _cb = (v.costbasis / v.quantity) * positions[k]
        balance += _cb
        unrealised_gain += (ac.stockGain(v) / v.quantity) * positions[k];
      })

      var dollar_balance = balance * EXCHANGE_RATES[v.currency || 'USD']
      var dollar_liquid = liquid * EXCHANGE_RATES[v.currency || 'USD']
      var dollar_unrealised_gain = unrealised_gain * EXCHANGE_RATES[v.currency || 'USD']

      if (age > 60){
        k = k.red
      } else if (age > 30){
        k = k.yellow
      }
      if (!v.balance && !unrealised_gain)
        return false;

      vals.push([k, $$(balance, v.currency), dollar_balance, $$(liquid, v.currency), dollar_liquid, $$(unrealised_gain, v.currency), dollar_unrealised_gain])
    })


    var tot_val = _.reduce(_.pluck(vals, 2), function(x, y){return x+y}, 0)
      , tot_liq= _.reduce(_.pluck(vals, 4), function(x, y){return x+y}, 0)
      , tot_ur = _.reduce(_.pluck(vals, 6), function(x, y){return x+y}, 0)
      , tot_tot = tot_val + tot_ur

    _.each(vals, function(v){
      t.push([v[0], v[1], $$(v[2]), v[3], $$(v[4]), v[5], $$(v[6]), $$(v[2] + v[6]), c((v[2] + v[6]) / tot_tot*100)])
    })
    t.push([]);
    t.push(['Total', '', $$(tot_val), '',  $$(tot_liq), '', $$(tot_ur), $$(tot_tot), '']);

    console.log(t.toString())


  })
  }
}
}





 


