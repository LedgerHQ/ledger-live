---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add `agent-intent sync` to import Ledger Sync accounts with the agent's key

`agent-intent sync --profile <id>` restores the App-16 trustchain with the enrolled agent's own key
(no device) and merges the synchronized accounts into the session — additive and idempotent, with
unsupported currency families reported as skipped and malformed entries as invalid. The Cloud Sync
version is cached per profile, a rotated Ledger Sync key updates the profile's account access, and
an agent removed from Ledger Sync is reported without deleting anything.
