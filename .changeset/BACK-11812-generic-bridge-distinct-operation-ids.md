---
"@ledgerhq/live-common": minor
---

Give each operation of a transaction its own id in the generic bridge: internal operations and token operations repeating an account, transaction and type are numbered (`encodeSubOperationId`), as the A4 client does, instead of sharing the first one's id
