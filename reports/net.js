var  _ = require('underscore')
  , ac = require('../accountant') 
  , table = require('../lib/table')
  , convertToUSD = require('../lib/exchange').convertToUSD


module.exports = function(opts){
  return {

  onComplete: function(ev, state){
    var banks = state.banks
      , stocks = state.stocks
      , data = []
      , tot_tot = 0

    ac.utils.loadPrices(stocks, function(stocks){
      _.each(banks, function(v, k){
        var row = {
          account: k
        , balance: { value: v.balance, currency: v.currency }
        , liquid: { value: v.balance, currency: v.currency }
        , unrealised: { value: 0, currency: v.currency }
        , illiquid: {value: 0, currency: v.currency }
        }

        if (!v.last_statement)
          return;

        var age = parseInt((new Date().getTime() - new Date(v.last_statement).getTime())/(1000*3600*24))
          , positions = v.positions || {}

        _.each(stocks, function(v, k){
          if (!positions[k]) return;
          row.balance.value += (v.costbasis / v.quantity) * positions[k]
          row.illiquid.value += (v.costbasis / v.quantity) * positions[k]
          row.unrealised.value += (ac.utils.stockGain(v) / v.quantity) * positions[k];
        })

        if (age > 60){
          row.account = row.account.red
        } else if (age > 30){
          row.account = row.account.yellow
        }
        if (!row.balance.value && !row.unrealised.value && !positions)
          return false;

        tot_tot += convertToUSD(row.unrealised) + convertToUSD(row.liquid) + convertToUSD(row.illiquid)
        data.push(row)
      })

      var grandTotal = (tot) => {
        return (col, row) => {
          return row.total.value / tot
        }
      }

      console.log(table.createTable(
        [
        {title: "Account", property: 'account'}
      , {title: "Value", property: 'balance', format: 'currency', total: true}
      , {title: "Illiquid", property: 'illiquid', format: 'currency', total: true}
      , {title: "Liquid", property: 'liquid', format: 'currency', total: true}
      , {title: "Unrealised", property: 'unrealised', format: 'currency', total: true}
      , {title: "Total", property: 'total', value: table.sumProperties('illiquid', 'liquid', 'unrealised'), format: 'currency', total: true}
      , {title: "% Net", property: 'proportionNet', format: 'percent', value: grandTotal(tot_tot)}
      ], data).toString())
    })
  }
}
}





 


