var ac = require('../accountant')  
  , Table = require('cli-table')

module.exports = function(opts){
  return {
    onInvoiceClose : function(transaction, invoice, invoices){

  }
  , onComplete : function(banks, stocks, invoices){
    var t = new Table({
        head : ["Client", "Paid", "Outstanding", "Billed"]
      , style : {compact:true, head: ['cyan'], 'padding-left': 1}
    })
 
    var all_paid=0, all_outstanding = 0;
    for (var inv in invoices){
      var tot_paid = 0, tot_outstanding = 0;

      for (var i=0; i<invoices[inv].paid.length; i++){
        tot_paid += invoices[inv].paid[i].amount
      }
      for (var i=0; i<invoices[inv].outstanding.length; i++){
        tot_outstanding += invoices[inv].outstanding[i].amount
      }
      all_paid += tot_paid
      all_outstanding += tot_outstanding
      t.push([inv, ac.$(tot_paid), ac.$(-tot_outstanding), ac.$(tot_paid + tot_outstanding)])
    }
    t.push([])
    t.push(["Total:", ac.$(all_paid), ac.$(-all_outstanding), ac.$(all_paid + all_outstanding)])
    console.log(t.toString())

    console.log("=== Outstanding Invoices ===")
    for (var inv in invoices){
      var no_outstanding = invoices[inv].outstanding.length
        , no_paid =invoices[inv].paid.length

      if (no_outstanding == 0)
        continue;

      console.log("  ", inv
          , ("(" +  no_outstanding + "/"
              + (no_outstanding + no_paid) +")").yellow
          )
      for (var i=0; i<invoices[inv].outstanding.length; i++){
        var outstanding = invoices[inv].outstanding[i]
          , age = parseInt((new Date() - new Date(outstanding.date))/1000/60/60/24)
        console.log("   -"
          , ac.$(outstanding.amount)
          , "invoiced on"
          , outstanding.date
          , ("(" + age + " days ago)")[age > 7 ? 'red' : 'yellow']
        )
      }
    }

  }
}
}
