---
"@ledgerhq/live-common": minor
---

Resume token discovery from the sync watermark instead of rewalking the whole history.

`getBalance` now receives the assets the account is already known to hold (`knownAssets`, derived
from its stored token sub-accounts) and the height to resume from (`fromHeight`, the same watermark
the operation walk uses). A module that supports both can skip the part of the history it has
already been told about; one that does not simply ignores them.

Measured against the production explorer on the account from the out-of-memory report, comparing a
full discovery with a resumed one:

| | requests | downloaded | time |
|---|---|---|---|
| full discovery | 343 | 223 MB | 1 415 s |
| resumed from the chain tip | 19 | 6 KB | 1 s |
| resumed from ~30 days back | 19 | 8 KB | 1 s |

Both resumed runs returned the same 135 balances over an identical asset set, so nothing is traded
for the saving.

The completeness `fromHeight` requires is held by the existing `syncHash`, which covers the
currency's CAL token list and the blacklist: the day a token becomes listed — or the user
blacklists one — the hash changes, the sync restarts from scratch, and everything is rediscovered.
Without that, a token listed after the watermark moved past its last transfer would never be found
again.
