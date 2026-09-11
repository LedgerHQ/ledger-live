# @support/msw-features-flow-pay-card

> [!CAUTION]
> **Status: UNSTABLE** — New package; the harness is still being adopted by Pay Card flows.

MSW + RTK Query test store for `features/flow/pay-card-*` packages.

Every Pay Card flow that talks to card-management needs the same signed-in session stub, the same
`cardApi` extra argument, and an MSW server that fails on unhandled requests.

## Usage

```jsonc
// package.json
"devDependencies": {
  "@support/msw-features-flow-pay-card": "workspace:*"
}
```

```ts
import {
  CARD_API_BASE_URL,
  cardApiWrapper,
  listenToCardApi,
  makeCardApiStore,
} from "@support/msw-features-flow-pay-card";

const server = listenToCardApi();
```

`listenToCardApi` accepts optional default handlers (restored on `resetHandlers`). `cardApiWrapper`
and `CardApiStoreProvider` only mount Redux — i18n and endpoint fixtures stay in the consumer.

## What stays in the consumer

- Endpoint URLs and response bodies for that flow
- Extra providers (`I18nTestProvider`, theme, navigation)
- Handlers that only one flow needs
