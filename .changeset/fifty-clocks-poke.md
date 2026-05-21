---
"ledger-live-desktop": minor
---

Add Tezos stake flow modal (LIVE-29536). Wires the Stake CTA from the Earning Choice modal to a 5-step flow (validator → confirm delegation → amount → confirm staking → confirmation) for non-delegated accounts, or a 3-step flow (amount → confirm staking → confirmation) when entered with `skipDelegation: true` from an already-delegated account.
