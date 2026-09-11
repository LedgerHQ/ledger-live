---
"@domain/api-card-management": patch
"live-mobile": patch
---

Answer the mocked wallet endpoints with three linked wallets.

- `GET /v1/wallet/internal` and `/card_linked` now describe three wallets on three chains (usdc/ethereum, btc/bitcoin, sol/solana) instead of one.
- Every wallet is linked, so the join matches all three and the balance screen has rows that price differently.
- Unfunded empties the balances rather than dropping the wallets.
