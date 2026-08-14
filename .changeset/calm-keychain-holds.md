---
"@features/platform-card": minor
"live-mobile": minor
---

Keep the Pay Card session in OS secure storage (LIVE-34742)

`cardSession` now stores the whole session — both tokens and both lifetimes — through
`expo-secure-store` on native, and through renderer memory on web and desktop. The access token sits
in its own key, so the base query reads one small value per request and no value approaches the
2048-byte limit of the native store.
