---
"live-mobile": minor
"ledger-live-desktop": minor
---

Add PortfolioBalanceSection component for wallet balance display with three states (normal, noFund, noSigner) behind graph_rework feature flag.

Unify currency formatting across mobile and desktop:
- Mobile: Use formatCurrencyUnitFragment with AmountDisplay from lumen-ui-rnative
- Desktop: Migrate BalanceView to use AmountDisplay from lumen-ui-react, remove formatBalanceParts utility
- Both platforms now use the same formatter callback pattern with Lumen components handling currency positioning
