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
          data.push(x)
      })

      var t = table.createTable([
        { title: "Year", property: 'year' }
      , { title: "Expenditure", property: 'expenditure', format: 'multicurrency' }
      , { title: "Income", property: 'income', format: 'multicurrency' }
      , { title: "Rlsd CapGn", property: 'capgains', format: 'multicurrency' }
      , { title: "Dividends", property: 'dividends', format: 'multicurrency' }
      , { title: "Total", property: 'net', format: 'multicurrency' }
      ], data)

      console.log(t.toString())
    }
  }
)
acct.runFile(opts[0]);
