var EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.28
    , CHF : 1.04
}

var convertToUSD = function(amount){
  if (amount === undefined) { return 0 }
  return amount.value * EXCHANGE_RATES[amount.currency || 'USD']
}

module.exports = {convertToUSD}
