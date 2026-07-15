---
"@domain/api-currency-token": minor
---

Add `@domain/api-currency-token`, the RTK Query client for token currencies backed by the Crypto
Asset List (CAL): `cryptoAssetsApi` (`findTokenById`, `findTokenByAddressInCurrency`,
`getTokensSyncHash`, `getTokensData`), the Zod token schema, the API→`TokenCurrency` converter
(registry-based parent lookup) and the Zod-validated RTK Query persistence helpers. Service URLs,
client version and an optional logger are injected via the store's thunk `extraArgument`
(`calApiExtra`), so the package owns no env/config/logging dependency. Typed on
`@domain/entity-currency-token` / `-crypto` / `-unit`; no `@ledgerhq/*` dependency.
Not yet wired into the apps.
