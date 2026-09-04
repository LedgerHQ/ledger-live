---
"@domain/api-card-management": minor
---

Add `freezeCard` and `unfreezeCard` for `POST /v1/card/freeze` and `POST /v1/card/unfreeze`.

- Mutations taking no argument: the provider documents no request body for either.
- Both invalidate `CardStatus`, so the status refetches itself after the card moves between `ACTIVE` and `FROZEN` — no caller has to sequence the two.
- Each carries its own documented 400: `Card is already frozen` on freeze, `Card is not frozen` on unfreeze.
- Drops the README row for `initiateAuthorize`, which the endpoint table still listed after that endpoint was removed.
