var test = require('tape')
var acct

var MOCK = __dirname + '/mocks.json'

test('import', (t) => {
  acct = require('../accountant')
  t.ok(acct)
  t.end()
})

test('register empty report', (t) => {
  acct.registerReport({})
  acct.run([])
  t.end()
})

test('basic transactions report', (t) => {
  var _transactions = 0

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

test('stock buy', (t) => {
  var buys = 0
  acct.registerReport({
    onEquityBuy: (buy, state) => {
      buys ++
    } 
  })

  acct.run(MOCK)

  t.equal(buys, 6)
  t.end()
})
