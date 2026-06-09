---
"@ledgerhq/cryptoassets": patch
---

Fix Cannot read property 'id' of undefined crash in RTK Query transformResponse handlers by adding Zod safeParse in cal-client transformTokensResponse
