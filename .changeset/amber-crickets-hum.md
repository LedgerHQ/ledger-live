---
"@ledgerhq/coin-concordium": minor
---

Report PLT transfers in the history of the token sub-account they moved

`tokenUpdate` transactions were parsed away, so a PLT transfer showed nowhere.
They now become operations on the token sub-account, valued in the token rather
than in the CCD a native transfer folds its fee into. The fee stays on the
parent account as a separate operation, typed from whether the account actually
paid one, so that an outgoing transfer is charged for it exactly once and an
incoming one is charged nothing. A `tokenUpdate` that is not a transfer, such as
a mint or a pause, still records the CCD it cost the account that paid. The
`api/` surface describes these operations as the token they moved instead of as
the native asset. Accounts now carry a `syncHash` covering the CAL and the token
flag, so enabling tokens re-reads the history rather than leaving earlier
transfers behind the sync watermark.

Reading that history now follows the proxy's cursor to the end instead of
stopping at the first page, so an account with more transactions than one page
holds no longer loses the rest of them, and a failed page reports the failure
rather than passing for the end of the history. Pages are read at the size the
proxy actually allows, and rewards are excluded from the request, having only
ever been fetched and discarded. The account keeps what a re-read returns rather
than merging it over what was already stored, which is what lets a correction
reach an operation recorded by an earlier version.

A rejected transfer is recorded rather than dropped. The proxy reports one
without any of its transfer fields, so it used to parse to nothing and the CCD
it cost the sender went unaccounted for; it now appears as a failed operation
worth its fee, matching what a rejected token transfer already did. Neither
reports an empty address as a counterparty any more.
