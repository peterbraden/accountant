var request = require('request')
  , mustache = require('mustache')
  , _ = require('underscore')
  , fs = require('fs')
  , path = require('path')

var HIST_URL = "http://www.google.com/finance/historical?q={{ stock }}&output=csv"
  , MONTHS = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:11,Dec:12}
  , CACHE_PATH = 'hist-stock-data.json'



var getCache = function(){
  try{
    var f = fs.readFileSync(CACHE_PATH, 'utf8')
      , data = JSON.parse(f);
    return data         
  } catch (e){
    console.log("no cache")
    return {}
  }
}

var setCache = function(data){
  var json = JSON.stringify(data, null, 1)
  fs.writeFileSync(CACHE_PATH, json, 'utf8')
}

var updateCacheBulk = function(symbol, data){
  var c = getCache()
  c[symbol] = c[symbol] || {};
  console.log(symbol, ":", _.size(data))
  _.each(data, function(v, k){
    c[symbol][k] = v
  })
  setCache(c)
}

/*
var cacheSymbolTime = function(symbol, date, value){
  var c = getCache()
  c[symbol] = c[symbol] || {};
  c[symbol][date] = value
  setCache(data)
}
*/


var getRemote = function(symbol, start, end, cb){
  request.get(
      mustache.to_html(HIST_URL
        , {
            stock : 'GOOG'
          , start : start
          , end : end
        })
    , function(err, resp, body){
        var rows = body.split('\n')
          , out = {}
  
        _.each(rows, function(r, i){
          var hist = r.split(',')
            , date = hist[0]
            
          date = date.split('-')
          date = '20' + date[2] + '-' + MONTHS[date[1]] + '-' + ((date[0] < 10) ? ('0' + date[0]):(date[0]))
          
          if (!hist[1] || hist.length < 4 || !parseFloat(hist[1])){
            return
          }  
          
          out[date] = {
            open : parseFloat(hist[1])
          , high : parseFloat(hist[2])
          , low : parseFloat(hist[3])
          , close : parseFloat(hist[4])
          , volume : parseFloat(hist[5])
          }
        })  
        
        updateCacheBulk(symbol, out);     
        cb(out)   
    })
}    


exports.getData = function(symbol, cb){
  var c = getCache()
  
  if (c[symbol]){
    cb(c[symbol])
    return;
  }
  
  getRemote(symbol, undefined, undefined, cb);
}

exports.listCache = function(){
  var c = getCache();
  _.each(c, function(v, symbol){
    var dates = _.keys(v);
    
    dates.sort()
    
    _.each(dates, function(date, i){
      dates[i] = new Date(date.slice(0,4), parseInt(date.slice(5, 7))-1, date.slice(8,10))
    })
    
    var got = ''
    
    var prev = dates[0]
    _.each(dates, function(d, i){
      if (i > 0 && (d - dates[i-1]) > (1000*60*60*24)){
        if (!(d.getDay()==1 && dates[i-1].getDay() == 5)){
          got += prev.toISOString().slice(0,10) + ' - ' + dates[i-1].toISOString().slice(0,10) + ','
          prev = d          
        }
      }
    })
    console.log(symbol
      , ':'
      , dates.length
      , "(", dates[0].toISOString().slice(0,10)
      , '-', dates[dates.length-1].toISOString().slice(0,10)
      , ')')
  })

}

exports.getData('MAIN', console.log)
exports.listCache();

