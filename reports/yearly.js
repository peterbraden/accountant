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
  , data = {}


module.exports = function(opts){
  return {

    onYear: function(year, state){
      if (curr)
        data[curr.year] = curr
      curr = newYear()
      curr.year = year
    }

  , onTransaction: function(t, state){
      if (state.banks[t.src].last_statement){
        if (!state.banks[t.dest].last_statement){
          curr.spend += t.amount
        }
      } else {
        curr.income += t.amount
      }
    }
  , onDividend: function(d){
      curr.div += d.net
  }
  , onEquitySell: function(sell, stock){
      curr.capgains += sell.value + stock.dividend - sell.cb
  }
  , onComplete: function(state){
      if (!curr){
        throw new Error('No current year - have not encountered any dates')
      }
      data[curr.year] = curr
      var t = new Table({
          head : _.map(COLS, function(v, k){return v.title})
        , style : {compact: true, 'padding-left':1, head: ['cyan']} 
      })
      _.each(data, function(x, yr){
        t.push([
            yr
          , ac.utils.$(-1*x.spend)
          , ac.utils.$(x.income)
          , ac.utils.$(x.capgains)
          , ac.utils.$(x.div)
          , ac.utils.$(x.income + x.div + x.capgains - x.spend)
          ])
      })
      console.log(t.toString())
    }
  }
}
