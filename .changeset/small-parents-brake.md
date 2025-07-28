---
"@ledgerhq/coin-solana": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

fix: improve solana raw tx handling

- Implemented handling of raw Solana transactions in the SendFunds summary screen.
- Updated transaction building and signing processes to accommodate raw transaction types.
- Introduced new types and command descriptors for raw transactions in the Solana module.
- Enhanced error handling and user feedback for raw transactions.
- Added mock data and tests to ensure proper functionality of raw transaction features.
