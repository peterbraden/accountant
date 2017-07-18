var ac = require('../accountant')  


var newYear = function(){
  return {
    income: 0
  , capgains: 0
  , div: 0
  , spend: 0
  }
}

var curr 

module.exports = {

  onStart: function(e, state){
    state.years = {}
  }

, onYear: function(year, state){
    if (curr) {
      state.years[curr.year] = curr
    }
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
, onComplete: function(ev, state){
    if (!state.years){
      throw new Error('No current year - have not encountered any dates')
    }
    state.years[curr.year] = curr
  }
}
