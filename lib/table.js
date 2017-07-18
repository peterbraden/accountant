var Table = require('cli-table')
  , convertToUSD = require('./exchange').convertToUSD
  , $$ = require('../utils').$


var formatCell = function(format, cell){
  if (cell === undefined) {
    return '-' 
  }
  if (format == 'currency'){
    return $$(cell.value, cell.currency)
  }
  if (format == 'multicurrency'){
    return cell.map( (x) => $$(x.value, x.currency) ).join(', ') || '-'
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

module.exports = { createTable, sumProperties }
