---
"@ledgerhq/coin-aptos": patch
---

Fix a TypeError when converting Aptos transaction history to operations for transactions whose payload is not an entry-function payload (e.g. script, module bundle or multisig payloads), which caused the Daily Coin Monitoring workflow to fail
