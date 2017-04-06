var Table = require('cli-table')
  , colors = require('colors')
module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){

      var t = new Table({
          head : ['Bank', 'Asset', '#'] 
        , style : {compact: true, 'padding-left':1, head: ['cyan']} 
      })

      Object.keys(banks).forEach( (name) => {
        var bank = banks[name]
        if (!bank.last_statement ||
             (bank.balance == 0 && !bank.positions)
           ) {
          return // Statements on only my assets
        }
      
        t.push([name.red, bank.currency.yellow, ('' + bank.balance).yellow])
        if (bank.positions) {
          Object.keys(bank.positions).forEach( (asset) => {
            t.push(['', asset, bank.positions[asset]])
          })
        }
        t.push([])
      })
      t.pop() // kill last empty row
      console.log(t.toString())
    }
  }
}
