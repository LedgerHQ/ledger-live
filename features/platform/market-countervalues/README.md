# `@features/platform-market-countervalues`

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `@ledgerhq/live-countervalues-react` and live-common.

The countervalues React glue: the provider that polls rates through an app-supplied bridge, the
context it fills, and the hooks that read it. The rate state and its logic live in
`@domain/entity-market-countervalues`; fetching lives in `@domain/api-market-countervalues`.

## Exports

| Export | Description |
| --- | --- |
| `CountervaluesProvider` | Root provider. Polls rates through the `bridge` prop and fills the context |
| `CountervaluesBridge` | The persistence bridge each app builds; memoize it |
| `CountervaluesContext` | The React context the provider fills. Public only while `@ledgerhq/live-countervalues-react` shares it |
| `useCountervaluesState` | The full `CounterValuesState` |
| `useCountervaluesPolling` | Polling controls and status (`Polling`) |
| `useCountervaluesUserSettings` | The settings the countervalues were fetched with |
| `useCalculate`, `useCalculateCountervalueCallback` | Convert an amount with the current rates |
| `useSendAmount` | Fiat amount and reverse calculation for the send flow |
| `useUsdToFiatRate` | USD to fiat spot rate, polled every 60 seconds; `1` for USD without a request |
| `useGetCounterValueIdsPolling` | Currency ids sorted by market cap, polled every 30 minutes, with a default list |
| `setCountervaluesLogger` | Registers the app logger |

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

## One context during the migration

`@ledgerhq/live-countervalues-react` holds a copy of the provider and hooks until its consumers move
here. It reads this package's `CountervaluesContext` instead of creating its own, so a provider from
either package serves the hooks of both, and consumers can move one at a time.
