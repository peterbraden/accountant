#!/usr/bin/env node
var opts = require('nomnom').parse()
  , acct = require('../accountant')

var principle = opts.p
  , rate = opts.r
  , time = opts.t
  , compounds = opts.n || 1
  , amount = principle * Math.pow(1 + (rate/compounds), compounds * (rate/100))

console.log(rate + "% on $" + principle + " for " + time + "y :" + acct.$(amount))

