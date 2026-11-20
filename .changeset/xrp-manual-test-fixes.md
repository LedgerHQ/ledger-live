---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Fix XRPL token issues found in manual testing:

- XRPL history skips operations newer than the synced ledger, which narrows the gap with the balance
- Add token: missing XRP shows on the review with a Receive action, instead of as a trust limit error
- Add token: the review waits for the issuer fee, and says when it can't be fetched with a Try again action
- Add token: trust limit errors show their description, such as "Use Max to set the highest limit."
- Add, edit and remove token: the success screen says the request was sent and applies once the network confirms it
- Send: the issuer fee row shows a placeholder while the fee is computed
- Send: token refusals have short titles, such as "Token is frozen"
- Send: a frozen or unauthorized token blocks the recipient step instead of asking the recipient to add the token
- Receive and empty token accounts name the account's token types (IOU, MPT)
- Token add, edit and remove rows in history show the token issuer instead of the token code
