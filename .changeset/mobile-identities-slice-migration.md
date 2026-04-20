---
"live-mobile": minor
---

Migrate to unified identities slice: single source of truth for userId/datadogId. Boot init merges legacy "user" into "identities" (legacy trusted first), then deletes "user". All consumers use identities selectors; remove getOrCreateUser, setUser, updateUser.
