---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Split wallet-api `useDappLogic` into granular logic/handlers/react modules mirroring the react.ts/logic.ts split. Internal refactor with no behavior change: the dApp EIP-1193 business logic moves to `wallet-api/logic/dapp`, the JSON-RPC method handlers to `wallet-api/handlers/dapp`, and the hooks (`useDappLogic`, `useDappAccountLogic`, `useDappCurrentAccount`) to `wallet-api/react`. Consumers updated to the new direct module imports.
