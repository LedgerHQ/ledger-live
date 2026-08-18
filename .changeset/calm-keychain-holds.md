---
"@features/platform-card": minor
"live-mobile": minor
---

Keep the Pay Card session in OS secure storage (LIVE-34742)

`cardSession` now stores the whole session — both tokens and both lifetimes — through
`react-native-keychain` on native, and through renderer memory on web and desktop. The app already
uses that library for the app password, so the session needs no second secure-storage package.

Each key is a keychain `service` of its own, and the access token sits alone in one of them, so the
base query reads one small value per request. `AFTER_FIRST_UNLOCK` on iOS and `AES_GCM_NO_AUTH` on
Android state the same rule: no prompt, and a value a background launch can read, but nothing before
the first unlock after boot.

`cardSession.get` reads all three keys, so it waits its turn behind a write. A login over a live
session replaces the two cold keys before the access token, and a read between the two would report
the previous access token with the new refresh token.
