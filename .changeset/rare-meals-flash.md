---
"@ledgerhq/ledger-key-ring-protocol": minor
---

🔍✨ Improve detection of legacy import base64 strings and invalid address scans

- Better handling of legacy `Qrcode` base64 imports using stricter format and header checks
- Improved error resilience when scanning addresses (ETH, BTC, etc.) instead of base64
- Ignores invalid or malformed input early, reducing false positives
