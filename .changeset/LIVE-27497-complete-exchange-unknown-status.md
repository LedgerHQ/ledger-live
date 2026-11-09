---
"@ledgerhq/live-common": minor
---

A `CompleteExchangeError` raised by a device status code the Exchange app does not map now keeps that code in its message (`Unknown device status 0x6807 (UNKNOWN_ERROR)`), so it reaches swap monitoring as `errorMessage`. Its title stays unset.
