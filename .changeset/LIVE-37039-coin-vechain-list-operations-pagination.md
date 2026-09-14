---
"@ledgerhq/coin-vechain": patch
---

listOperations no longer advertises a next cursor, and honours the requested order

A page already covers every operation up to the current head, so the cursor it returned (the head
block, and the caller's own cursor on an empty page) never led to more results — a client paging
until `next` is falsy looped forever. The page is now returned without `next`.

`order` was accepted and ignored: `asc` and `desc` both returned newest-first. Operations are now
sorted in the requested order, `desc` remaining the default.
