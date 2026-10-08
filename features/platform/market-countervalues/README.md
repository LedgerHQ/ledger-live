# `@features/platform-market-countervalues`

> [!CAUTION]
> **Status: UNSTABLE**. The API may still change.

The countervalues React and Redux glue: the provider that polls rates through an app-supplied
bridge, the context it fills, the hooks that read it, and the Redux slice both apps mount. The rate
state and its logic live in `@domain/entity-market-countervalues`; fetching lives in
`@domain/api-market-countervalues`.

## Exports

| Export | Description |
| --- | --- |
| `CountervaluesProvider` | Root provider. Polls rates through the `bridge` prop and fills the context |
| `CountervaluesBridge` | The persistence bridge each app builds; memoize it |
| `useCountervaluesState` | The full `CounterValuesState` |
| `useCountervaluesPolling` | Polling controls and status (`Polling`) |
| `useCountervaluesUserSettings` | The settings the countervalues were fetched with |
| `useCalculate`, `useCalculateCountervalueCallback` | Convert an amount with the current rates |
| `useSendAmount` | Fiat amount and reverse calculation for the send flow |
| `useUsdToFiatRate` | USD to fiat spot rate, polled every 60 seconds; `1` for USD without a request |
| `useGetCounterValueIdsPolling` | Currency ids sorted by market cap, polled every 30 minutes, with a default list |
| `setCountervaluesLogger` | Registers the app logger |
| `countervaluesReducer`, `CountervaluesState`, `countervaluesInitialState` | The Redux slice each app mounts at the `countervalues` store key |
| `setCountervaluesState`, `setCountervaluesStatePending`, `setCountervaluesStateError`, `setCountervaluesPollingIsPolling`, `setCountervaluesPollingTriggerLoad`, `wipeCountervalues` | The slice's action creators |
| `countervaluesStateSelector`, `countervaluesStatePendingSelector`, `countervaluesStateErrorSelector`, `countervaluesPollingIsPollingSelector`, `countervaluesPollingTriggerLoadSelector` | The slice's selectors, typed on `{ countervalues: CountervaluesState }` |

The hooks throw outside a `CountervaluesProvider`. `useUsdToFiatRate` and
`useGetCounterValueIdsPolling` also need a Redux store holding the countervalues API from
`@domain/api-market-countervalues`.

## Setup

The package depends on no logging library. Register the app logger once at app setup; until then,
diagnostics are dropped:

```ts
import { setCountervaluesLogger } from "@features/platform-market-countervalues";
import { log } from "@ledgerhq/logs";

setCountervaluesLogger(log);
```

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
- The slice holds no user settings. Each app computes its `CountervaluesSettings` from its own state
  and returns them from the bridge's `useUserSettings`, memoized on their inputs.
- The reducer is a plain function, not `createSlice` or `createReducer`: immer would deep-freeze the
  stored rate `Map`s, and `loadCountervalues` updates them in place on the next poll.
