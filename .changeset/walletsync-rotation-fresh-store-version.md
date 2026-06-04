---
"@ledgerhq/live-wallet": patch
---

fix(walletsync): on trustchain rotation, re-upload to the new CloudSync store at version 1 instead of reusing the previous store's version (the fresh store rejects the version gap with HTTP 500, leaving member removal stuck)
