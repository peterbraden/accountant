#!/usr/bin/env node
// cat ~/Desktop/vanguard.csv | BANK=vanguard node scripts/csv-to-transaction.js
//


var parse = require('csv-parse')
  , moment = require('moment')

var BANK = process.env.BANK

if (!BANK) {
  throw new Error('Unknown bank (env variable: BANK)')
}

var _SETTINGS = {
  'ubs' : {
    delimiter: ';'
  , date: 'Trade date'
  , dateFormat: 'D.M.YYYY'
  }
, 'vanguard' : {
    delimiter: ','
  , date: 'Trade Date'
  , dateFormat: 'M/D/YYYY'
  , amount: 'Principal Amount'
  , symbol: 'Symbol'
  , typ: function(record) {
      if (record['Transaction Type' === 'Cash Dividend']) 
        return 'dividend'
      return 'transaction'
    }
  }
, 'schwb' :{
    delimiter: ','
  , date: 'Date'
  , amount: 'Amount'
  , symbol: 'Symbol'
  , memo: 'Description'
  , typ: function(record) {
      if (record.Action === 'Cash Dividend')
        return 'dividend'
      return 'transaction'
    }

  }
}

var SETTINGS = _SETTINGS[BANK]
var records = []


parser = parse({
  delimiter: SETTINGS.delimiter
, columns: true
, skip_empty_lines: true
, skip_lines_with_empty_values: true
, relax_column_count : true
})

parseField = function(out, name, record, col, defalt, transform) {
  var val

  if (SETTINGS[col]) {
    if (typeof SETTINGS[col]== 'string') {
      val = record[SETTINGS[col]]
    } else {
      // Settings is a parse func
      val = SETTINGS[name](record)
    }
  } else {
    if (defalt) {
      val = defalt(record)
    } else {
      // No record, and no default 
    }
  }
  if (val) { 
    if (transform) {
      val = transform(val)
    }

    out[name] = val
  }
  return val
}

var dateTransform = function(val) {
  var date = moment(val, SETTINGS.dateFormat).format("YYYY-MM-DD")

  if (date === 'Invalid date'){
    //
  }
  return date
}

var amountTransform = function(num){
  if (typeof num == 'string'){
    num = num.replace('\$','')
  }
  if (!num) return ''
  return parseFloat(num.replace("'", ""))
}

var mandatory = function(name){
  return function(){
    throw new Error('Mandatory Field:' + name)
  }
}

parser.on('readable', function(){
  var record = true
  while(record){
    try {
      record = parser.read()

      if (!record) {
        continue
      }



      var out = {}

      parseField(out, 'date', record, 'date', mandatory('date'), dateTransform)
      parseField(out, 'typ', record, 'typ', function(){ return 'transaction' })

      if (out.typ == 'dividend') {
        parseField(out, 'symbol', record, 'symbol', mandatory('symbol'), null)
        parseField(out, 'gross', record, 'amount', null, amountTransform)
      }

      if (out.type == 'transaction') {
        if (SETTINGS.amount) {
          var amount = parseField(out, 'amount', record, 'amount', null, amountTransform)
          if (amount > 0) {
            out.src = '?'
            out.dest = BANK
          } else {
            out.src = BANK
            out.dest = '?'
            out.amount = -1 * out.amount
          }
        }

        else {
          if (record.Debit){
            out.src = BANK
            out.dest = '?'
            out.currency = record['Ccy.']
            out.amount = amt(record.Debit)
          } else {
            out.src = '?'
            out.dest = BANK
            out.currency = record['Ccy.']
            out.amount = amt(record.Credit)
          }
        }
      }
      console.log(out, record)

      // memo
      parseField(out, 'memo', record, 'memo', null, null)

      records.unshift(
        JSON.stringify(out)
          .replace('\n', '')
          .replace(/,/g, ', ')
        )

      console.log(record, '---> ', out, '\n\n')
    } catch (e) {
      console.error(e)
    }
  }
})

parser.on('finish', function(){
  records.sort()

  records.forEach(function(x){
    console.log(',', x);
  })
})


process.stdin.pipe(parser)




