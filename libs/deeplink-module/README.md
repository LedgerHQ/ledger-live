# deeplink-module

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/wallet-api-deeplink-module` is a Wallet-API module that adds deep-link handling to Live apps embedded in Ledger Live. It allows web apps and DApps running inside the Ledger Live browser to trigger in-app navigation or actions by emitting deep-link URLs, which the host app then resolves.

## What it does

- Exposes a Wallet-API module interface for deep-link dispatch
- Lets DApps request navigation to specific screens inside Ledger Live (e.g. send, receive, swap) via a standardised URL scheme
- Decouples deep-link intent from platform routing so the same module works on desktop and mobile

## Key exports / concepts

- Module class / factory (exported from `index.ts`) — registers the deep-link handler on a Wallet-API server
- `types.ts` — TypeScript types for deep-link payloads and handler signatures

## Usage context

Registered as an optional module when instantiating a Wallet-API server in `apps/ledger-live-desktop` or `apps/ledger-live-mobile`. Works alongside other Wallet-API modules (`@ledgerhq/wallet-api-exchange-module`, etc.).
