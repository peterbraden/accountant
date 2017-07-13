var test = require('tape')
var acct

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
      t.equal(transaction.src, 'foo')
      t.equal(transaction.dest, 'bar')
    }
  })

  acct.run([
    {typ: 'statement'},
    {typ: 'transaction', src: 'foo', dest: 'bar'},
    {typ: 'transaction', src: 'foo', dest: 'bar'}
  ])

  t.equal(_transactions, 2)
  t.end()
})

test('basic statements', (t) => {
  var _statements = 0

  acct.registerReport({
    onStatement: (statement, state) => {
      _statements ++
    }
  })

  acct.run([
    {typ: 'statement'},
    {typ: 'transaction', src: 'foo', dest: 'bar'},
    {typ: 'statement'}
  ])

  t.equal(_statements, 2)
  t.end()
})
