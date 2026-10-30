---
"@features/flow-account-detail-hero": minor
---

Account Detail hero logic: `AccountHeroPort` (balance, availability, funds, activity, `onAction` injected by each app) and `useAccountHeroViewModel`, which resolves the account-scoped quick actions and the mobile tile layout from `@features/platform-quick-actions` and owns the More sheet state. Also `resolveSwapConsole` and `resolveEmptyState`.
