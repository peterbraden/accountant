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

  acct.run(MOCK)

  t.equal(_transactions, 5)
  t.end()
})

test('basic statements', (t) => {
  acct.reset()
  var _statements = 0

  acct.registerReport({
    onStatement: (statement, state) => {
      _statements ++
    }
  })

  acct.run(MOCK)

  t.equal(_statements, 3)
  t.end()
})

test('stock buy / sell', (t) => {
  acct.reset()
  var buys = 0, sells = 0
  var complete = false

  acct.registerReport({
    onEquityBuy: (buy, state) => {
      buys ++
    },
    onEquitySell: (sell, state) => {
      sells ++
    },
    onComplete: (ev, state) => {
      complete = true
      t.equal(state.stocks.MCD.quantity, 10)
      t.equal(state.stocks.VTI.quantity, 15)
      t.equal(state.stocks.MCD.costbasis, 969.4)
      //TODO t.equal(state.stocks.VTI.costbasis, 4 * (10 * 60 + 10) - (25 * 60))
    }
  })

  acct.run(MOCK)

  t.equal(buys, 6)
  t.equal(sells, 2)
  t.equal(complete, true)
  t.end()
})
