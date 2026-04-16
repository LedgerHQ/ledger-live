---
"@ledgerhq/coin-concordium": minor
"live-mobile": minor
---

Replace dynamic import of @walletconnect/sign-client with static import and add rspack ProvidePlugin for TextDecoder polyfill to fix mobile code splitting and startup crash
