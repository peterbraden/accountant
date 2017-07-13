var fs = require('fs')
  , _ = require('underscore')

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

var _prev_date = ''
var onEvent = function(typ, report, ev, banks, stocks){
  if (report.onEvent){
    report.onEvent(typ, ev, banks, stocks);
  }
  if (ev.date) {
    var d = ev.date
    // On Day
    if (report.onDay && d.slice(8, 10) != _prev_date.slice(8, 10)){
      report.onDay(d, ev, banks, stocks)
    }
    // On Month
    if (report.onMonth && d.slice(5, 7) != _prev_date.slice(5, 7)){
      report.onMonth(d.slice(0, 7), ev, banks, stocks)
    }
    // On Year
    if (report.onYear && d.slice(0, 4) != _prev_date.slice(0, 4)){
      report.onYear(d.slice(0, 4), ev, banks, stocks)
    }
    _prev_date = d
  }
}

var invoice = function(t, banks, stocks, invoices){
  if (!invoices[t.to]){
    invoices[t.to] = {
        outstanding : []
      , paid : []
    }
  }

  invoices[t.to].outstanding.push(t);

  _.each(reports, function(r){
    onEvent('invoice', r, t, banks, stocks, invoices)
    if (r.onInvoice) 
      r.onInvoice(t, banks, stocks, invoices);
  })
}

var resolveInvoice = function(transaction, banks, stocks, invoices){
  var id = transaction.invoice
  for (var to in invoices){
    var outstanding = invoices[to].outstanding
    for (var i in outstanding){
      if (outstanding[i].id == id){
        // Move the invoice to closed
        var inv = outstanding[i];
        invoices[to].paid.push(inv);
        outstanding.splice(i,1);

        _.each(reports, function(r){
          onEvent('invoice-close', r, transaction, banks, stocks)
          if (r.onInvoiceClose){
            r.onInvoiceClose(transaction, inv, invoices);
          }
        })

        return;
      }
    }
  }

  throw "Outstanding invoice not found: " + id
}

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

exports.runFile = function(filename) {
  filename = filename || './accounts.json'
  var file = fs.readFileSync(filename, 'utf8')
               .replace(/\/\/.*\n/g, '') //strip comments
  return exports.run(JSON.parse(file))
}

exports.run = function(accts){
  var state = {}
  triggerEvents(['onStart'], {}, state)

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (EVENTS[acct.typ]){
      triggerEvents(EVENTS[acct.typ], acct, state)
    }
  }

  triggerEvents(['onComplete'], {}, state)
}

