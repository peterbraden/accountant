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
  if (!stock.chunks || stock.chunks.length == 0)
    return 0
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

      try {
        var finances = JSON.parse(body.slice(3))
      } catch (e){
        console.log("Error parsing API Response:", body)
      }

       _.each(finances, function(v, k){
         stocks[v.t].current = v.l_cur.replace('\$', '').replace(',', '')
         stocks[v.t].change = v.c
         stocks[v.t].change_percent = v.cp
       })

       cb(stocks)
    })
}


