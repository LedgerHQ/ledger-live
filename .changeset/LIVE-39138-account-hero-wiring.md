---
"live-mobile": minor
"@features/flow-account-detail": patch
---

Account Detail shows the hero: account balance (native + tokens), quick-action tiles (Transfer · Swap · More, or Buy / Sell tiles when nothing can be swapped) and the More sheet (Buy · Sell · Earn), all scoped to the account. Transfer opens the Transfer sheet on the account. Buy and Swap open the asset drawer on the account's network (every supported asset of that network, held or not), then open prefilled with the picked asset; when the network only has its coin, the drawer picks it directly. Swap brings the picked asset into this account (the source is chosen in Swap). Buy and Sell follow the `ptxServiceCtaScreens` flag. Sell and Earn ask which of the account's assets with a balance to use, and open directly when only one qualifies. Section spacing follows Figma (24px between sections on mobile).
