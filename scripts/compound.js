#!/usr/bin/env node
var acct = require('../accountant')
  , opts = require('nomnom').parse()

var principle = opts.p || 10000
  , rate = opts.r || 8
  , time = opts.t || 10
  , compounds = opts.n || 1
  , amount = principle * Math.pow(1 + ((rate/100)/compounds), compounds * time)

console.log(rate + "% on " + acct.$(principle) + " for " + time + "y :" + acct.$(amount))

