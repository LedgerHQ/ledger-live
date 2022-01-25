# Countervalues v2

## Paradigm shift from previous Countervalues API (redux)

There are couple of changes we made from V1.

### BigNumber -> number
There is a peformance issue we faced when converting BigNumber to js and viceversa. Plus precision isn't necessary in the countervalue usecase. Therefore pure JS number is used entierly.

### Redux -> React context
Countervalues v2 souce code is decoupled from Redux for flexibility. Now it is easier to integrate with CLI or any other clients.

### No "intermediary" currencies
The v1 implementation has option for user to decide which currency to use as a intermediary when calculating a pair such as DAI and EUR. Now everything is handled by Kaiko, our data provider. Overall, client API gets much simpler and performant.

### New Backend API
Backend API also involved and the old API is no longer maintained. The new backend no longer has knowledge of magnitude which ease support of colliding tickers.
(e.g: USDT can have different magnitude on different chains. We were doing conversion on both side)

## Quick Examples

### Example 1: Calculate coutervalue

First of all, wrap your app component with `Countervalues` provider and provide trackingPairs as a prop.

```jsx
import {
  Countervalues,
  useTrackingPairForAccounts
} from "@ledgerhq/live-common/lib/countervalues/react"


function App() {
  // get these in the client side
  const accounts = ...

  const trackingPairs = useTrackingPairForAccounts(accounts, countervalueCurrency)

  return (
    <Countervalues
      userSettings={{
        autofillGaps: true,
        trackingPairs
      }}
      // use this prop to restore local countervalues cache
      savedState={CounterValuesStateRaw}
    >
      <MainApp />
    </Countervalues>
  )
}
```

*Currently in Ledger Live, `accounts` and `countervalueCurrency` are managed by two different implementation on desktop and mobile side. Therefore, `useTrackingPairForAccounts` still has to accept these as arguments. In the future we may want to move all the logic inside live-common to provide even simpler API.

useCalculate hook inside a React component or a custom hook.

```js
import { useCalculate } from "@ledgerhq/live-common/lib/countervalues/react"

// inside component or custom hook
const countervalue = useCalculate({
  from: Currency,
  to: Currency,
  value: number,
  disableRounding: boolean,
  date: Date,
});
```

### Example 2: Store raw coutnervalues state locally
```jsx
import { useCountervaluesExport } from "@ledgerhq/live-common/lib/countervalues/react"

// inside component or custom hook
const rawState = useCountervaluesExport()

function save() {...}

useCallback(() => {
  save(rawState)
  // it's probably overkill to list rawState object as a dependency since its reference would change all the time, but you get the idea.
}, [rawState])
```

### Example 3: Controll polling mechanism

For example, when the app window goes to background it may be ideal to stop polling to save some network traffics. Or you may want to wipe all the current state and re-poll all the state. For those situations, `useCountervaluesPolling` hook comes in handy. You can also utilize `pending` flag to see if polling is in progress.

```jsx
import { useCountervaluesPolling } from "@ledgerhq/live-common/lib/countervalues/react"

// inside component or custom hook
const { wipe, poll, start, stop, pending, error } = useCountervaluesPolling();
```

### List of other custom hooks used in Ledger Live
- useSendAmount
  - to calculate countervalue based on the amount user inputs
- useCalculateCountervalueCallback
  - it returns callback calculate function based on currency provided as its argument
- useBalanceHistoryWithCountervalue
  - used to show chart in Account page inside Ledger Live
- usePortfolio
  - used to dispaly portfolio chart
- useCurrencyPortfolio
  - used to dispaly portfolio chart for specific currency
- useDistribution
  - used in Asset distribution screen

## Core and helper API

In most of cases, it's enough to use hooks which are exported from `@ledgerhq/live-common/lib/countervalues/react`.

But core (`@ledgerhq/live-common/lib/countervalues/logic`) module comes in handy when you want to use these logic outside React component or inside some callback functions.

`@ledgerhq/live-common/lib/countervalues/helper` also export some useful util funcitons although it is mostly consumed internaly by core module.

## Internal: modules system

Although you might not need to use, it is worth mentioning that there is a module system takes place internaly in order to modify specific logic for certain pairs such as fetching mechanism, custom mapRate and so on. For example in Ledger Live, we have custom module for caclulating BTC <-> ETH pair which is not originally provided by Kaiko.
Check out `@ledgerhq/live-common/lib/countervalues/modules` for more details.

## Testing countervalues with CLI

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

### Environement variables

If you want a lot of more verbosity, you can run with

```
VERBOSE=1
DEBUG_HTTP_RESPONSE=1
```
