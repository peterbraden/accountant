var utils = require('../utils')

var updateOrCreateStock = function(s){
  s = s || {}
  s.quantity = s.quantity || 0
  s.dividend = s.dividend || 0
  s.costbasis =  s.costbasis || 0
  s.industry = s.industry || '?'
  s.asset_class = s.asset_class || '?'
  s.chunks = s.chunks || []
  return s
}

var updateOrCreateBank = function(b) {
  b = b || {}
  b.balance = b.balance || 0
  b.positions = b.positions || {}
  return b
}

module.exports = {
  onStart: (ev, state) => {
    if (!state.banks)
      throw new Error('requires core report')
    state.stocks = {}
  }
, onBrokerageStatement: function(statement, state){
    var bank = state.banks[statement.account] = updateOrCreateBank(state.banks[statement.account])

    Object.keys(statement.holdings).forEach(function(symbol){
      var holding = statement.holdings[symbol]
      bank.positions[symbol] = holding.quantity 
      var s = state.stocks[symbol] = updateOrCreateStock(state.stocks[symbol]) 
      // Multiple banks may hold this stock
      s.quantity += holding.quantity
      s.costbasis += holding.costbasis
      var simulatedBuy = {}
      simulatedBuy.date = statement.date
      s.chunks.push(simulatedBuy)
      
      // TODO
    })
    state.banks[statement.account] = bank
  }
  , onEquityBuy: function(buy, state){
      var banks = state.banks, stocks = state.stocks
      var s = updateOrCreateStock(stocks[buy.symbol])
      var bank = updateOrCreateBank(state.banks[buy.account])
      var costbasis = ((buy.quantity * buy.cost) + buy.commission)
      if (buy.gross){
        costbasis = (buy.gross + buy.commission)
        buy.cost = buy.gross / buy.quantity  
      }

      buy.costbasis = costbasis

      s.costbasis += costbasis
      s.quantity += buy.quantity
      s.industry = s.industry || buy.industry
      s.asset_class = s.asset_class || buy.asset_class
      s.chunks.push(buy)
      s.etf = (buy.typ =='etf-buy')
      s.mutual_fund = (buy.typ =='mutfund-buy')

      bank.balance -= costbasis

      if (!bank.positions[buy.symbol]){
        bank.positions[buy.symbol] = 0
      }
      bank.positions[buy.symbol] += buy.quantity 
      bank.trading = true

      state.stocks[buy.symbol] = s
      state.banks[buy.account] = bank
    },

  onEquitySell: function(sell, state){
    var banks = state.banks, stocks = state.stocks
    var bank = state.banks[sell.account] = updateOrCreateBank(state.banks[sell.account])
    var s = stocks[sell.symbol]
    if (!s)
      throw "Selling equity that does not exist"

    var amount;
    if (sell.gross){
      amount = sell.gross - sell.commission
    } else { // Price
      amount = (sell.quantity * sell.price) - sell.commission
    }

    sell.value = amount
    sell.age = utils.stockMaxAge(s); // TODO - work out avg age

    s.quantity = s.quantity - sell.quantity


    sell.costbasis = 0
    // FIFO
    for (var i = 0, j = sell.quantity; i< s.chunks.length && j > 0; i++){
      var chunk = s.chunks[i];
      if (chunk.quantity > j){
        chunk.quantity -= j;
        sell.costbasis += j * chunk.cost
        break;
      } else {
        s.chunks.splice(i, 1);
        sell.costbasis += chunk.quantity * chunk.cost
        j -= chunk.quantity;
        //TODO
      }
    }


    s.costbasis -= sell.costbasis
    stocks[sell.symbol] = s
    if (s.quantity == 0)
      delete stocks[sell.symbol]
    bank.balance += amount
    bank.positions[sell.symbol] -= sell.quantity
  }

, onDividend: function(div, state){
    var banks = state.banks 
      , stocks = state.stocks
      , s = state.stocks[div.symbol]
      , net

    var bank = state.banks[div.account] = updateOrCreateBank(state.banks[div.account])

    if (div.amount){
      net = bank.positions[div.symbol] * div.amount
    } else {
      net = div.gross
    }

    div.net = net

    if (s) // may have sold already...
      s.dividend += net
    banks[div.account] = banks[div.account] || {}
    banks[div.account].balance += net
    banks[div.account].trading = true
  }  
}

