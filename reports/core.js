module.exports =  {
  onStart: (ev, state) => {
    state.banks = {}
  },

  onTransaction: (t, state) => {
    var banks = state.banks

    banks[t.src] = banks[t.src] || {balance:0}
    banks[t.dest] = banks[t.dest] || {balance:0}
  
    banks[t.src].balance -= t.amount
    banks[t.dest].balance += t.amount
  
    banks[t.src].currency = t.currency
    banks[t.dest].currency = t.currency
  },

  onStatement: (statement, state) => { 
    var banks = state.banks
    banks[statement.account] = banks[statement.account] || {}

    banks[statement.account].currency = statement.currency
    banks[statement.account].balance = statement.balance
    banks[statement.account].last_statement = statement.date
  }
}
