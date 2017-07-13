var ac = require('../accountant')  
  , utils = require('../utils')

var currmonth = null;
var currmonthData = {}
var currmonthCategories = {}


var onMonth = function(m){
  console.log(m, ": ",  utils.$(currmonthData.income), ",", utils.$(-1 * currmonthData.outgoing), currmonthCategories)
}

var checkMonth = function(mon){
  if (mon == currmonth){
  } else {
    if (currmonth) onMonth(currmonth);

    currmonth = mon;
    currmonthData.income = 0
    currmonthData.outgoing = 0
    currmonthCategories = {}

  }
}

module.exports = function(opts){
  return {
    onComplete: function(ev, state){
      checkMonth("-");
    }
    , onTransaction: function(t, state){
      var banks = state.banks, stocks = state.stocks
      checkMonth(t.date.slice(0, 7));

      if (banks[t.src].last_statement){
        if (!banks[t.dest].last_statement){
          currmonthData.outgoing += t.amount
          var cat = t.category || t.dest
          if (!currmonthCategories[cat])
            currmonthCategories[cat] = 0
          currmonthCategories[cat] += t.amount
        }
      } else {
        currmonthData.income += t.amount
      }

    }
  , onEquityBuy: function(buy){
    checkMonth(buy.date.slice(0, 7));
    currmonthData.outgoing -= buy.cb;
    if (currmonthData.outgoing < 0) currmonthData.outgoing = 0
    // Hacky - basically don't include stock purchases as 'outgoing' transactions
    // by reversing the amount
  }
  , onDividend: function(d){
      checkMonth(d.date.slice(0,7));
      currmonthData.income += d.net;
    }
  }
}
