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
  , currency = require('../lib/currency')


var newYear = function(){
  return {
    income: []
  , capgains: []
  , dividends: []
  , expenditure: []
  , net: []
  , accts: []
  }
}

var currYr, currMonth 

module.exports = {

  onStart: function(e, state){
    state.years = {}
    state.months = {}
  }

, onYear: function(year, ev, state){
    if (currYr) {
      state.years[currYr.year] = currYr

      var changes = state.years[currYr.year].changes = {}
      Object.keys(state.banks).forEach(function(bank){
        var prev = state.years[currYr.year].startAccts[bank] || {balance: 0}
        changes[bank] = state.banks[bank].balance - prev.balance
        if (changes[bank] == 0 || state.banks[bank].last_statement){
          delete changes[bank]
        }
      })
    }
    currYr = newYear()
    currYr.year = year
    currYr.startAccts = JSON.parse(JSON.stringify(state.banks))
  }

, onMonth: function(month, ev, state) {
    if (currMonth) {
      state.months[currMonth.month] = currMonth

      var changes = state.months[currMonth.month].changes = {}
      Object.keys(state.banks).forEach(function(bank){
        var prev = state.months[currMonth.month].startAccts[bank] || {balance: 0}
        changes[bank] = state.banks[bank].balance - prev.balance
        if (changes[bank] == 0 || state.banks[bank].last_statement){
          delete changes[bank]
        }
      })
    }
    currMonth = newYear()
    currMonth.month = month
    currMonth.startAccts = JSON.parse(JSON.stringify(state.banks))
}

, onTransaction: function(t, state){
    if (t.src == 'transfer' || t.dest == 'transfer') { return }
    if (state.banks[t.src].last_statement && state.banks[t.dest].last_statement ) { return }
    if (state.banks[t.src].last_statement){
      if (!state.banks[t.dest].last_statement){
        currency.add(currYr.expenditure, - t.amount, t.currency)
        currency.add(currYr.net, - t.amount, t.currency)
        currency.add(currMonth.expenditure, - t.amount, t.currency)
        currency.add(currMonth.net, - t.amount, t.currency)
      }
    } else {
      currency.add(currYr.income, t.amount, t.currency)
      currency.add(currYr.net, t.amount, t.currency)
      currency.add(currMonth.income, t.amount, t.currency)
      currency.add(currMonth.net, t.amount, t.currency)
    }
  }
, onDividend: function(d){
    currency.add(currYr.dividends, d.net, d.currency) 
    currency.add(currYr.net, d.net, d.currency)
    currency.add(currMonth.dividends, d.net, d.currency) 
    currency.add(currMonth.net, d.net, d.currency)
  }
, onEquitySell: function(sell, state){
    currency.add(currYr.capgains, sell.value - sell.costbasis, sell.currency || state.banks[sell.account].currency) 
    currency.add(currYr.net, sell.value - sell.costbasis, state.banks[sell.account].currency)
    currency.add(currMonth.capgains, sell.value - sell.costbasis, sell.currency || state.banks[sell.account].currency) 
    currency.add(currMonth.net, sell.value - sell.costbasis, state.banks[sell.account].currency)
  }
, onComplete: function(ev, state){
    if (!state.years){
      throw new Error('No current year - have not encountered any dates')
    }
    module.exports.onYear(null, ev, state)
    module.exports.onMonth(null, ev, state)
  }
}
