
var checkDate = function(d, state){
  if (state.lastDate !== null && d < state.lastDate){
    var msg = "Out of order date: " + d
    console.log("# Validation error:", msg);
    state.errors.push(new Error(msg))
  }
  state.lastDate = d
}

module.exports = {

  onStart: function(e, state){
    state.lastDate = null
    state.errors = []
  }

, onEvent: function(typ, ev, state){
    if (ev && ev.date) {
      checkDate(ev.date, state)
    }
  }

, onPreStatement : function(acct, state){
    if (state.banks[acct.account] && state.banks[acct.account].last_statement){
      // Check if statements match transaction totals
      if (Math.abs(state.banks[acct.account].balance - acct.balance) > 0.01){
        var msg = "Accounts for " + acct.account
        msg += " in " + state.banks[acct.account].last_statement +  " to " +  acct.date
        msg += " differ by " + (state.banks[acct.account].balance - acct.balance).toFixed(3)
        msg += " (" + state.banks[acct.account].balance + " , s:" + acct.balance + ")"
        console.log("# Validation error:", msg)
        state.errors.push(new Error(msg))
      }
    }
  }
}
