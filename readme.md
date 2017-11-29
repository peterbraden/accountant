# Accountant
[![Build Status](https://secure.travis-ci.org/peterbraden/accountant.png)](http://travis-ci.org/peterbraden/accountant)

## Double Entry Accounting

_Accountant_ is a set of utilities and scripts that I've developed to allow
 me to do accounts from the command line. In some way it's similar to 
 [Ledger](http://ledger-cli.org/3.0/doc/ledger3.html), although it's a lot simpler.

## Builtin Commands

#### `acct-net`
See net worth, totals, liquid and unrealised gains.

```
┏━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━┓
┃ Account      ┃ Value       ┃ Illiquid    ┃ Liquid      ┃ Unrealised  ┃ Total        ┃ % Net┃
┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━┫
┃ mybank       ┃ USD 5,586.55┃ USD 2,638.50┃ USD 2,948.50┃ USD 1,205.95┃ USD 6,792.50 ┃ 63.88┃
┃ myforeignbank┃ GBP 3,000.0 ┃ GBP 0.0     ┃ GBP 3,000.0 ┃ GBP 0.0     ┃ USD 3,840.0  ┃ 36.12┃
┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━┫
┃ Total        ┃ USD 9,426.55┃ USD 2,638.50┃ USD 6,788.50┃ USD 1,205.95┃ USD 10,632.50┃      ┃
┗━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┻━━━━━━┛
```

#### `acct-stock`
Information on equities and funds in the portfolio
```
┏━━━━━━━┳━━━━━━━━┳━━━┳━━━━┳━━━━┳━━━━━━━┳━━━━━━┳━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━┳━━━━━━━┳━━━━━━━━┳━━━━━━━━┓
┃ Sym   ┃  Price ┃ Δ ┃ Δ% ┃ $Δ ┃     # ┃ >age ┃ Cst Bas. ┃ Mkt Value ┃  Div. ┃    Gain ┃  30d% ┃ Growth ┃ Return ┃
┣━━━━━━━╋━━━━━━━━╋━━━╋━━━━╋━━━━╋━━━━━━━╋━━━━━━╋━━━━━━━━━━╋━━━━━━━━━━━╋━━━━━━━╋━━━━━━━━━╋━━━━━━━╋━━━━━━━━╋━━━━━━━━┫
┃ MCD   ┃ 153.96 ┃ 0 ┃ 0% ┃  0 ┃ 10.00 ┃ 1963 ┃   969.39 ┃   1539.60 ┃     0 ┃  570.20 ┃  0.89 ┃  58.81 ┃  58.81 ┃
┃ VTI   ┃ 126.31 ┃ 0 ┃ 0% ┃  0 ┃ 15.00 ┃ 1963 ┃  1240.00 ┃   1894.65 ┃ 12.34 ┃  654.65 ┃  0.82 ┃  52.79 ┃  53.79 ┃
┃ BND   ┃  81.95 ┃ 0 ┃ 0% ┃  0 ┃  5.00 ┃ 1963 ┃   428.65 ┃    409.75 ┃     0 ┃  -18.90 ┃ -0.60 ┃  -4.40 ┃  -4.40 ┃
┣━━━━━━━╋━━━━━━━━╋━━━╋━━━━╋━━━━╋━━━━━━━╋━━━━━━╋━━━━━━━━━━╋━━━━━━━━━━━╋━━━━━━━╋━━━━━━━━━╋━━━━━━━╋━━━━━━━━╋━━━━━━━━┫
┃ Total ┃        ┃   ┃ 0% ┃  0 ┃ 30.00 ┃      ┃  2638.30 ┃   3844.00 ┃ 12.33 ┃ 1205.94 ┃  0.36 ┃ 45.71% ┃ 46.18% ┃
┗━━━━━━━┻━━━━━━━━┻━━━┻━━━━┻━━━━┻━━━━━━━┻━━━━━━┻━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━┻━━━━━━━━━┻━━━━━━━┻━━━━━━━━┻━━━━━━━━┛
```

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
  {"date" : "2012-01-02", "typ" : "statement", "account" : "mybank", "balance" : 0, "currency" : "USD"}
, {"date" : "2012-01-03", "typ" : "transaction", "src" : "myjob",  "dest" : "mybank", "amount" : 1000.01, "currency" : "USD"}
]
```

See: [example json](./example-accounts.json)


## Transaction Types:

- `transaction`
  - Parameters: `date, src, dest, amount, currency`
  - Events: `onTransaction`
- `statement`
- `stock-buy, etf-buy mutfund-buy`
- `sell, stock-sell, etf-sell, mutfund-sell`
- `dividend`
- `brokerage-statement`

## Architecture:

### Runner
The runner iterates through the objects in the accounts file and triggers known
events in the reports. A global state is passed to all reports, allowing balances
etc. to be maintained.

### Reports
A report is a series of event handlers that are triggered in order as the
account file is traversed.

#### Generic Events:
`onEvent`

#### Core Report
```
state.banks[ID].currency
state.banks[ID].balance
state.banks[ID].last_statement
```

#### Equity Report
```
state.banks[ID].equities[TICKER].position = quantity
state.banks[ID].equities[TICKER].costbasis 
state.banks[ID].equities[TICKER].dividends
```

#### Validation
There is a validation report that checks that transactions match statements.


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



#### Report
```
accountant.addReport(foo)
foo.onTransaction(transaction, state)
```
