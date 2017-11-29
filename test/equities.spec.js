var test = require('tape')
var acct = require('../accountant')

test('stock buy / sell / dividends', (t) => {
  var buys = 0, sells = 0, dividends = 0
  var complete = false

  acct.registerReport({ onStart: (e, state) => {state.silent = true }})
  acct.registerReport({
    onEquityBuy: (buy, state) => {
      buys ++
    },
    onEquitySell: (sell, state) => {
      sells ++
      t.ok(sell.costbasis, 'cost basis added to sells')
    },
    onDividend: (div, state) => {
      dividends ++
    },
    onComplete: (ev, state) => {
      complete = true

      // Bank equity
      t.equal(state.banks.mybank.equities.VTI.position, 15)
      t.equal(state.banks.mybank2.equities.MCD.costbasis, 969.4)
      t.equal(state.banks.mybank2.equities.MCD.dividend, 2.57)
      t.equal(state.banks.mybank.equities.VTI.dividend, 15 * 0.12)
      t.equal(state.banks.mybank.equities.QQQ.maxAge, '2012-01-04') 
      t.equal(state.banks.mybank2.equities.QQQ.costbasis, 1150)
      // TODO test max age when FIFO first stocks sold.

      // Aggregate Equity
      t.equal(state.stocks.VTI.position, 15)
      t.equal(state.stocks.VTI.etf, true)
      t.equal(state.stocks.VTI.asset_class, 'US Stock Fund')
      t.equal(state.stocks.QQQ.maxAge, '2012-01-04')
    }
  })

  acct.runFile(__dirname + '/mocks.json')

  t.equal(buys, 8)
  t.equal(sells, 2)
  t.equal(complete, true)
  t.equal(dividends, 2)
  t.end()
})

