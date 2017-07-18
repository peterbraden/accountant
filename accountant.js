var fs = require('fs')
  , _ = require('underscore')

var EVENTS = {
  'transaction': ['onTransaction']
, 'statement': ['onPreStatement', 'onStatement']
, 'buy': ['onEquityBuy']
, 'equity-buy': ['onEquityBuy']
, 'stock-buy': ['onEquityBuy']
, 'etf-buy': ['onEquityBuy']
, 'mutfund-buy': ['onEquityBuy']
, 'sell': ['onEquitySell']
, 'equity-sell': ['onEquitySell']
, 'stock-sell': ['onEquitySell']
, 'etf-sell': ['onEquitySell']
, 'mutfund-sell': ['onEquitySell']
, 'brokerage-statement': ['onBrokerageStatement']
, 'dividend': ['onDividend']
, 'invoice': ['onInvoice']
}

var coreReport = require('./reports/core')
var equityReport = require('./reports/equity')

var reports = []

exports.reset = function(){
  reports = [
    coreReport,
    equityReport
  ]
}
exports.reset()

exports.historic = require('./historic')
exports.utils = require('./utils')

exports.registerReport = function(report){
  reports.push(report)
  return exports
}

var triggerEvents = function(events, obj, state) {
  _.each(reports, function(report){
    onEvent(obj.typ, report, obj, state)
    _.each(events, function(e){
      if (report[e]){
        report[e](obj, state)
      }
    })
  })
}

var onEvent = function(typ, report, ev, state){
  if (report.onEvent){
    report.onEvent(typ, ev, state);
  }
  if (ev.date) {
    var d = ev.date
    // On Day
    if (report.onDay && d.slice(8, 10) != state.prev_date.slice(8, 10)){
      report.onDay(d, ev, state)
    }
    // On Month
    if (report.onMonth && d.slice(5, 7) != state.prev_date.slice(5, 7)){
      report.onMonth(d.slice(0, 7), ev, state)
    }
    // On Year
    if (report.onYear && d.slice(0, 4) != state.prev_date.slice(0, 4)){
      report.onYear(d.slice(0, 4), ev, state)
    }
  }
}


exports.runFile = function(filename) {
  filename = filename || './accounts.json'
  var file = fs.readFileSync(filename, 'utf8')
               .replace(/\/\/.*\n/g, '') //strip comments
  return exports.run(JSON.parse(file))
}

exports.run = function(accts){
  var state = { prev_date: '' }
  triggerEvents(['onStart'], {}, state)

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (EVENTS[acct.typ]){
      triggerEvents(EVENTS[acct.typ], acct, state)
    }
    if (accts[i].date){
      state.prev_date = accts[i].date    
    }
  }
  triggerEvents(['onComplete'], {}, state)
}

