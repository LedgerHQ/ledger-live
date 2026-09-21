---
"@ledgerhq/coin-concordium": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(concordium): drop the PLT error surface nothing can reach

`mapPltRejectReason` turned a chain reject reason into a typed `Error` and had no
caller. It could not gain one: an `Error` is what the pre-send checks return and
what the signer throws, and neither ever sees a reject reason. A reject reason
exists only on the wallet-proxy history response, and history renders an
`Operation`, which carries `failed: true` and no cause. Surfacing the cause means
a code in `Operation.extra` and a renderer for it, not this function.

Removed with it: `ConcordiumNonExistentTokenId` and `ConcordiumPltTransferRejected`,
whose only producer it was, and `ConcordiumAccountNotAllowed` and
`ConcordiumAccountDenied`, which never had one — `getAccountListStatus` folds both
list verdicts into one, so reporting the cause means widening the stored
`transferStatus` first.

A test in each app now pins that every PLT error a producer can raise has copy of
its own, so the next one added without it fails rather than reaching a user as a
class name.
