This SignTransaction flow and modal is mostly a duplicate from the [Send one](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/ledger-live-desktop/src/renderer/modals/Send/index.tsx).
It has been introduced almost 2 years ago during a POC of the "live-app-sdk" (now "wallet-api").
cf. https://github.com/LedgerHQ/ledger-live-desktop/pull/3798

As of today, it is only used by the sign transaction logic in the [`PlatformAPIWebview`](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/ledger-live-desktop/src/renderer/components/Web3AppWebview/PlatformAPIWebview.tsx#L98-L142) and [`WalletAPIWebview`](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/ledger-live-desktop/src/renderer/components/Web3AppWebview/WalletAPIWebview.tsx#L93-L113)

The only difference between this flow and the send flow revolves around the steps displayed in each one and the logic surrounding which step to start from:

- The SignTransaction flow does not have a "recipient" step since this info is provided by the live-app
- The SignTransaction flow starts at the "summary" step by default, bypassing the selection fee step **if** the live-app already provides fees infos (but the user can still go back to the fee step in LL to edit them if he wants to)

To avoid code duplication, divergence between similar flows (sending some coin or token vs signing a tx provided by a live-app, resulting in the same action of sending coin or tokens) and ensure a more coherent user experience, this duplication should be removed.

It can be done in multiple ways, including:

1. Keeping the SignTransaction flow (`Body` and `index`) as separate from the send one, but using the relevant steps and components from the send flow, instead of merely duplicating this code as done today
2. Get rid of the SignTransaction flow entirely and only use the Send flow (would need a bit of a rework on the Send flow to accommodate the specific behaviour / logic described above)
