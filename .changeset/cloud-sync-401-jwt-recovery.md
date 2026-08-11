---
"@ledgerhq/ledger-key-ring-protocol": minor
"@shared/cloud-sync": minor
---

Fix Ledger Sync surfacing a 401 instead of refreshing the expired JWT

`@shared/cloud-sync` threw a bare `Error` carrying only `HTTP <status> on <method> <url>`, dropping
both the HTTP status and the backend's response body. The trustchain JWT recovery in
`genericWithJWT` could not classify it, so an expired token was rethrown instead of being refreshed
and retried: the 401 reached the UI, and on mobile it fed the wallet-sync error into the account
sync indicator ("Some account data couldn't load").

`CloudSyncHttpError` now carries `status`, `url`, `method` and the backend's verbatim message, and
`auth.ts` classifies 4xx from the numeric `status` rather than from the `LedgerAPI4xx` class name,
so recovery no longer depends on which transport made the call. The error contract expected by the
trustchain layer is documented in `auth.ts`; a transport whose errors are not `Error`-shaped must
remap to it at its boundary.
