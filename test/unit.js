var test = require('tape')
var acct
var equity = require('./equities.spec.js')

var MOCK = __dirname + '/mocks.json'
var MOCKERRORS = __dirname + '/mocks-errors.json'
var MULTICURRENCY = __dirname + '/mocks-multicurrency.json'

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

test('runs reports / events in correct order', (t) => {
  var preStatement = 'not-called'
  var statement = 'no'

  acct.reset()
  acct.registerReport({
    onPreStatement: () => {
      preStatement = 'called by first report'
      statement = 'pre'
    }
  , onStatement: () => {
      statement = 'correct'
    }
  })
  acct.registerReport({
    onPreStatement: () => {
      preStatement = 'called by second report'
    }
  })
  acct.registerReport({
    onStatement: () => {
      t.equal(preStatement, 'called by second report')
      t.equal(statement, 'correct')
    }
  , onComplete: () => {
      t.equal(preStatement, 'called by second report')
      t.equal(statement, 'correct')
      t.end()
    }
  })
  acct.runFile(MOCK)
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
      t.equal(state.banks.mybank.balance, 1843.84)
      complete = true
    }
  })

  acct.runFile(MOCK)

  t.equal(_statements, 4)
  t.equal(complete, true)
  t.end()
})


test('example file', (t) => {
  acct.reset()
  acct.registerReport({ onStart: (e, state) => {state.silent = true }})
  acct.registerReport([require('../reports/list-account')({})])
  acct.runFile('./example-accounts.json')
  t.end()
})


test('validate errors', (t) => {
  acct.reset()
  acct.registerReport({ onStart: (e, state) => {state.silent = true }})
  acct.registerReport({
    onComplete: (ev, state) => {
      t.equal(state.errors.length, 2)
      t.end()
    }
  })
  acct.runFile(MOCKERRORS)
})


test('multicurrency addition', (t) => {
  acct.reset()
  acct.registerReport({ onStart: (e, state) => {state.silent = true }})
  acct.registerReport({
    onComplete: (ev, state) => {
      t.equal(state.errors.length, 1)
      t.equal(state.errors[0].message, 'Transaction does not match src currency:mybank')
      t.end()
    }
  })
  acct.runFile(MULTICURRENCY)
})
