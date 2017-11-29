"use strict"
var utils = require('../utils')

class Equity {
  constructor(){
    this.symbol = null
    this.position = 0
    this.costbasis = 0
    this.dividend = 0
    this.maxAge = null
  }

  update(e) {
    this.position = e.quantity 
    this.etf = this.etf || e.etf 
    this.asset_class = e.asset_class || this.asset_class
    this.industry = e.industry || this.industry
    this.costbasis = e.costbasis || this.costbasis
  }
}

class AggregateEquity {
  constructor(){
    this.position = 0
    this.costbasis = 0
    this.dividend = 0
    this.maxAge = null
    this.industry = '?'
    this.asset_class = 'Unclassed'
  }

  update(s) {
    this.position += s.position
    this.costbasis += s.costbasis
    this.dividend += s.dividend
    this.etf = this.etf || s.etf
    this.asset_class = s.asset_class || this.asset_class
    this.industry = s.industry || this.industry
    if (!this.maxAge) {
      this.maxAge = s.maxAge
    } else {
      this.maxAge = parseInt(s.maxAge.replace('-', '')) <
                    parseInt(this.maxAge.replace('-', '')) 
                          ? s.maxAge: this.maxAge
      }
  }
}

var updateOrCreateBank = function(b) {
  b = b || {}
  b.balance = b.balance || 0
  b.equities = b.equities || {} 
  return b
}

var aggregateStocks = function(state) {
  state.stocks = {}
  Object.keys(state.banks).forEach( (b) => {
    var bank = state.banks[b]
    Object.keys(bank.equities).forEach( (sym) => {
      var s = bank.equities[sym]
      var aggregate = state.stocks[sym] = state.stocks[sym] || new AggregateEquity()
      aggregate.update(s)
    })
  })
  return state.stocks
}

module.exports = {
  onStart: (ev, state) => {
    if (!state.banks)
      throw new Error('requires core report')
    aggregateStocks(state)
  }

, onBrokerageStatement: function(statement, state){
    var bank = state.banks[statement.account] 
    Object.keys(statement.holdings).forEach( (symbol) => {
      bank.equities[symbol].update(statement.holdings[symbol])
    })
    aggregateStocks(state)
  }

  , onEquityBuy: function(buy, state){
      var banks = state.banks
      var bank = updateOrCreateBank(state.banks[buy.account])
      var costbasis = ((buy.quantity * buy.cost) + buy.commission)
      if (buy.gross){
        costbasis = (buy.gross + buy.commission)
        buy.cost = buy.gross / buy.quantity  
      }

      buy.costbasis = costbasis
      bank.balance -= costbasis

      var stock = bank.equities[buy.symbol]
      if (!stock){
        var stock = bank.equities[buy.symbol] = new Equity()
        stock.symbol = buy.symbol
      }
      stock.maxAge = stock.maxAge || buy.date
      stock.position += buy.quantity 
      stock.costbasis += costbasis 
      stock.etf = stock.etf || buy.typ == 'etf-buy' 
      stock.asset_class = buy.asset_class || stock.asset_class
      stock.industry = buy.industry || stock.industry
      bank.trading = true

      aggregateStocks(state)
    },

  onEquitySell: function(sell, state){
    var banks = state.banks
    var bank = state.banks[sell.account] = updateOrCreateBank(state.banks[sell.account])
    var s = bank.equities[sell.symbol]
    if (!s)
      throw "Selling equity that does not exist"

    var amount;
    if (sell.hasOwnProperty('gross')){
      amount = sell.gross - sell.commission
    } else { // Price
      amount = (sell.quantity * sell.price) - sell.commission
    }

    sell.value = amount
    var costbasis = 0 // TODO - CALCULATE COSTBASIS

    bank.balance += amount
    bank.equities[sell.symbol].position -= sell.quantity
    bank.equities[sell.symbol].costbasis -= costbasis

    if (bank.equities[sell.symbol].position == 0){
      delete bank.equities[sell.symbol]
    }
    aggregateStocks(state)
  }

, onDividend: function(div, state){
    var banks = state.banks 
      , net

    var bank = state.banks[div.account] = updateOrCreateBank(state.banks[div.account])
      , s = bank.equities[div.symbol]

    if (div.amount){
      net = bank.equities[div.symbol].position * div.amount
    } else {
      net = div.gross
    }

    div.net = net

    if (s) {// may have sold already...
      s.dividend += net
    }

    banks[div.account] = banks[div.account] || {}
    banks[div.account].balance += net
    banks[div.account].trading = true
    aggregateStocks(state)
  }  

  , onEquityTransfer: function(transfer, state){
    var src = state.banks[transfer.src]
      , dest = state.banks[transfer.dest]

    if (!dest.equities[transfer.symbol]) {
      dest.equities[transfer.symbol] = new Equity()
      dest.equities[transfer.symbol].symbol = transfer.symbol
    }

    var costbasis = 0, dividend = 0
    if (src.equities[transfer.symbol].position == transfer.quantity) {
      // Transferring all
      costbasis = src.equities[transfer.symbol].costbasis
      dividend = src.equities[transfer.symbol].dividend
    } else {
      costbasis = undefined // TODO
      dividend = undefined
    }

    src.equities[transfer.symbol].position -= transfer.quantity
    src.equities[transfer.symbol].costbasis -= costbasis
    src.equities[transfer.symbol].dividend -= dividend

    dest.equities[transfer.symbol].position += transfer.quantity
    dest.equities[transfer.symbol].costbasis += costbasis
    dest.equities[transfer.symbol].dividend += dividend
    dest.equities[transfer.symbol].maxAge = src.equities[transfer.symbol].maxAge


    if (src.equities[transfer.symbol].position == 0) {
      delete src.equities[transfer.symbol]
    }
    aggregateStocks(state)
  }
  
, onDividendReinvestment: function(div, state){
    var bank = state.banks[div.account]
    bank.equities[div.symbol].position += div.quantity
    aggregateStocks(state)
  }
}

