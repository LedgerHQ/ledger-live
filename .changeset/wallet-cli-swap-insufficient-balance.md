---
"@ledgerhq/wallet-cli": patch
---

fix(wallet-cli): reject unaffordable swaps with a typed error instead of a raw HTTP status

JSON error envelopes of every command now carry a `code` (the error name, omitted for built-in errors) and, for swap backend rejections, `http_status`.
