#!/usr/bin/env node
var acct = require('../accountant')
  , yearly = require('../reports/yearly')
  , opts = require('nomnom').parse()
  , _ = require('underscore')
  , table = require('../lib/table')
  , $$ = require('../utils').v

var cols = [
  { title: "Year", property: 'year' }
, { title: "Expenditure", property: 'expenditure', format: 'multicurrency' }
, { title: "Income", property: 'income', format: 'multicurrency' }
, { title: "Rlsd CapGn", property: 'capgains', format: 'multicurrency' }
, { title: "Dividends", property: 'dividends', format: 'multicurrency' }
, { title: "Total", property: 'net', format: 'multicurrency' }
, { title: "Errors", property: 'err', format: 'raw' }
]

if (opts.full) {
  cols.splice(2, 0, {title: 'Major Expenses', property: 'acctsExp'})
}

var formatAccts = function(x) {
  return Object.keys(x.changes || {})
               .filter( (a) => a != '?')
               .filter( (a) => x.changes[a] > 0 )
               .sort((a,b) => x.changes[b] - x.changes[a])
               .slice(0, parseFloat(opts.full) || 3)
               .map( (y) => y + ':' + $$(-x.changes[y]))
               .join(', ')
}


var findErrors = function(d, errors){
  var count = 0
  errors.forEach( (e) => {
    if (e.message.indexOf(d) > -1){
      count ++
    }
  })

  return count
}

acct.registerReport(yearly)
acct.registerReport(
  {
    onComplete: function(e, state){
      var data = []

      _.each(state.years, function(x, yr){
          x.acctsExp = formatAccts(x)
          x.err = findErrors(yr, state.errors)
          data.push(x)
      })

      var t = table.createTable(cols, data)
      console.log(t.toString())

      if (opts.months) {

        var months = []
        _.each(state.months, function(x, mo){
            x.acctsExp = formatAccts(x)
            x.err = findErrors(mo, state.errors)
            months.push(x)
        })

        var colmonths = JSON.parse(JSON.stringify(cols))
        colmonths.shift()
        colmonths.unshift({ title: "Months", property: 'month'})

        var t = table.createTable(colmonths, months)
        console.log(t.toString())
      }
    }
  }
)
acct.runFile(opts[0]);
