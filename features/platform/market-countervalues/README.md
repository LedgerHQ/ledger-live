# `@features/platform-market-countervalues`

> [!CAUTION]
> **Status: UNSTABLE**. The API may still change.

The countervalues Redux glue: the slice both apps mount, the middleware that polls rates into it,
and the hooks that read it. The rate state and its logic live in
`@domain/entity-market-countervalues`; fetching lives in `@domain/api-market-countervalues`.

## Exports

| Export | Description |
| --- | --- |
| `createCountervaluesMiddleware` | The polling loop as a Redux middleware, inert until started. Install it once per store |
| `startCountervaluesSync`, `stopCountervaluesSync` | Start the loop with the saved state, and stop it |
| `haveSameTrackingPairs` | Result equality check for a settings selector: same pairs while accounts resynchronize |
| `useCountervaluesState` | The full `CounterValuesState` |
| `useCountervaluesPolling` | Polling controls and status (`Polling`) |
| `useCalculate`, `useCalculateCountervalueCallback` | Convert an amount with the current rates |
| `useSendAmount` | Fiat amount and reverse calculation for the send flow |
| `useUsdToFiatRate` | USD to fiat spot rate, polled every 60 seconds; `1` for USD without a request |
| `useGetCounterValueIdsPolling` | Currency ids sorted by market cap, polled every 30 minutes, with a default list |
| `setCountervaluesLogger` | Registers the app logger |
| `countervaluesReducer`, `CountervaluesState`, `countervaluesInitialState` | The Redux slice each app mounts at the `countervalues` store key |
| `setCountervaluesState`, `setCountervaluesStatePending`, `setCountervaluesStateError`, `setCountervaluesPollingIsPolling`, `setCountervaluesPollingTriggerLoad`, `wipeCountervalues` | The slice's action creators |
| `countervaluesStateSelector`, `countervaluesStatePendingSelector`, `countervaluesStateErrorSelector`, `countervaluesPollingIsPollingSelector`, `countervaluesPollingTriggerLoadSelector` | The slice's selectors, typed on `{ countervalues: CountervaluesState }` |

The hooks read the slice through `react-redux`, so they need a Redux store holding it at the
`countervalues` key. The middleware, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` also need
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

## Redux slice

Each app mounts the reducer at the `countervalues` key and keeps its own `useSelector` hooks and
persistence:

```ts
import { countervaluesReducer } from "@features/platform-market-countervalues";

combineReducers({ countervalues: countervaluesReducer /* , ... */ });
```

- The action types are plain strings such as `COUNTERVALUES_WIPE`, not `countervalues/wipe`. Other
  reducers listen to them, so match on the action creators (`builder.addCase(wipeCountervalues, ...)`)
  rather than on the strings, and never rename one without updating every listener.
- The slice holds no user settings. Each app computes its `CountervaluesSettings` from its own state,
  in the selector it gives the middleware.
- The reducer is a plain function, not `createSlice` or `createReducer`: immer would deep-freeze the
  stored rate `Map`s, and `loadCountervalues` updates them in place on the next poll.
