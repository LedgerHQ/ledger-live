---
"ledger-live-desktop": minor
"live-mobile": minor
---

Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

- Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
- Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
- Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
- Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.
