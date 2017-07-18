/*

Add state.year = {
  2001: {
    year: 2001
  , income: [{value: 5000, currency: 'USD'}]
  , capgains: [{value: 5000, currency: 'USD'}]
  , dividends: 
  , expenditure: 
  , net:
  }
}

 */

var ac = require('../accountant')  


var newYear = function(){
  return {
    income: []
  , capgains: []
  , dividends: []
  , expenditure: []
  , net: []
  }
}

var curr 

var currencyAdd = (multi, value, currency) => {
  var found = false
  multi.forEach( (amount) => {
    if (amount.currency == currency) {
      found = true
      amount.value += value
    }
  })
  if (!found) {
    multi.push({
      currency: currency
    , value: value
    })
  }
}

module.exports = {

  onStart: function(e, state){
    state.years = {}
  }

, onYear: function(year, ev, state){
    if (curr) {
      state.years[curr.year] = curr
    }
    curr = newYear()
    curr.year = year
  }

, onTransaction: function(t, state){
    if (state.banks[t.src].last_statement){
      if (!state.banks[t.dest].last_statement){
        currencyAdd(curr.expenditure, t.amount, state.banks[t.dest].currency)
        currencyAdd(curr.net, - t.amount, state.banks[t.dest].currency)
      }
    } else {
      currencyAdd(curr.income, t.amount, t.currency)
      currencyAdd(curr.net, t.amount, t.currency)
    }
  }
, onDividend: function(d){
    currencyAdd(curr.dividends, d.net, d.currency) 
    currencyAdd(curr.net, d.net, d.currency)
  }
, onEquitySell: function(sell, state){
    currencyAdd(curr.capgains, sell.value - sell.costbasis, sell.currency || state.banks[sell.account].currency) 
    currencyAdd(curr.net, sell.value - sell.costbasis, state.banks[sell.account].currency)
  }
, onComplete: function(ev, state){
    if (!state.years){
      throw new Error('No current year - have not encountered any dates')
    }
    state.years[curr.year] = curr
  }
}
