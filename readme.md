# Accountant
## Double Entry Accounting

_Accountant_ is a set of utilities and scripts that I've developed to allow
 me to do accounts from the command line. In some way it's similar to 
(Ledger)[http://ledger-cli.org/3.0/doc/ledger3.html], although it's a lot simpler.

## accounts.json

You use accountant by creating (or generating) an _account.json_ file. This is
simply a list of transactions and statements about your accounts.

ie:
  
    [ {'date' : '2012-01-02', 'typ' : 'statement', 'acct' : 'mybank', 'balance' : 0, 'currency' : 'USD'}
    , {'date' : '2012-01-03', 'typ' : 'transaction', 'src' : 'myjob',  'dest' : 'mybank', 'amount' : 1000.01, 'currency' : 'USD'}
    ]
    
    