# Accountant
[![Build Status](https://secure.travis-ci.org/peterbraden/accountant.png)](http://travis-ci.org/peterbraden/accountant)

## Double Entry Accounting

_Accountant_ is a set of utilities and scripts that I've developed to allow
 me to do accounts from the command line. In some way it's similar to 
(Ledger)[http://ledger-cli.org/3.0/doc/ledger3.html], although it's a lot simpler.

## Builtin Commands
#### `acct-ls`
Validates the transactions against the statements

#### `acct-net`
See net worth, totals, liquid and unrealised gains.

#### `acct-stock`
Information on equities and funds in the portfolio


### Principles
- Data is maintained in a text(json) file.
  - There should be no lock-in - it should be trivial to write a script to
      convert to another format, ie ledger.
- Currency, i18n agnostic.
- Scriptable, extensible.
- Should be error tolerant - should help you locate data errors, but not throw
  annoying errors.

## accounts.json

You use accountant by creating (or generating) an _account.json_ file. This is
simply a list of transactions and statements about your accounts.

ie:
```json
[ 
  {'date' : '2012-01-02', 'typ' : 'statement', 'account' : 'mybank', 'balance' : 0, 'currency' : 'USD'}
, {'date' : '2012-01-03', 'typ' : 'transaction', 'src' : 'myjob',  'dest' : 'mybank', 'amount' : 1000.01, 'currency' : 'USD'}
]
```


## Transaction Types:

- `transaction`
  - Parameters: `date, src, dest, amount, currency`
  - Events: `onTransaction`
- `statement`
- `stock-buy, etf-buy mutfund-buy`
- `sell, stock-sell, etf-sell, mutfund-sell`
- `dividend`
- `invoice`
  - Events: `onInvoice`

## Ideas:
- `recurring-transaction`
- `brokerage-statement`

## Architecture:

### Runner
The runner iterates through the objects in the accounts file and triggers known
events in the reports. It also maintains some state, such as bank balances etc.

### Reports
A report is a series of event handlers that are triggered in order as the
account file is traversed.

#### Generic Events:
`onEvent`


#### Validation
There is a validation report that checks that transactions match statements.


### Scripts
A script is a CLI script that configures and runs a report and outputs the result


# FAQ

## Why JSON?

Writing data serialisation formats is a fools game. JSON is one of the most
widely used data formats, libraries exist in almost every language. It doesn't
have any easy to screw-up features like significant whitespace. CSV would also
be a valid choice, but we have so many different fields for different
transaction types that it would end up very sparse.

The goal of the file format is to be easily read by a script, thus it should be
easy to write a script to turn it into whatever format you need for another
tool.


## Goal

- Convert all state logic into reports
```
accountant.registerReports([accountant.coreReports, myReport])
```
- Move utility methods out of accountant.js
- Ticker changes?
- Stock split


#### Report
```
accountant.addReport(foo)
foo.onTransaction(transaction, state)
```
