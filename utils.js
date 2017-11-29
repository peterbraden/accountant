var request = require('request')
  , _ = require('underscore')
  , marketData = require('./lib/data')



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

// Value, colored)
exports.v = function(v){
  return exports.c(exports.r2(v))
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

// unrealised $ gain of stock
exports.stockGain = function(symbol, stock, stocks){
  return stock.position * stocks[symbol].current - stock.costbasis
}

exports.loadPrices = marketData.loadPrices
