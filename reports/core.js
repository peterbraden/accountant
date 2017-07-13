module.exports = function(opts){
  return {
    onStart: (ev, state) => {
      state.banks = {}
      state.stocks = {}
      state.invoices = {}
    }  
  }
}
