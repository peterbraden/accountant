#!/usr/bin/env node
var acct = require('../accountant')
  , report = require('../reports/passive')
  , opts = require('nomnom').parse()
  
acct.registerReport(report)
    .registerReport({
      onComplete: function(e, state){
      
        console.log(state.passive)
      }
    }).runFile(opts[0]);
