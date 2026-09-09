---
"@domain/api-card-management": patch
---

Accept a card status with no holder name or expiry date.

- A live card answers `/v1/card/status` without `holderName` or `expiryDate`, and the response was rejected, so the endpoint returned nothing at all.
- Both are optional now; every other field stays required.
