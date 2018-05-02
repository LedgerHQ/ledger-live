# Design Notes

This module provides helpers to deal with countervalues.

## Pre-requisite

* **React** (universal, works on web / native / electron)
* **Redux** with **thunk** middleware.

## Example by the code

```js
import createCounterValues from "@ledgerhq/live-wallet/lib/countervalues";

const CounterValues = createCounterValues({
  getAPIBaseURL: () => "http://localhost:8088",
  storeSelector: state => state.countervalues,
  pairsSelector: state => [{ from: btcCurrency, to: eurCurrency, exchange: "KRAKEN" }], // You need to grab this array from your own store!
  setExchangePairsAction: pairedExchanges => ({ type: "...", pairedExchanges }), // you need to implement this action and make sure you listen to it to update back the exchange that was not provided in pairsSelector (because initially you typically don't know the exchanges yet)
  addExtraPollingHooks: (schedulePoll, cancelPoll) => { // this is for more advanced usecases where you want to pipe more events to trigger a poll
    const onReconnect = () => schedulePoll(5000);
    Network.addEventListener("disconnect", cancelPoll)
    Network.addEventListener("reconnect", onReconnect)
    return () => {
      Network.removeEventListener("disconnect", cancelPull)
      Network.removeEventListener("reconnect", onReconnect)
    }
  }
});

// First of all, you must add this in your own reducers:
CounterValues.reducer

// Then, add to your root component stack: it needs at least to be **INSIDE** redux <Provider>
<CounterValues.PollingProvider>

// Any time you need to have state of the polling, or also user control on the polling, you can:
<CounterValues.PollingConsumer>{({ pending, error, poll }) =>
  <span onClick={poll}>{pending ? "sync pending" : error ? String(error) : "done"}</span>
}</CounterValues.PollingConsumer>

// But more importantly, you can calculate countervalues!

const usdValue = CounterValues.calculateSelector(state, { value: btcValue, from: btcCurrency, to: usdCurrency, exchange: "KRAKEN" });

const btcValue = CounterValues.reverseSelector(state, { value: usdValue, from: btcCurrency, to: usdCurrency, exchange: "KRAKEN" });

// ^ state comes from your own redux state. put this code in a mapStateToProps.
// IMPORTANT: it can be undefined in case countervalue is not available. do `|| 0` if you want.

// you can over users to chose another exchange, it's up to you to implement UI
const exchanges = await CounterValues.fetchExchangesForPair(btcCurrency, usdCurrency)
exchanges.map(({ id, name, website }) => ...)

// You can export the store data to have a client persistence cache
const data = CounterValues.exportSelector(state)
// And then you can import it back!
dispatch(CounterValues.importAction(data))
```

## Features

* with PollingProvider & PollingConsumer, it provides an auto Polling mechanism, which can also be extended to more polling usecases.
* the sync countervalue API calls are thought so the minimal needed data is requested. For instance, if daily rates was already loaded, they won't be re-fetched.
* an API to list available exchanges for a given pair (API only return rates for a given exchange)
* it provides a reducer for you to store countervalues over time (it can literally be saved to localStorage)
* to use the rates, you can use the selectors functions. you can calculate or reverse a countervalue.
* ability to export & import it back, so you can implement persistence. at export time, it will get "garbage collected" so only the pairs of interest will remain (the one returned by `pairsSelector`)

For more details, see [Module type](types.js).

## What you need to provide

* the URL of the countervalue API (compliant to ledger spec)
* storeSelector, which returns the state produced by the returned reducer from your own redux store.
* pairsSelector, which returns an array of pairs of interest to load, from your own redux store.
* when you don't know yet which exchange to use for pairs of pairsSelector, you can not provide it,
  however you MUST provide it back the next time (for diffing to work). That's why you need to implement an action `setExchangePairsAction` that will be dispatched when countervalues where retrieved and will tell you which exchanges was used.

For more details, see [Input type](types.js).

## TODO / Future

* WebSocket support to have a live stream of rates
* split the historic rates & the latest rate for better performance (for instance, as latest rates refresh really fast, we might want to not save it at same place for perfs. essential on mobile). Technically this means we can have 2 import/export variants, one for latest rates, one for other things..
