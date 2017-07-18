#!/usr/bin/env node
var acct = require('../accountant')
  , yearly = require('../reports/yearly')
  , opts = require('nomnom').parse()
  , _ = require('underscore')
  , table = require('../lib/table')

acct.registerReport(yearly)
acct.registerReport(
  {
    onComplete: function(e, state){
      var data = []

      _.each(state.years, function(x, yr){
          data.push({
            year: yr
          , spend: { value: -1 * x.spend }
          , income: { value: x.income }
          , capgains: { value: x.capgains }
          , dividends: { value:  x.div }
          , net: { value:  x.income + x.div + x.capgains - x.spend }
          })
      })

      var t = table.createTable([
        { title: "Year", property: 'year' }
      , { title: "Expenditure", property: 'spend', format: 'currency' }
      , { title: "Income", property: 'income', format: 'currency' }
      , { title: "Rlsd CapGn", property: 'capgains', format: 'currency' }
      , { title: "Dividends", property: 'dividends', format: 'currency' }
      , { title: "Total", property: 'net', format: 'currency' }
      ], data)

      console.log(t.toString())
    }
  }
)
acct.runFile(opts[0]);
