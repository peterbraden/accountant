
var resolveInvoice = function(transaction, banks, stocks, invoices){
  var id = transaction.invoice
  for (var to in invoices){
    var outstanding = invoices[to].outstanding
    for (var i in outstanding){
      if (outstanding[i].id == id){
        // Move the invoice to closed
        var inv = outstanding[i];
        invoices[to].paid.push(inv);
        outstanding.splice(i,1);

        _.each(reports, function(r){
          onEvent('invoice-close', r, transaction, banks, stocks)
          if (r.onInvoiceClose){
            r.onInvoiceClose(transaction, inv, invoices);
          }
        })

        return;
      }
    }
  }

  throw "Outstanding invoice not found: " + id
}

var invoice = function(t, banks, stocks, invoices){
  if (!invoices[t.to]){
    invoices[t.to] = {
        outstanding : []
      , paid : []
    }
  }

  invoices[t.to].outstanding.push(t);

  _.each(reports, function(r){
    onEvent('invoice', r, t, banks, stocks, invoices)
    if (r.onInvoice) 
      r.onInvoice(t, banks, stocks, invoices);
  })
}

module.exports = {
  onStart: (ev, state) => {
    if (!state.banks)
      throw new Error('requires core report')
    state.invoices = {}
  }
}
