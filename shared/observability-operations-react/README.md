# @shared/observability-operations-react

> [!CAUTION]
> **Status: UNSTABLE** — New package: the hook API may change while the first flows adopt it.

React hook driving one operation of
[`@shared/observability-operations`](../observability-operations/README.md) from a component, on
web and native.

## Usage

```ts
import { useOperation } from "@shared/observability-operations-react";

const operation = useOperation("checkout", { operationKey: cartId });

operation.start({ currency_id: currency.id });
operation.succeed({ items: 2 });
operation.fail("ERROR", { error_name: error.name });
```

`useOperation(name, { operationKey?, abandonOnUnmount = true })` returns `start`, `succeed`, `fail`
and `isActive`, stable across renders.

- The handlers act on the operation this component started, with the name and key it was started
  with. Once that operation ended, they do nothing, even when another operation of the same name
  and key started since.
- One operation at a time: `start` returns `false` while the component's operation is active.
- A new `name` or `operationKey` is a new operation: the component's still active one fails as
  `ABANDONED` with `{ trigger: "identity_change" }`, and `start` opens the next.
- On unmount, a still active operation of this component fails as `ABANDONED` with
  `{ trigger: "unmount" }`, unless `abandonOnUnmount` is `false`.
- To end an operation another component started, call `failOperation` or `succeedOperation` from
  `@shared/observability-operations`.

## Tests

`createUseOperation(tracker)` builds the hook on a tracker of your own, made with
`createOperationTracker` and a fake sink.
