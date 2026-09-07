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
