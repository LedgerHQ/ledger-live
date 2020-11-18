# Countervalues (NEW API)

> NB: This documents the incoming countervalues-new new implementation.

_...TODO document live-common api..._

## Environement variables

If you want a lot of more verbosity, you can run with

```
VERBOSE=1
DEBUG_HTTP_RESPONSE=1
```

## Testing countervalues

The CLI implements tools to test the countervalues.

> The easiest way to get it is to install it with NPM. As it's still experimental, make sure to often update it to latest version we have worked on:
>
> ```
> npm i -g ledger-live@countervalues
> ```

### `ledger-live portfolio`

This is a super set of `ledger-live sync` that is showing you a Portfolio version of your accounts, similarly to Ledger Live's Portfolio.

```
SUMMARY OF PORTFOLIO: 65 accounts, total of  USD 80.70 ::: on a month period: 138% (USD 46.82)
          USD 110.75 ┤  ╭╮
          USD 102.87 ┤  ││
           USD 94.99 ┤  ││
           USD 87.10 ┤  ││
           USD 79.22 ┤  ││             ╭─╮╭──────╮╭
           USD 71.34 ┤  ││     ╭───────╯ ╰╯      ││
           USD 63.46 ┤  │╰─────╯                 ││
           USD 55.58 ┤  │                        ││
           USD 47.69 ┤  │                        ││
           USD 39.81 ┤  │                        ││
           USD 31.93 ┼──╯                        ╰╯
```

It takes the same parameter of `sync` but it also takes

```
     --countervalue <String>  : ticker of a currency
 -p, --period <String>        : year | month | week
```

Example:

```
ledger-live portfolio -c eth --xpub xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy
```

### `ledger-live countervalues`

This allows to test directly the countervalues.

Running the command without parameter will simply fetch the latest month of daily BTC-USD rates.

It can take more parameters however:

```
❯ ledger-live countervalues --countervalue EUR -c ETH -c BTC -f asciichart

                      Ethereum to Euro
          EUR 198.28 ┼                     ╭─────╮╭
          EUR 178.45 ┤          ╭╮  ╭──────╯     ││
          EUR 158.62 ┼──╮     ╭─╯╰──╯            ││
          EUR 138.80 ┤  ╰─────╯                  ││
          EUR 118.97 ┤                           ││
           EUR 99.14 ┤                           ││
           EUR 79.31 ┤                           ││
           EUR 59.48 ┤                           ││
           EUR 39.66 ┤                           ││
           EUR 19.83 ┤                           ││
            EUR 0.00 ┤                           ╰╯

                      Bitcoin to Euro
        EUR 8,426.00 ┼                     ╭╮╭───╮╭
        EUR 7,583.40 ┤                   ╭─╯╰╯   ││
        EUR 6,740.80 ┼──╮ ╭╮  ╭───╮ ╭────╯       ││
        EUR 5,898.20 ┤  ╰─╯╰──╯   ╰─╯            ││
        EUR 5,055.60 ┤                           ││
        EUR 4,213.00 ┤                           ││
        EUR 3,370.40 ┤                           ││
        EUR 2,527.80 ┤                           ││
        EUR 1,685.20 ┤                           ││
          EUR 842.60 ┤                           ││
            EUR 0.00 ┤                           ╰╯
```

We can also do more tests like fetching rates of TOP 10 of coins:

```
❯ ledger-live countervalues --marketcap --size 10 --format stats
BTC to USD   availability=93%
ETH to USD   availability=93%
XRP to USD   availability=97%
USDT to USD  availability=97%
BCH to USD   availability=97%
LTC to USD   availability=97%
BNB to USD   availability=97%
EOS to USD   availability=97%
XTZ to USD   availability=97%
XLM to USD   availability=97%
Total availability: 96%
```

We'll try to add more metrics in future. (like request times)
