module.exports = {
  onStart: function(e, state){
    state.passive = {
      income: 0
    }
  }
, onDividend: function(div, state){
    var net
    if (div.amount){
      net = state.banks[div.account].positions[div.symbol] * div.amount
    } else {
      net = div.gross
    }
    state.passive.income += net
  }
}
