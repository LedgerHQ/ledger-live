---
"ledger-live-desktop": minor
---

refactor: remove the Wallet 4.0 feature flag and delete the legacy classic dashboard

The Wallet 4.0 layout is now the default. Removed the `isWallet40Enabled` branching across the Page, Portfolio and layout components, and deleted the unused legacy dashboard screens (classic dashboard, empty states, featured buttons, no-accounts illustration). The `/` route now renders the MVVM `PortfolioPage` directly.
