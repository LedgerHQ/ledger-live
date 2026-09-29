---
"@features/flow-pay-card-transactions": patch
"@features/flow-pay-card-details": patch
"@features/flow-pay-card-assets": patch
---

Size the card transaction detail sheet to its content on mobile, so it no longer scrolls under its own header

- The transaction and asset-transaction scenes size the sheet to their rows instead of opening at full height, and hold their content in a plain view rather than a scrollable, so the sheet has nowhere to scroll and its header stays put.
- The card-details scenes declare whether they are scrollable next to their sizing, the way the manage-assets scene already behaved.
- Content-sized sheets reserve the bottom safe area, which their own height no longer leaves room for.
