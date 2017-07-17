var request = require('request')
  , _ = require('underscore')
  , Table = require('cli-table')
  , ac = require('../accountant') 
  , vals = []
  , c = ac.utils.c
  , $$ = ac.utils.$


var EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.28
    , CHF : 1.04
}

var convertToUSD = function(amount){
  if (amount === undefined) { return 0 }
  return amount.value * EXCHANGE_RATES[amount.currency || 'USD']
}

var formatCell = function(format, cell){
  if (cell === undefined) {
    return '-' 
  }
  if (format == 'currency'){
    return $$(cell.value, cell.currency)
  }
  if (format == 'percent'){
    return (cell * 100).toFixed(2)
  }
  return cell
}

var sum = (x, y) => x + y

var sumValues = function(format, values){
  if (format == 'currency') {
    var val = { value: 0, currency:'USD' }
    val.value = values.map(convertToUSD).reduce(sum, 0)
    return val
  }
}

var sumProperties = function(){
  var properties = Array.from(arguments)
  return function(col, row) {
    return sumValues(col.format, properties.map( (p) => row[p])) 
  }
}

var colTotal = function(col, data){
  var values = []
  data.forEach( (x) => {
    values.push(x[col.property])
  })
  return formatCell(col.format, sumValues(col.format, values))
}

var createTable = function(cols, data){
  var showTotal = false

  var t = new Table({
    head: cols.map( (x) => x.title ),
    style : {compact: true, 'padding-left':1, head: ['cyan']}
  })

  data.forEach( (row) => {
    var out = []
    cols.forEach( (col) => {
      if (col.total) {
        showTotal = true
      }
      if (col.value) {
        row[col.property] = col.value(col, row)
      }
      var data = row[col.property]
      var formatted = formatCell(col.format, data)
      out.push(formatted)
    })
    t.push(out)
  })

  if (showTotal) {
    t.push([])
    var totals = ['Total']
    cols.slice(1).forEach( (col, i) => {
      if (col.total) {
        totals.push(colTotal(col, data))
      } else {
        totals.push('')
      }
    })

    t.push(totals)
  }
  return t
}


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
        if (!row.balance.value && ! row.unrealised.value)
          return false;

        tot_tot += convertToUSD(row.unrealised) + convertToUSD(row.liquid) + convertToUSD(row.illiquid)
        data.push(row)
      })

      var grandTotal = (tot) => {
        return (col, row) => {
          return row.total.value / tot
        }
      }

      console.log(createTable(
        [
        {title: "Account", property: 'account'}
      , {title: "Value", property: 'balance', format: 'currency', total: true}
      , {title: "Illiquid", property: 'illiquid', format: 'currency', total: true}
      , {title: "Liquid", property: 'liquid', format: 'currency', total: true}
      , {title: "Unrealised", property: 'unrealised', format: 'currency', total: true}
      , {title: "Total", property: 'total', value: sumProperties('illiquid', 'liquid', 'unrealised'), format: 'currency', total: true}
      , {title: "% Net", property: 'proportionNet', format: 'percent', value: grandTotal(tot_tot)}
      ], data).toString())
    })
  }
}
}





 


