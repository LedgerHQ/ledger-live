---
"@ledgerhq/wallet-cli": patch
---

`ring destroy` now handles the non-destructive application deactivation introduced by the LKRP
per-application close: it calls `destroyApplication` directly (which is idempotent on an
already-closed stream) and, when the member has been ejected from the ring (`TrustchainEjected` —
removed by another owner, or the trustchain destroyed remotely), treats the remote as already gone
and proceeds to the local credential wipe instead of aborting as a transient network failure.
`ring encrypt`/`ring decrypt` now surface actionable guidance when the wallet-cli application has
been deactivated on the ring.
