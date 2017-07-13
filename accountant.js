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

exports.run = function(file){
  var state = {}

  var accts

  file = file || './accounts.json'
  if (typeof file == 'string') {
    accts = JSON.parse(fs.readFileSync(file, 'utf8').replace(/\/\/.*\n/g, '')) //strip comments
  } else {
    accts = file
  }

  triggerEvents(['onStart'], {}, state)

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (acct.typ== 'stock-buy' || acct.typ == 'etf-buy' || acct.typ == 'mutfund-buy'){
      triggerEvents(['onEquityBuy'], acct, state)
    }

    if (acct.typ == 'sell' || 
        acct.typ== 'stock-sell' || 
        acct.typ == 'etf-sell' || 
        acct.typ == 'mutfund-sell'){
      triggerEvents(['onEquitySell'], acct, state)
    }

    if (acct.typ == 'dividend'){
      triggerEvents(['onDividend'], acct, state)
    }
  
    if (acct.typ == 'statement'){
      triggerEvents(['onPreStatement', 'onStatement'], acct, state)
    }
  
    if (acct.typ == 'brokerage-statement'){
      triggerEvents(['onBrokerageStatement'], acct, state)
    }

    if (acct.typ == 'transaction'){
      triggerEvents(['onTransaction'], acct, state)
    }  
    
    if (acct.typ == 'invoice'){
      invoice(acct, banks, stocks, invoices)
    }  
  }

  triggerEvents(['onComplete'], {}, state)
}

