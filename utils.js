var request = require('request')
  , _ = require('underscore')

// === Utility Functions ===

// Color a value
exports.c = function(v, pre, post){
  var str = (pre || '') + v + (post || '')
  
  str = (parseFloat(v)>=0) ? str.green : str.red  
  
  return str
}  


// Render a value in currency
exports.$ = function(v, curr){
  var val = parseInt(v*100)/100
    , dol = parseInt(val)
    , cen = exports.pad(Math.round((v % 1) * 100), 2, '0')
    , dols = (dol + '').replace(/(\d)(?=(\d\d\d)+$)/, "$1,")
    , str = (curr ? (curr + ' ') : '$') + dols + "." + Math.abs(cen)
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
  if (!stock.chunks || stock.chunks.length == 0)
    return 0
 return parseInt((new Date().getTime() - new Date(stock.chunks[0].date).getTime())/(1000*3600*24))
}

// unrealised $ gain of stock
exports.stockGain = function(stock){
 return stock.quantity * stock.current - stock.costbasis
}


var FINANCE_URL ='https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&apikey=V6SYILY9FKBD0YKI&symbol='
exports.loadPrices = function(stocks, cb){
  if (Object.keys(stocks).length == 0){
    return cb({})
  }
  var count = 0;
  _(stocks).keys().forEach(function(symbol, i){
    request.get({uri:FINANCE_URL + symbol}, function(err, resp, body){
      if (err) throw err
      if (!body) throw "Could not get data from API"
      var finances = JSON.parse(body)
      var data = finances["Time Series (Daily)"]
      var dates = Object.keys(data || {})
      dates.sort()
      var latest = dates.pop()
      var prev = dates.pop()
      stocks[symbol].current = data[latest]["4. close"]
      stocks[symbol].change = data[latest]["4. close"] - data[prev]["4. close"]
      stocks[symbol].change_percent = stocks[symbol].change / stocks[symbol].current
      count++
      if (count == Object.keys(stocks).length) {
        cb(stocks)
      }
    })
  })
}


