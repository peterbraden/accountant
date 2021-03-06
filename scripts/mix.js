#!/usr/bin/env node
var acct = require('../accountant')
  , opts = require('nomnom').parse()
  , ac = require('../accountant')
  , _ = require('underscore')
  , table = require('../lib/table')

module.exports = {
  onComplete: function(ev, state){
    var data = []
    var banks = state.banks
      , stocks = state.stocks

    ac.utils.loadPrices(stocks, function(stocks){
      var assets = []
        , asset_classes = {}
        , cash = []

      // === Cash ===
        _.each(banks, function(b, k){
          if (!b.balance || !b.last_statement) return;

          cash.push({value: b.balance, currency: b.currency})

          _.each(b.equities, function(s, symbol){
            var value =  stocks[symbol].current * s.position
            var k = stocks[symbol].asset_class || "Unclassed"
            asset_classes[k] = asset_classes[k] || []
            asset_classes[k].push({value: value, currency: 'USD'}) // TODO multicurrency
          })
        })

        assets.push({
          cls: "Cash".yellow
        , value: cash
        })

        // === Add asset classes to list ==

        _.each(asset_classes, function(v, k){
          assets.push({
            cls: k
            , value: v
          })
        })

        var total_worth = assets.map( (x) => table.sumCurrencyValues(x.value))
        .map( (x) => x.value )
        .reduce( (x, y) => x + y, 0)

        _.each(assets, function(x){
          var tot = table.sumCurrencyValues(x.value)
          data.push({
            asset_class: x.cls
            , value: tot 
            , proportion: tot.value / total_worth
          })
        })

        data.sort(function(a, b){
          return (b.value.value) - (a.value.value)
        })

        var t = table.createTable([
            {title : "Asset Class", property: 'asset_class'}
          , {title: "Current Value", property:'value', format:'currency'}
          , {title : "Proportion", property: 'proportion', format: 'percent'}
        ], data)
        console.log(t.toString())
    })
  }
}

if (require.main === module) {
  acct.registerReport(module.exports).runFile(opts[0])
}
