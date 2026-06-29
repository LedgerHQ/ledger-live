---
"@features/platform-currencies": minor
---

Add `@features/platform-currencies`, the app-facing currency runtime. Exports `buildCryptoAssetsStore` (the `CryptoAssetsStore` adapter over `@domain/api-currency-token`), a local `CryptoAssetsStore` port typed on the domain `TokenCurrency`, and the `useCryptoCurrencyById` / `useTokenById` / `useTokensData` / `useSupportedCurrencies` / `useFeatureFlaggedCurrencies` hooks. Supported-set resolution applies feature-flag gating via `@features/platform-feature-flags` over a registry-backed list (no own supported list). Runtime glue only — no slices; app-store wiring (single-source gate) is handled separately.
