---
"@ledgerhq/wallet-cli": minor
---

Add `agent-intent ring-access`: an enrolled profile asks the human to add its encryption key to their Ledger Key Ring through a signed link, waits for the answer (or hands the wait to a background listener with `--detach`, followed by `agent-intent wait`), checks the grant with the encryption key and saves it on the profile. `list` and `show` report the profile's ring access.
