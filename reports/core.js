"use strict"

class Bank {
  constructor(){
    this.balance = 0
    this.equities = {}
  }
}



module.exports =  {
  onStart: (ev, state) => {
    state.banks = {}
  },

  onTransaction: (t, state) => {
    var banks = state.banks

    banks[t.src] = banks[t.src] || new Bank() 
    banks[t.dest] = banks[t.dest] || new Bank()
  
    banks[t.src].balance -= t.amount
    banks[t.dest].balance += t.amount
  },

  onStatement: (statement, state) => { 
    var banks = state.banks
    banks[statement.account] = banks[statement.account] || new Bank()
    banks[statement.account].currency = statement.currency
    banks[statement.account].balance = statement.balance
    banks[statement.account].last_statement = statement.date
  }
}
