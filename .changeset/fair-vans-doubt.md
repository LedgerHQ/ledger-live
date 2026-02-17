---
"@ledgerhq/wallet-api-acre-module": minor
"@ledgerhq/wallet-api-feature-flag-module": minor
"@ledgerhq/live-common": minor
"@ledgerhq/dummy-wallet-app": minor
"@ledgerhq/wallet-api-deeplink-module": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

feat(wallet-api): add bitcoin.getAddresses handler for PSBT sign flow

- Add bitcoinFamilyAccountGetAddressesLogic to return payment addresses for a Bitcoin account: first external, unused receive/change indices, and addresses with UTXOs; support optional intentions filter (e.g. "payment" only).
- Register bitcoin.getAddresses handler in Wallet API server and add tracking (requested / fail / success).
- Refactor useWalletAPIServer: keep a single WalletAPIServer instance via useRef and update config, permissions, and custom handlers in useEffect to avoid re-creation on re-renders.
- Bump @ledgerhq/wallet-api-client (^1.13.0), @ledgerhq/wallet-api-core (^1.28.0), @ledgerhq/wallet-api-server (^3.1.0) and related packages across deeplink-, exchange-, feature-flag-, acre-module and dummy-wallet-app.
- Add unit tests for bitcoinFamilyAccountGetAddressesLogic (intentions, error cases, address list shape, receive/change counts, UTXO addresses).
