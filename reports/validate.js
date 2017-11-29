var DELTA = 0.01

var addError = function(d, error, state){
  if (!state.silent) {
    console.log('# ERR:', d, error.message)
  }
  state.errors.push(error)
}

var checkDate = function(d, state){
  if (state.lastDate !== null && d < state.lastDate){
    var msg = "Out of order date: " + d
    addError(d, new Error(msg), state)
  }
  state.lastDate = d
}

module.exports = {

  onStart: function(e, state){
    state.lastDate = null
    state.errors = []
    state.yearlyErrors = {}
  }

, onEvent: function(typ, ev, state){
    if (ev && ev.date) {
      checkDate(ev.date, state)
    }
  }

, onPreStatement : function(acct, state){
    if (state.banks[acct.account] && state.banks[acct.account].last_statement){
      // Check if statements match transaction totals
      if (Math.abs(state.banks[acct.account].balance - acct.balance) > DELTA){
        var msg = "Accounts for " + acct.account
        msg += " in " + state.banks[acct.account].last_statement +  " to " +  acct.date
        msg += " differ by " + (state.banks[acct.account].balance - acct.balance).toFixed(3)
        msg += " (" + state.banks[acct.account].balance + " , s:" + acct.balance + ")"
        addError(acct.date, new Error(msg), state)
      }
    }
  }

, onPreBrokerageStatement: function(statement, state){
    var account = statement.account
    var preHoldings = JSON.parse(JSON.stringify(state.banks[account].equities))
    var postHoldings = statement.holdings

    var holdingMatchError = (symbol, pre, post) => {
        var msg = "Accounts for " + account
        msg += " in " + state.banks[account].last_statement + " to " + statement.date
        msg += " differ in asset " + symbol + " quantity "
        msg += " (Pre statement: " +  pre
        msg += ", Statement: " + post + ")"
        addError(statement.date, new Error(msg), state)
    }

    Object.keys(postHoldings).forEach( (symbol) => {
      if (Math.abs(preHoldings[symbol] - postHoldings[symbol].quantity) > DELTA){
        holdingMatchError(symbol, preHoldings[symbol] || 0, postHoldings[symbol].quantity || 0)
      }
      delete preHoldings[symbol]
    })
    
    Object.keys(preHoldings).forEach( (symbol) => {
      holdingMatchError(symbol, preHoldings[symbol], 0)
    })
  }

, onTransaction(t, state){
    if (state.banks[t.src].currency && t.currency){
      if (state.banks[t.src].currency !== t.currency){
        addError(t.date, new Error('Transaction does not match src currency:' + t.src), state)
      }
    }
    if (state.banks[t.dest].currency && t.currency){
      if (state.banks[t.dest].currency !== t.currency){
        addError(t.date, new Error('Transaction does not match dest currency:' + t.dest), state)
      }
    }
  }
}
