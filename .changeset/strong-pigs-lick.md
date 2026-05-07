---
"@ledgerhq/cryptoassets": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

Switch Concordium derivation to canonical 6-segment path `m/44'/<coin>'/0'/0'/0'/<account>'` and split mainnet/testnet coin types (`919`/`1`, the BIP-44 generic testnet). Replaces the previous non-canonical `44'/919'/404'/404'/<account>'` override and aligns with the upstream SDK and device firmware.
