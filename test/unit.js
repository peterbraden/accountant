var test = require('tape')
var acct

var MOCK = __dirname + '/mocks.json'

test('import', (t) => {
  acct = require('../accountant')
  t.ok(acct)
  t.end()
})

test('register empty report', (t) => {
  acct.reset()
  acct.registerReport({})
  acct.run([])
  t.end()
})

test('basic transactions report', (t) => {
  var _transactions = 0
  acct.reset()

  acct.registerReport({
    onTransaction: (transaction, state) => {
      _transactions ++
      t.ok(transaction.src)
      t.ok(transaction.dest)
    }
  })

  acct.runFile(MOCK)

  t.equal(_transactions, 5)
  t.end()
})

test('basic statements', (t) => {
  acct.reset()
  var _statements = 0, complete = false

  acct.registerReport({
    onStatement: (statement, state) => {
      _statements ++
      t.ok(state.banks)
    },
    onComplete: (ev, state) => {
      t.equal(state.banks.mybank.last_statement, '2017-05-04', 'last statement')
      t.equal(state.banks.mybank.balance, 3917.52)
      complete = true
    }
  })

  acct.runFile(MOCK)

  t.equal(_statements, 3)
  t.equal(complete, true)
  t.end()
})

test('stock buy / sell / dividends', (t) => {
  acct.reset()
  var buys = 0, sells = 0, dividends = 0
  var complete = false

  acct.registerReport({
    onEquityBuy: (buy, state) => {
      buys ++
    },
    onEquitySell: (sell, state) => {
      sells ++
    },
    onDividend: (div, state) => {
      dividends ++
    },
    onComplete: (ev, state) => {
      complete = true
      t.equal(state.stocks.MCD.quantity, 10)
      t.equal(state.stocks.VTI.quantity, 15)
      t.equal(state.banks.mybank.positions.VTI, 15)
      t.equal(state.stocks.MCD.costbasis, 969.4)
      t.equal(state.stocks.MCD.dividend, 2.57)
      t.equal(state.stocks.VTI.dividend, 15 * 0.12)
      //TODO t.equal(state.stocks.VTI.costbasis, 4 * (10 * 60 + 10) - (25 * 60))
    }
  })

  acct.runFile(MOCK)

  t.equal(buys, 6)
  t.equal(sells, 2)
  t.equal(complete, true)
  t.equal(dividends, 2)
  t.end()
})


