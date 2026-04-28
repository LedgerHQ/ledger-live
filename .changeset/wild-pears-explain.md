---
"ledger-live-desktop": minor
---

Migrate `@ledgerhq/crypto-icons` to v2 (desktop only).

Bumps `@ledgerhq/crypto-icons` from `1.4.0` to `2.0.1` for `ledger-live-desktop`. The catalog version (`1.4.0`) is preserved for mobile, web-tools and the UI packages, which can migrate later.

Adapts every `CryptoIcon` and `SquaredCryptoIcon` callsite to the v2 API:

- `size` is now numeric (`12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64`) instead of pixel strings.
- `overridesRadius` is replaced by `shape="square" | "circle"`. The `SquaredCryptoIcon` wrapper now sets `shape="square"` explicitly; everywhere else relies on the new default `shape="circle"`.
- `ticker` is now required — guarded the only optional callsite (`AccountListItem`).
- Local `getValidCryptoIconSize` re-export now returns numbers (`getValidCryptoIconSizeNative`) to match the new size type.

No visual or behavioral change is expected: icons rendered as circles stay circles, squared icons stay squared via the dedicated wrapper.
