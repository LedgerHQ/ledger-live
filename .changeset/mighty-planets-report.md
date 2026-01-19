---
"@ledgerhq/types-live": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

feat: add transaction source tagging with headers for broadcast

Add TransactionSource type and source field to BroadcastConfig to track
transaction origins (dApp, live-app, coin-module, swap) and transmit them
as X-Ledger-Source-Type and X-Ledger-Source-Name headers when broadcasting
to blockchain explorers for Bitcoin and EVM.

Changes:
- Add TransactionSource type with type and name fields to types-live
- Extend BroadcastConfig with optional source field
- Thread source through Bitcoin broadcast chain (broadcast.ts → wallet.ts → xpub.ts → explorer)
- Thread source through EVM broadcast in ledger node API
- Update Desktop to pass source in:
  - Live app broadcasts (LiveAppSDKLogic.ts)
  - Swap flows (CompleteExchange Body.tsx)
  - Native send flows (GenericStepConnectDevice.tsx)
- Update Mobile to pass source in:
  - Native transaction flows (screenTransactionHooks.ts)
  - Platform exchange (CompleteExchange.tsx)
  - Swap flows (Confirmation.tsx)
- Update wallet-api integrations (react.ts, useDappLogic.ts)
