var $$ = require('../utils').$

// Multi currency utility functions
module.exports = {


  add: function(multi, value, currency){
    if (!Array.isArray(multi)){
      throw new Error('Cannot add multicurrency to a non-array type')
    }

    var found = false
    multi.forEach( (amount) => {
      if (amount.currency == currency) {
        found = true
        amount.value += value
      }
    })
    if (!found) {
      multi.push({
        currency: currency
      , value: value
      })
    }
  },

  toString: function(multi){
    return multi.map( (x) => $$(x.value, x.currency) ).sort().join(', ') || '-'
  }

}
