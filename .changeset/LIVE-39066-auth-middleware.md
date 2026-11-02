---
"@shared/auth": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/wallet-cli": minor
---

`@shared/auth` replaces `authApiExtra` with `createAuthMiddleware`: the auth provider is held by a store middleware instead of the thunk `extraArgument`, and `getAuthProvider(dispatch)` reads it.
