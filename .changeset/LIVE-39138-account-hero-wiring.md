---
"live-mobile": minor
"@features/flow-account-detail": minor
"@features/platform-quick-actions": minor
---

Account Detail shows the hero: account balance (native + tokens) and quick-action tiles scoped to the account. A funded account gets Transfer · Swap · More (or Buy / Sell tiles when nothing can be swapped) with Buy · Sell · Earn in More; an account without funds gets Transfer and Buy only. Transfer opens the Transfer sheet on the account. Buy and Swap open the asset drawer on the account's network (every supported asset of that network, held or not), then open prefilled with the picked asset; when the network only has its coin, the drawer picks it directly. Swap brings the picked asset into this account (the source is chosen in Swap). Send, Sell and Earn ask which of the account's assets supporting the action to use, including those without balance, ordered by countervalue, and open directly when only one qualifies. `@features/platform-quick-actions` now owns the account asset rules (`listHeldAssets`, `hasAnyFunds`, `resolveAssetsByAction`, `sortAssetsByValue`); on desktop, Earn is shown inactive without funds. Section spacing follows Figma (24px between sections on mobile).
