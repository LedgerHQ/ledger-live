---
"ledger-live-desktop": patch
"live-mobile": patch
---

Bump Lumen design-system packages: `lumen-design-core` 0.1.16, `lumen-ui-react` 0.1.37, `lumen-ui-rnative` 0.1.38, `lumen-ui-react-visualization` 0.1.16, `lumen-ui-rnative-visualization` 0.1.15, and `crypto-icons` 2.0.4.

Migrations required by the breaking changes in the range:

- **Menu (Radix UI → Base UI, react 0.1.36):** migrated `MenuTrigger asChild` → `render={...}` and `MenuItem onSelect` → `onClick` (Base UI fires `onClick`, not `onSelect`) in the AssetDetail options/chart menus and the Send network-fees / fee-asset selectors.
- **NavBar (react 0.1.36):** renamed `NavBarCoinCapsule`'s `icon` prop to `leadingContent` on the desktop asset header.
- **DotIndicator (rnative/react):** size scale was renamed and rescaled. Remapped consumers to preserve the rendered size (`xs`→`lg`, default→`xl`) on the desktop unread indicators and mobile top-bar unread indicator.
- **Select removal (rnative 0.1.38):** removed the now-deleted `GlobalSelectBottomSheet` from the mobile providers (no `Select` consumers remained).
