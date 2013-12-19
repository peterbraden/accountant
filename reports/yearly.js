var ac = require('../accountant')  
  , Table = require('cli-table')
  , _ = require('underscore')

var COLS = {
  year : {title: "Year", ind: -1}
, spend: {title: "Expenditure", ind: 3}
, income: {title : "Income", ind :0}
, capgains: {title: "Rlsd CapGn", ind: 1}
, div: {title: "Dividends", ind: 2}
, tot: {title: "Total"}
}



var newYear = function(){
  return {
    income: 0
  , capgains: 0
  , div: 0
  , spend: 0
  }
}

var curr 
  , _yr 
  , data = {}

var checkYear = function(yr){
  if (yr != _yr){
    if (_yr)
      data[_yr] = curr
    _yr = yr
    curr = newYear()
  }
}

module.exports = function(opts){
  return {
    onTransaction: function(t, banks, stocks){
      checkYear(t.date.slice(0, 4))
      if (banks[t.src].last_statement){
        if (!banks[t.dest].last_statement){
          curr.spend += t.amount
        }
      } else {
        curr.income += t.amount
      }
    }
  , onDividend: function(d){
      checkYear(d.date.slice(0, 4))
      curr.div += d.net
  }
  , onEquitySell: function(sell, stock){
      checkYear(sell.date.slice(0, 4))
      curr.capgains += sell.value + stock.dividend - sell.cb
  }
  , onComplete: function(banks, stocks){
      checkYear('-')
      var t = new Table({
          head : _.map(COLS, function(v, k){return v.title})
        , style : {compact: true, 'padding-left':1, head: ['cyan']} 
      })
      _.each(data, function(x, yr){
        t.push([
            yr
          , ac.$(-1*x.spend)
          , ac.$(x.income)
          , ac.$(x.capgains)
          , ac.$(x.div)
          , ac.$(x.income + x.div + x.capgains - x.spend)
          ])
      })
      console.log(t.toString())
    }
  }
}
