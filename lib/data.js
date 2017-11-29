// Get as much market data from public API's as possible and cache it
//
//
var fs = require('fs')
var request = require('request')

var PRICES_CACHE
  , CACHE = 'prices.json'

var readCache = function(){
  try {
    PRICES_CACHE = JSON.parse(fs.readFileSync(CACHE))
  } catch (e) {
    console.log("> Creating cache")
    PRICES_CACHE = {}
    writeCache()
  }
}

var writeCache = function(){
  fs.writeFileSync(CACHE, JSON.stringify(PRICES_CACHE, null, 2), 'utf8')
}


var FINANCE_URL ='https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&apikey=V6SYILY9FKBD0YKI&symbol='

var loadPrice = function(stocks, symbol, cb){
  var method = apiLoadPrice
  if (cacheHasPrice(symbol)) {
    method = cacheLoadPrice
  }
  method(stocks, symbol, cb)
}

var apiLoadPrice = function(stocks, symbol, cb){
  console.log("Getting market data for", symbol)
  request.get({uri:FINANCE_URL + symbol}, function(err, resp, body){
    if (err) throw err
    if (!body) throw "Could not get data from API"
    var finances = JSON.parse(body)
    var data = finances["Time Series (Daily)"]
    if (!data) {
      //throw new Error('Missing data: ' + body + ' ' + symbol)
      console.log("# ERR. Missing data: " + body + ' ' + symbol)
      return cb(stocks)
    }
    var dates = Object.keys(data || {})
    dates.sort()
    var latest = dates.pop()
    var prev = dates.pop()
    if (!data || !data[latest]){
      console.log("Missing dates?", finances, data, symbol)
    }

    PRICES_CACHE[symbol] = PRICES_CACHE[symbol] || { daily: {} }
    PRICES_CACHE[symbol].latest = latest

    Object.keys(data).forEach(function(date, i){
      var record = PRICES_CACHE[symbol].daily[date] = {}
      record.open = data[date]["1. open"]
      record.high = data[date]["2. high"]
      record.low = data[date]["3. low"]
      record.close = data[date]["4. close"]
      record.adjusted_close = data[date]["4. close"]
      record.dividend = data[date]["4. close"]
      record.split = data[date]["4. close"]
      record.change = record.close - record.open
      record.change_percent = record.change / record.close
    })
    writeCache()
    cb(stocks)
  })
}

var cacheLoadPrice = function(stocks, symbol, cb){
  var s = PRICES_CACHE[symbol]
  s = s.daily[s.latest]
  stocks[symbol].current = s.close
  stocks[symbol].change = s.change
  stocks[symbol].change_percent = s.change_percent
  cb(stocks)
}

var cacheHasPrice = function(symbol){
  if (PRICES_CACHE[symbol]){
    var inLastDay = (new Date() - new Date(PRICES_CACHE[symbol].latest)) < 1000*60*60*24*5 // 5 days
    return inLastDay
  }
  return false
}


// Recursively iterate async load of stocks[i]..
var loadInd = function(stocks, i, cb){
  loadPrice(stocks, Object.keys(stocks)[i], function(){
    if (i + 1 < Object.keys(stocks).length){
      loadInd(stocks, i + 1, cb)
    } else {
      cb(stocks)
    }
  })
}



exports.loadPrices = function(stocks, cb){
  readCache()
  if (Object.keys(stocks).length == 0){
    return cb({})
  }
  loadInd(stocks, 0, function(){
    cb(stocks)
  })
}


