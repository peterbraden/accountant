/**
===== Accountant =====



*/
var fs = require('fs')
  , _ = require('underscore')
  , request = require('request')
   

try{
  var colors = require('colors')
} catch(e){}// Colors is a piece of crap

var reports = []

exports.historic = require('./historic')


exports.registerReport = function(report){
  reports.push(report)
  return exports
}  


var transaction = function(t, banks, stocks, invoices){
    banks[t.src] = banks[t.src] || {balance:0}
    banks[t.dest] = banks[t.dest] || {balance:0}
  
    banks[t.src].balance -= t.amount
    banks[t.dest].balance += t.amount
  
    banks[t.src].currency = t.currency
    banks[t.dest].currency = t.currency
    
    if (t.invoice){
      resolveInvoice(t, banks, stocks, invoices)
    }

    _.each(reports, function(r){
      if (r.onTransaction) 
        r.onTransaction(t, banks, stocks);
    })
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

var equityBuy = function(buy, stocks, banks){
    var s = stocks[buy.symbol] || {}
      , cb = ((buy.quantity * buy.cost) + buy.commission)
    
    if (buy.gross){
      cb = (buy.gross + buy.commission)
      buy.cost = buy.gross / buy.quantity  
    }

    s.quantity = s.quantity || 0
    s.dividend = s.dividend || 0
    s.cost_basis =  s.cost_basis || 0
 
    s.cost_basis += cb
    s.quantity += buy.quantity

	  s.industry = s.industry || buy.industry
	  s.asset_class = s.asset_class || buy.asset_class

  	s.chunks = s.chunks || []
  	s.chunks.push(buy)
  	
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
	  stocks[buy.symbol].mutual_fund = (buy.typ =='mutfund-buy')
	  stocks[buy.symbol].brokerage = buy.account // TODO!!! ASSUMES NO DUPE OF STOCK BETWEEN ACCTS 

    buy.cb = cb
    
    _.each(reports, function(r){
      if (r.onEquityBuy) 
        r.onEquityBuy(buy);
    })
}

var equitySell = function(sell, stocks, banks){
    var s = stocks[sell.symbol]
    if (!s)
      throw "Selling equity that does not exist"

    var amount;
    if (sell.gross){
      amount = sell.gross - sell.commission
    } else { // Price
      amount = (sell.quantity * sell.price) - sell.commission
    }

    sell.value = amount

    s.quantity = s.quantity - sell.quantity


    sell.cb = 0
    // FIFO
    for (var i = 0, j = sell.quantity; i< s.chunks.length && j > 0; i++){
      var chunk = s.chunks[i];
      if (chunk.quantity > j){
        chunk.quantity -= j;
        sell.cb += j * chunk.cost
        break;
      } else {
        s.chunks.splice(i, 1);
        sell.cb += chunk.quantity * chunk.cost
        j -= chunk.quantity;
        //TODO
      }
    }


    s.cost_basis -= sell.cb
    stocks[sell.symbol] = s
    banks[sell.account].balance -= amount
	  banks[sell.account].positions[sell.symbol] -= sell.quantity

    _.each(reports, function(r){
      if (r.onEquitySell) 
        r.onEquitySell(sell, banks, stocks);
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

    div.net = net

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
    , invoices = {}

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (acct.typ== 'stock-buy' || acct.typ == 'etf-buy' || acct.typ == 'mutfund-buy'){
      equityBuy(acct, stocks, banks);
    }

    if (acct.typ == 'sell' || acct.typ== 'stock-sell' || acct.typ == 'etf-sell' || acct.typ == 'mutfund-sell'){
      equitySell(acct, stocks, banks);
    }

    if (acct.typ == 'dividend'){
       dividend(acct, stocks, banks)
    }
  
    if (acct.typ == 'statement'){
      statement(acct, banks)
    }
  
    if (acct.typ == 'transaction'){
      transaction(acct, banks, stocks, invoices)
    }  
    
    if (acct.typ == 'invoice'){
      invoice(acct, banks, stocks, invoices)
    }  
  
  }

  _.each(reports, function(r){
    if (r.onComplete) 
      r.onComplete(banks, stocks, invoices);
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
    , cen = exports.pad(Math.round((v % 1) * 100), 2, '0')
    , dols = (dol + '').replace(/(\d)(?=(\d\d\d)+$)/, "$1,")
    , str = (curr || "$") + dols + "." + Math.abs(cen)
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

// unrealised $ gain of stock
exports.stockGain = function(stock){
 return stock.quantity * stock.current - stock.cost_basis
}


var FINANCE_URL ='http://www.google.com/finance/info?client=ig&q='
exports.loadPrices = function(stocks, cb){
  if (Object.keys(stocks).length == 0){
    return cb({})
  }
  request.get({uri:FINANCE_URL + _(stocks).keys().join(',')}, function(err, resp, body){
      if (!body) throw "Could not get data from API"
      
      var finances = JSON.parse(body.slice(3))

       _.each(finances, function(v, k){
         stocks[v.t].current = v.l_cur.replace('\$', '')
         stocks[v.t].change = v.c
         stocks[v.t].change_percent = v.cp
       })

       cb(stocks)
    })
}


