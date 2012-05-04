var fs = require('fs')
  , request = require('request')
  , _ = require('underscore')
  , colors = require('colors')
  , opts = require('nomnom').parse()
  , Table = require('cli-table')
  
  , ac = require('../accountant')
  



var FINANCE_URL ='http://www.google.com/finance/info?client=ig&q='
  , EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.5723 
  
  }
  

var COLS = {
    symbol : {title : "Symbol", ind : 0}
  , price :  {title : "Price", ind : 1}
  , chg :    {title : "Δ", ind : 2, desc : "Daily change (price)"}
  , chg_p :  {title: "Δ%", ind: 3, desc : "Daily change (%)"}
  , d_gain : {title: "Day Gain", ind: 4, desc : "Day gain (price)"}
  , num :    {title: "#", ind : 5, desc : "No. Shares owned"}
  , age :    {title: ">age", ind : 6 , desc: "Age of oldest shares (days)"}
  , cb :     {title: "Cst Bas.", ind: 7, desc: "Cost basis"}
  , mkt :    {title: "Mkt Value", ind : 8, desc : "Market value of owned"}
  , div :    {title: "Div.", ind: 9, desc :"Dividends Paid"}
  , gain :   {title:  "Gain", ind : 10, desc: "Overall gain (price)"}
  , growth:  {title:  "Growth", ind : 11, desc: "Growth % (no dividends)"}
  , ret:     {title: "Return", ind : 12, desc: "Overall return (%)"}
}
		
module.exports = function(){
			
  return {
  onComplete: function(banks, stocks){
    // current values

    request.get({uri:FINANCE_URL + _(stocks).keys().join(',')}, function(err, resp, body){
      if (!body) throw "Could not get data from API"
      var finances = JSON.parse(body.slice(3))

       _.each(finances, function(v, k){
         stocks[v.t].current = v.l_cur
         stocks[v.t].change = v.c
         stocks[v.t].change_percent = v.cp


         //console.log(v.t, v)
       })


       render(banks, stocks)
    })

  }
}
}
		



var c = function(v, pre, post){
  var val = '' + parseInt(v*100)/100
    , str = (pre || '') + val + (post || '')
  
  if (opts.color != false)
    str = (val>=0) ? str.green : str.red  
  
  return str
}  



var render = function(banks, stocks){
  var t = new Table({
      head : _.map(COLS, function(v, k){return v.title})
    , style : {compact: true, 'padding-left':1, head: ['cyan']}
  })
  
  var MKT_RET = _.find(stocks, function(v,k){
    return (k =='VTI')} )|| {quantity : 1, current : 0, dividend : 0, cost_basis: 0}
  MKT_RET = (MKT_RET.quantity * MKT_RET.current + MKT_RET.dividend - MKT_RET.cost_basis)/MKT_RET.cost_basis * 100

  var mktCol = function(val){
    if (opts.color!=false && val > 0 && val < MKT_RET){
	    return ('' + parseInt(val*100)/100).yellow	  
	  }	
    return c(val);
  }	  

  t.push.apply(t, _.map(stocks, function(v, k){
    
    var age = v.chunks ? parseInt((new Date().getTime() - new Date(v.chunks[0].date).getTime())/(1000*3600*24)) : ''

    var vals = {
      symbol: v.etf ? k.yellow : k
    , price:  c(v.current)
    , chg: c(v.change)
    , chg_p: c(v.change_percent, '', '%')
    , d_gain: c(parseFloat(v.change) * v.quantity)
    , num: c(v.quantity)
	  , age: v.chunks && (/*(v.chunks[0].quantity + '').blue + ' ' +*/ (age + '')[(age < 360) ? 'yellow' : 'green']) || ''
    , cb: c(v.cost_basis)
    , mkt: c(v.quantity * v.current)
    , div: c(v.dividend)
    , gain: c(v.quantity * v.current + v.dividend - v.cost_basis)
    , growth: c((v.quantity * v.current - v.cost_basis)/v.cost_basis * 100)
    , ret: mktCol((v.quantity * v.current + v.dividend - v.cost_basis)/v.cost_basis * 100)
	}
  
    return _.map(COLS, function(v, k){return vals[k]})
  }))
  
  /*
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
      t.push(
        [ k.yellow
        , c(EXCHANGE_RATES[k])
        , ''
        , ''
        , c(v)
        , c(EXCHANGE_RATES[k] * v)
        , c(EXCHANGE_RATES[k] * v)
        , ''
        , ''
        , ''
        , ''
        , ''
		, ''
      ])
    })  
  
  }
  */
  
  var stripcolor = /\u001b\[\d+m/g
    , parse = function(a){return parseFloat(("" + a).replace(stripcolor,'')) || 0}
    , sum = function(a,b){return parse(a)+parse(b)}
    , tot_change = _.reduce(_.pluck(t, 1), sum)
    , tot_cb =  _.reduce(_.pluck(t, 7), sum)
    , tot_val =  _.reduce(_.pluck(t, 8), sum)
    , tot_day_gain = _.reduce(_.pluck(t, 4), sum)
    , tot_div = _.reduce(_.pluck(t, 9), sum)
    , tot_gain = _.reduce(_.pluck(t, 10), sum)
    , tot_growth_return = (tot_val - tot_cb)/tot_cb * 100
    , tot_return = (tot_val + tot_div - tot_cb)/tot_cb * 100
    
    
    // Sort
    t.sort(function(a, b){    
      return parse(b[opts.sort || 12]) - parse(a[opts.sort || 12])
    })
    
    
  // Total
  var tots = {
        symbol: "Total"
      , price:  ""
      , chg: ""
      , chg_p: c(tot_change / tot_cb * 100) //tot change %
      , d_gain: c(tot_day_gain)
      , num: ""
   	  , age: ""
      , cb: c(tot_cb)
      , mkt: c(tot_val)
      , div: c(tot_div)
      , gain: c(tot_gain)
      , growth: c(tot_growth_return)
      , ret: c(tot_return)
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

