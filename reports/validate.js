

module.exports = {

  onStart: function(e, state){
    state.errors = []
  }

, onPreStatement : function(acct, state){
    if (state.banks[acct.account] ){
      // Check if statements match transaction totals
      if (Math.abs(state.banks[acct.account].balance - acct.balance) > 0.01){
        var msg = "Accounts for " + acct.account
        msg += " in " + state.banks[acct.account].last_statement, "to", acct.date
        msg += " differ by " + (state.banks[acct.account].balance - acct.balance).toFixed(3)
        msg += " (" + state.banks[acct.account].balance + " , s:" + acct.balance + ")"
        console.log("Validation error: ".red, msg)
        state.errors.push(new Error(msg))
      }
    }
  }
}
