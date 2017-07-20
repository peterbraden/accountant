#!/usr/bin/env node
var acct = require('../accountant')
  , opts = require('nomnom').parse()
  , ac = require('../accountant')
  , _ = require('underscore')
  , table = require('../lib/table')
  
acct.registerReport({
    onComplete: function(ev, state){

      var data = []
      var banks = state.banks, stocks = state.stocks
      ac.utils.loadPrices(stocks, function(stocks){


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
        data.push({
            asset_class: x.cls
          , value: [{value: x.value}]
          , proportion: x.value / total_worth
        })
      })

      var t = table.createTable([
        {title : "Asset Class", property: 'asset_class'}
      , {title: "Current Value", property:'value', format:'multicurrency'}
      , {title : "Proportion", property: 'proportion', format: 'percent'}
      ], data)

      console.log(t.toString())

      })
    }// end onComplete
  
  
}).runFile(opts[0])
