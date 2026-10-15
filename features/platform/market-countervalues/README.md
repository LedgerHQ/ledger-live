# `@features/platform-market-countervalues`

> [!CAUTION]
> **Status: UNSTABLE**. The API may still change.

The countervalues Redux glue: the reducer both apps mount, the middleware that polls rates into it,
and the hooks that read it. The rates, their slice and their logic live in
`@domain/entity-market-countervalues`; fetching lives in `@domain/api-market-countervalues`.

## Exports

| Export | Description |
| --- | --- |
| `createCountervaluesMiddleware` | The polling loop as a Redux middleware, inert until started. Install it once per store |
| `startCountervaluesSync`, `stopCountervaluesSync` | Start the loop with the saved state, and stop it |
| `haveSameTrackingPairs` | Result equality check for a settings selector: same pairs while accounts resynchronize |
| `useCountervaluesState` | The full `CounterValuesState` |
| `useCountervaluesPolling` | Polling controls (`Polling`): `poll`, `start`, `stop`, `wipe`. Selects nothing |
| `useCountervaluesLoadStatus` | Whether a load is in flight and the last load's error (`CountervaluesLoadStatus`) |
| `useCalculate`, `useCalculateCountervalueCallback` | Convert an amount with the current rates |
| `useSendAmount` | Fiat amount and reverse calculation for the send flow |
| `useUsdToFiatRate` | USD to fiat spot rate, polled every 60 seconds; `1` for USD without a request |
| `useGetCounterValueIdsPolling` | Currency ids sorted by market cap, polled every 30 minutes, with a default list |
| `setCountervaluesLogger` | Registers the app logger |
| `countervaluesReducer`, `CountervaluesStoreState`, `countervaluesInitialState` | What each app mounts at the `countervalues` store key: `{ rates, sync }` |
| `countervaluesSyncSlice`, `CountervaluesSyncState`, `CountervaluesLoad`, `countervaluesSyncInitialState` | The loop's slice, mounted at `sync` |
| `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed`, `countervaluesPollingSet` | The loop slice's events, typed `countervaluesSync/loadRequested` and so on |
| `countervaluesStateSelector`, `countervaluesSyncPendingSelector`, `countervaluesSyncErrorSelector`, `countervaluesSyncIsPollingSelector` | The selectors, typed on `{ countervalues: CountervaluesStoreState }`. The sync ones are the slice's `selectors`, bound to `countervalues.sync` |

The hooks read the store through `react-redux`, so they need a Redux store holding
`countervaluesReducer` at the `countervalues` key. The middleware, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` also need
the countervalues API from `@domain/api-market-countervalues` in that store.

## Setup

The package depends on no logging library. Register the app logger once at app setup; until then,
diagnostics are dropped:

```ts
import { setCountervaluesLogger } from "@features/platform-market-countervalues";
import { log } from "@ledgerhq/logs";

setCountervaluesLogger(log);
```

## Polling loop

The loop is a Redux middleware. Each app installs it **once** per store, with what only the app
knows; it does nothing until the app dispatches `startCountervaluesSync`:

```ts
createCountervaluesMiddleware({
  createSettingsSelector, // a fresh memoized selector of the app's CountervaluesSettings
  createRates, // (dispatch) => RateSource, real or mocked
  subscribeAppEvents, // optional: wires focus, network or app-state events to poll/start/stop
  persist, // optional: saves the raw state when it holds new rates
  restartOn, // optional: an action after which the loop starts again from the saved state
});

store.dispatch(startCountervaluesSync({ savedState }));
```

- Once started, it restores `savedState`, loads, subscribes to the supported ids and arms the polling
  timer. A settings change reloads after a 1s debounce; it does not restore again. `poll()`, `start()`
  and `stop()` from `useCountervaluesPolling` drive it through the slice's polling actions.
- `savedState` is the raw state read from disk at boot. It stays in the middleware, never in the
  store: no reducer keeps it, and it is never passed as preloaded state.
- `createSettingsSelector` is called on each start. Its selector must return the same object while
  the inputs are unchanged: a new one reloads.
- A failing step is logged and never reaches the dispatch that triggered it. A start whose settings
  cannot be computed starts nothing.

## Redux state

Each app mounts the reducer at the `countervalues` key and keeps its own persistence:

```ts
import { countervaluesReducer } from "@features/platform-market-countervalues";

combineReducers({ countervalues: countervaluesReducer /* , ... */ });
```

- `countervalues.rates` is the entity's rates slice (`countervaluesRatesSlice`, holding a
  `CounterValuesState`). `countervalues.sync` is this package's slice, the loop's state: `load`,
  `error` and `isPolling`. A wipe clears the rates and `error`, ends the load, and keeps a request
  and the polling flag.
- `load` is `idle`, `requested`, `loading` or `loadingThenRequested`. A poll asked for while a load
  is in flight waits for it to land, so loads never overlap. `countervaluesSyncPendingSelector` reads
  it as a boolean: a load is in flight.
- Read them through the selectors and hooks, never through the path: only this package knows where
  the rates are mounted.
- Each slice declares its own actions, so their types carry the slice name:
  `countervaluesRates/wipe`, `countervaluesSync/loadStarted`. Match on the action creators
  (`builder.addCase(wipeCountervalues, ...)`), never on the strings.
- The slice is mounted at `countervalues.sync`, not at its name, so `countervaluesSyncSlice.selectors`
  cannot read the store. Use the exported root selectors.
- Neither slice holds user settings. Each app computes its `CountervaluesSettings` from its own state,
  in the selector it gives the middleware.
