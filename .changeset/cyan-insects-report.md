---
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/coin-tron": minor
---

Respect a custom fee limit passed to a TRC-20 `craftTransaction` instead of flooring it to `DEFAULT_TRC20_FEES_LIMIT` (LIVE-36391).

The generic coin framework migration started raising any override below 50M sun (and `0`) to the default, so a caller-chosen `fee_limit` was silently ignored. The value now passes straight through; the default applies only when no custom fee is provided.
