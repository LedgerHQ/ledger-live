---
"@features/platform-intent-wallet-sync": minor
"@devtools/bindings": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Keep the Ledger Sync result of an add or remove member run when the device disconnects after the user approved it, unless Ledger Sync was reset in between. Each app orders late results with its own result order, passed in every add and remove member input. Ledger Wallet Desktop tracks the activation when the result arrives, so a late activation is tracked too.
