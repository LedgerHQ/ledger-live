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
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";

const server = listenToCardApi([...signedInCardApiHandlers, revealCardDetailsHandler]);
```

`listenToCardApi` accepts optional default handlers (restored on `resetHandlers`). `cardApiWrapper`
and `CardApiStoreProvider` only mount Redux — i18n and extra providers stay in the consumer.

## Shared handlers

- `signedInCardApiHandlers` — `GET /v1/card/status` and `GET /v1/user` for a holder whose card is
  live, the baseline every card screen reads
- `revealCardDetailsHandler` / `revealCardDetailsFailureHandler` — `POST /v1/card/details/token`,
  the single-use token and image URL the Reveal tile flips the card face to

## What stays in the consumer

- Endpoint URLs and response bodies only one flow reads
- Extra providers (`I18nTestProvider`, theme, navigation)
