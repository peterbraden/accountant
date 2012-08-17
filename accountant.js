/**
===== Accountant =====



*/
var fs = require('fs')
  , colors = require('colors')
  , _ = require('underscore')
  , request = require('request')
   
var reports = []

exports.historic = require('./historic')


exports.registerReport = function(report){
  reports.push(report)
  return exports
}  


var transaction = function(t, banks, stocks){
    banks[t.src] = banks[t.src] || {balance:0}
    banks[t.dest] = banks[t.dest] || {balance:0}
  
    banks[t.src].balance -= t.amount
    banks[t.dest].balance += t.amount
  
    banks[t.src].currency = t.currency
    banks[t.dest].currency = t.currency
    
    _.each(reports, function(r){
      if (r.onTransaction) 
        r.onTransaction(t, banks, stocks);
    })
}  

var equityBuy = function(buy, stocks, banks){
    var s = stocks[buy.symbol] || {}
      , cb = ((buy.quantity * buy.cost) + buy.commission)
    
    s.quantity = s.quantity || 0
    s.dividend = s.dividend || 0
    s.cost_basis =  s.cost_basis || 0
 
    s.cost_basis += cb
    s.quantity += buy.quantity

	  s.industry = s.industry || buy.industry

  	s.chunks = s.chunks || []
  	s.chunks.push({date: buy.date, quantity: buy.quantity})
  	
    stocks[buy.symbol] = s

    banks[buy.account] = banks[buy.account] || {balance:0}
    banks[buy.account].balance -= cb
    banks[buy.account].positions = banks[buy.account].positions || {}
	if (!banks[buy.account].positions[buy.symbol]){
	  banks[buy.account].positions[buy.symbol] = 0
	}
	banks[buy.account].positions[buy.symbol] += buy.quantity 
  
    banks[buy.account].trading = true
	  stocks[buy.symbol].etf = (buy.typ =='etf-buy')
	  stocks[buy.symbol].brokerage = buy.account // TODO!!! ASSUMES NO DUPE OF STOCK BETWEEN ACCTS 

    buy.cb = cb
    
    _.each(reports, function(r){
      if (r.onEquityBuy) 
        r.onEquityBuy(buy);
    })
}

var dividend = function(div, stocks, banks){
   var s = stocks[div.symbol]
	   , bank = banks[div.account] || {}
     , net

    if (div.amount){
      net = bank.positions[div.symbol] * div.amount
    } else {
      net = div.gross
    }

    s.dividend += net
    banks[div.account] = banks[div.account] || {}
    banks[div.account].balance += net
  
    banks[div.account].trading = true
  
    _.each(reports, function(r){
      if (r.onDividend) 
        r.onDividend(div, banks, stocks);
    })
}  

var statement = function(statement, banks){  
  _.each(reports, function(r){
    if (r.onPreStatement) 
      r.onPreStatement(statement, banks);
  })


  banks[statement.acct] = banks[statement.acct] || {}

  banks[statement.acct].currency = statement.currency
  banks[statement.acct].balance = statement.balance
  banks[statement.acct].last_statement = statement.date
  
  _.each(reports, function(r){
    if (r.onStatement) 
      r.onStatement(statement, banks);
  })
  
}  



exports.run = function(file){
  file = file || './accounts.json'

  var accts = JSON.parse(fs.readFileSync(file, 'utf8').replace(/\/\/.*\n/g, '')) //strip comments
    , stocks = {}
    , banks = {}

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (acct.typ== 'stock-buy' || acct.typ == 'etf-buy'){
      equityBuy(acct, stocks, banks);
    }
  
    if (acct.typ == 'dividend'){
       dividend(acct, stocks, banks)
    }
  
    if (acct.typ == 'statement'){
      statement(acct, banks)
    }
  
    if (acct.typ == 'transaction'){
      transaction(acct, banks, stocks)
    }  
  
  }

  _.each(reports, function(r){
    if (r.onComplete) 
      r.onComplete(banks, stocks);
  })

}



// === Utility Functions ===

exports.c = function(v, pre, post){
  var val = '' + parseInt(v*100)/100
    , str = (pre || '') + val + (post || '')
  
  str = (val>=0) ? str.green : str.red  
  
  return str
}  

exports.$ = function(v, curr){
  var val = parseInt(v*100)/100
    , dol = parseInt(val)
    , cen = exports.pad(parseInt(val % 1), 2, '0')
    , dols = (dol + '').replace(/(\d)(?=(\d\d\d)+$)/, "$1,")
    , str = (curr || "$") + dols + "." + cen
  str = (val>=0) ? str.green : str.red  
  return str
}

// Round to 2 decimal places
exports.r2 = function(v){
  if (v == 0){
    return '0'
  }

  var w = parseInt(v)
    , f = exports.pad(Math.abs(parseInt((v % 1) * 100)), 2, '0')
  return  ((v<0 && w == 0) ? '-' : '') +  w + '.' + f
}

exports.pad = function(v, len, ch){
  var val = v + ''
  
  while(val.length < len){
    val += (ch || ' ')
  }	  
  return val	  
}	


// Age of oldest stocks in days
exports.stockMaxAge = function(stock){
 return parseInt((new Date().getTime() - new Date(stock.chunks[0].date).getTime())/(1000*3600*24))
}

// $ gain of stock
exports.stockGain = function(stock){
 return stock.quantity * stock.current + stock.dividend - stock.cost_basis
}


var FINANCE_URL ='http://www.google.com/finance/info?client=ig&q='
exports.loadPrices = function(stocks, cb){
  request.get({uri:FINANCE_URL + _(stocks).keys().join(',')}, function(err, resp, body){
      if (!body) throw "Could not get data from API"
      
      var finances = JSON.parse(body.slice(3))

       _.each(finances, function(v, k){
         stocks[v.t].current = v.l_cur
         stocks[v.t].change = v.c
         stocks[v.t].change_percent = v.cp
       })

       cb(stocks)
    })
}


