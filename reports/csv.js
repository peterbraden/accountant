var ac = require('../accountant')  

var $ = function(v){
  return '' + parseInt(v*100) /100
}

console.log("Date, Total, Debit, Credit, Memo")
module.exports = function(opts){
  if (! opts.bank ){
    throw "Need to specify --bank"
  }


  return {
    onTransaction: function(t, banks, stocks){
      if (t.src != opts.bank && t.dest != opts.bank) return;

      var bank = banks[opts.bank]
        , balance = bank.balance
        , debit = t.src == opts.bank ? t.amount : 0
        , credit = t.dest == opts.bank ? t.amount : 0
      t.memo = t.memo || ""

      var oneline = t.src + "->" + t.dest + ": "

      console.log([t.date, $(balance), $(debit), $(credit), '"' + oneline + t.memo.replace(',', '').replace('"',"'") +'"'].join(', '))
    }
  
  }
}

