---
"@ledgerhq/live-common": minor
---

fix(wallet-api): include parent currency when requesting tokens with family pattern

When using currency patterns like "ethereum/\*\*" in currency.list requests,
ensure the parent currency (e.g., "ethereum") is included alongside its
tokens. This prevents scenarios where token accounts are requested but the
parent currency itself is missing from the response.
