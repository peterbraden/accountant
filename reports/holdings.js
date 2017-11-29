var table = require('../lib/table')
  , _ = require('underscore')
  , ac = require('../accountant') 
  , utils = require('../utils')

var COLS = [
  {title : "Asset", property: 'asset'}
, {title : "CB Val", property: 'costbasis'}
, {title: "Curr Val", property: 'value'}
  //, cbprop: {title : "CB % Equity", ind: 2}
, {title : "CB % Net", property: 'costbasisPerNet'}
, {title : "Val % Net", property: 'valuePerNet'}
] 
  
module.exports = function(opts){
  return {
    onComplete: function(ev, state){
      var data = []
      var banks = state.banks, stocks = state.stocks
      utils.loadPrices(stocks, function(stocks){

      var assets = []
        , net_worth = 0
        , net_equity = 0
        , cash = 0
        , total_worth = 0

      _.each(banks, function(b, k){
        if (!b.balance || !b.last_statement) return;

        cash += b.balance
        net_worth += b.balance
        total_worth += b.balance
      })

      assets.push({
          symbol: "Cash".yellow
        , current: 1
        , costbasis: cash
        , position: cash
      })

      _.each(stocks, function(s, symbol){
        s.symbol = symbol  
        s.equity = true
        assets.push(s);
        net_worth += s.costbasis
        net_equity += s.costbasis
        total_worth += s.current * s.position

      })

      assets.sort(function(a, b){
        return (b.current*b.position) - (a.current*a.position)
      })

      _.each(assets, function(x){
        data.push({
          asset: x.symbol
        , costbasis: utils.c(x.costbasis)
        , equity: x.equity ? utils.c(x.costbasis/net_equity*100) : '-'
        , value: utils.c(x.current * x.position)
        , costbasisPerNet: utils.c(x.costbasis/net_worth*100)
        , valuePerNet: utils.c(x.current*x.position/total_worth*100)
        })
      })

      if (opts.format == 'csv') {
        console.log('asset, cost basis, number')
        assets.forEach(function (asset) {
          console.log(asset.symbol, ', ', asset.cost_basis / asset.position, ', ', asset.position)
        
        })
      } else {
        console.log(table.createTable(COLS, data).toString())
      }

    })
    }
  }
}
