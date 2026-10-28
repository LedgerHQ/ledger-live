---
"@domain/api-currency-token": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

The stored CAL token cache is restored without a wait for CAL, so Desktop and Mobile no longer stay on the loading screen when CAL hangs. Tokens of a currency with a stored hash are restored whatever their age, and the hash is checked in the background: a changed hash evicts the token cache, and a failed check keeps the stored tokens and hash. Tokens of a currency with no stored hash keep the 24 h limit, because no check can find them stale.

`restoreTokensToCache(dispatch, persistedData)` is now synchronous and takes no `ttl`. `filterExpiredTokens` is removed.
