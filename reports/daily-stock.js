var request = require('request')
  , _ = require('underscore')
  , colors = require('colors')
  , Table = require('cli-table')
  , ac = require('../accountant')  
  , utils = require('../utils')

var FINANCE_URL ='http://www.google.com/finance/info?client=ig&q='
  , EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.5723 
  
  }

var COLS = {
    symbol : {title : "Sym", desc: "Symbol", ind : 0}
  , price :  {title : "Price", ind : 1, align:'right'}
  , chg :    {title : "Δ", ind : 2, desc : "Daily change (price)", align:'right'}
  , chg_p :  {title: "Δ%", ind: 3, desc : "Daily change (%)", align:'right'}
  , d_gain : {title: "$Δ", ind: 4, desc : "Day gain (price)", align:'right'}
  , num :    {title: "#", ind : 5, desc : "No. Shares owned", align:'right'}
  , age :    {title: ">age", ind : 6 , desc: "Age of oldest shares (days)", align:'right'}
  , cb :     {title: "Cst Bas.", ind: 7, desc: "Cost basis", align:'right'}
  , mkt :    {title: "Mkt Value", ind : 8, desc : "Market value of owned", align:'right'}
  , div :    {title: "Div.", ind: 9, desc :"Dividends Paid", align:'right'}
  , gain :   {title:  "Gain", ind : 10, desc: "Overall gain (price)", align:'right'}
  , sec:     {title: "30d%", ind : 11, desc: "30 Day Yield (%)", align:'right'}
  , growth:  {title:  "Growth", ind : 12, desc: "Growth % (no dividends)", align:'right'}
  , ret:     {title: "Return", ind : 13, desc: "Overall return (%)", align:'right'}
}
		
module.exports = function(opts){
  return {
  onComplete: function(ev, state){

    var banks = state.banks, stocks = state.stocks
    utils.loadPrices(stocks, function(st){
      render(banks, st, opts)
    })

    }
  }
}

var render = function(banks, stocks, opts){
  var c = function(v, pre, post){
    var val = '' + utils.r2(v)
      , str = (pre || '') + val + (post || '')

    if (opts.color != false)
      str = (val>=0) ? str.green : str.red  

    return str
  }  
  
  // Color volatile
  var cv = function(v, pre, post, bord){
    var val = '' + parseInt(v*100)/100
      , str = (pre || '') + val + (post || '')

    if (opts.color != false)
      str = (val>=0) ? ((val>= -bord) ? str.blue : str.green) : ((val <= bord) ? str.red : str.yellow)  

    return str
  }  

  
  var t = new Table({
      head : _.map(COLS, function(v, k){return v.title})
    , style : {compact: true, 'padding-left':1, 'padding-right':1 , head: ['cyan']}
    , colAligns: _.map(COLS, function(v, k){return v.align || 'left'})
  })
 
  var MKT_RET = _.find(stocks, function(v,k){
    return (k =='VTI')} )|| {quantity : 1, current : 0, dividend : 0, costbasis: 0}
  MKT_RET = (MKT_RET.quantity * MKT_RET.current + MKT_RET.dividend - MKT_RET.costbasis)/MKT_RET.costbasis * 100

  var mktCol = function(val){
    if (opts.color!=false && val > 0 && val < MKT_RET){
	    return ('' + parseInt(val*100)/100).yellow	  
	  }	
    return c(val);
  }	  

  t.push.apply(t, _.map(stocks, function(v, k){
    
    var age = utils.stockMaxAge(v)
      , gain = utils.stockGain(v)
      , ret = (gain + v.dividend)/v.costbasis
      
      /*
      _.each(v.chunks, function(ch){
        ac.historic.priceAt('VTI', ch.date, function(){
          console.log(arguments)
        })
      })
      */

    var vals = {
      symbol: (v.etf || v.mutual_fund) ? k.yellow : k
    , price:  c(v.current)
    , chg: cv(parseFloat(v.change), '', '', (-0.02 * v.current))
    , chg_p: cv(v.change_percent, '', '%', -2)
    , d_gain: cv(parseFloat(v.change) * v.quantity, '', '', (-0.02 * v.current * v.quantity))
    , num: c(v.quantity)
	  , age: v.chunks && ((age + '')[(age < 365) ? 'yellow' : 'green']) || ''
    , cb: c(v.costbasis)
    , mkt: c(v.quantity * v.current)
    , div: c(v.dividend)
    , gain: c(gain)
    , growth: c((v.quantity * v.current - v.costbasis)/v.costbasis * 100)
    , ret: mktCol(ret * 100)
	  }
    
    vals.sec = c(((gain + v.dividend)/ age * 30) / v.costbasis * 100)

  
    return _.map(COLS, function(v, k){return vals[k]})
  }))
  
  
  // Cash?
  if (opts.cash){
    currencies = {}
    _.each(banks, function(v, k){
      if (!v.last_statement) return // Statements on only my assets // HACK
      currencies[v.currency] = currencies[v.currency] || 0
      currencies[v.currency] += v.balance
      
      //console.log(v, k);
    })

    _.each(currencies, function(v,k){
      var r ={
         symbol: k.blue
        , price: c(EXCHANGE_RATES[k])
        , chg: c(0)
        , chg_p : c(0)
        , d_gain : c(0)
        , num : c(v)
        , age : '-'
        , cb : c(EXCHANGE_RATES[k] * v)
        , mkt : c(EXCHANGE_RATES[k] * v)
        , div : c(0)
        , gain: c(0)
        , sec : c(0)
        , growth: c(0)
        , ret: c(0)
      }
      t.push(_.map(COLS, function(v, k){return r[k]}))
    })  
  
  }
  
  
  var stripcolor = /\u001b\[\d+m/g
    , parse = function(a){return parseFloat(("" + a).replace(stripcolor,'')) || 0}
    , sum = function(a,b){return parse(a)+parse(b)}
    , sumCol = function(col){return _.reduce(_.pluck(t, COLS[col].ind), sum, 0)}
    , num_rows = t.length
    
    // Sort
    t.sort(function(a, b){    
      return parse(b[opts.sort ||COLS['ret'].ind]) - parse(a[opts.sort || COLS['ret'].ind])
    })
    
    
  // Total
  var tots = {
        symbol: "Total"
      , price:  ""
      , chg: ""
      , chg_p: cv((sumCol('chg_p') / num_rows), '', '%')  //tot change %
      , d_gain: c(sumCol('d_gain'))
      , num: c(sumCol('num'))
   	  , age: ""
      , cb: c(sumCol('cb'))
      , mkt: c(sumCol('mkt'))
      , div: c(sumCol('div'))
      , gain: c(sumCol('gain'))
      , sec : c(sumCol('sec') / num_rows)
      , growth: c( (sumCol('mkt') - sumCol('cb')) / sumCol('cb')  * 100, '', '%')
      , ret: c( (sumCol('mkt') + sumCol('div') - sumCol('cb')) / sumCol('cb')  * 100, '', '%')
     }
  
  t.push([], _.map(COLS, function(v, k){return tots[k]}))

  console.log(t.toString())

  // Trading Accounts
  if (opts.trad_acct){
    _.each(banks, function(v, k){
      if (!v.trading) return;
      console.log(k, ":", v.currency, c(v.balance));
    })  
  
  }  
}  

