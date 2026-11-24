# @shared/observability-operations

> [!CAUTION]
> **Status: UNSTABLE** — New package: the operation API may change while the first flows adopt it.

Tracks named operations (a step the app performs, from its start to a success or a failure) and
sends their events to a sink the app registers. React-free and vendor-agnostic: the app maps the sink to its
monitoring tool, for example Datadog RUM feature operations. The React hook lives in
[`@shared/observability-operations-react`](../observability-operations-react/README.md).

## Track an operation

```ts
import { failOperation, startOperation, succeedOperation } from "@shared/observability-operations";

const id = startOperation("checkout", { attributes: { currency_id: "bitcoin" } });
succeedOperation("checkout", { attributes: { items: 2 } });
failOperation("checkout", "ERROR", { attributes: { error_name: error.name } });
```

- **Start** sends only when a sink is registered and records. It returns the operation id, or
  `null`. Starting an active operation again keeps the first start.
- **Stop** (`succeedOperation`, `failOperation`) sends only when its start was sent, once, to the
  sink of that start. Its attributes are merged over the start attributes. `expectedId` stops the
  operation only if it is still the one that id started.
- **Failure reasons**: `ERROR` (a technical failure), `ABANDONED` (the user left it), `OTHER` (any
  other failure). Monitoring counts `OTHER` against availability like `ERROR`, so an expected dead
  end, such as nothing to add, succeeds with an `outcome` attribute instead.
- **Keys**: `operationKey` tells apart concurrent instances of one name.
- **Names** match `^[\w.@$-]+$`; any other name makes every call a no-op.
- **Attributes**: `undefined` values are dropped. Use snake_case keys, and never send addresses,
  amounts or account ids.
- **Stale operations**: an operation started more than 4 hours ago (the longest monitoring session)
  is dropped without a stop, so a leaked one never blocks its name. Each start drops the stale
  operations of every name and key, so a leaked one-off key is not kept either.
- **Safety**: a throwing sink never reaches the caller.

`isOperationActive(name, { operationKey, expectedId })` tells whether an operation is active, and
`getOperationId(name, operationKey)` gives the id of the active one, or `null`.

## Sink registration (apps only)

```ts
import { setOperationSink } from "@shared/observability-operations";

setOperationSink({
  isRecording: () => monitoringRecords(),
  start: (name, operationKey, attributes) => vendor.start(name, operationKey, attributes),
  succeed: (name, operationKey, attributes) => vendor.succeed(name, operationKey, attributes),
  fail: (name, operationKey, reason, attributes) => vendor.fail(name, operationKey, reason, attributes),
});
```

The sink handles its vendor's promises and errors. Mobile registers its Datadog sink in
`apps/ledger-live-mobile/src/datadogObservers.ts`.

## Tests

`createOperationTracker({ now })` builds a tracker of its own, with the same `setSink`, `start`,
`succeed`, `fail`, `isActive` and `getId`, so a test needs no shared state or reset.
