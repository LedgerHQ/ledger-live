---
"@ledgerhq/coin-internet_computer": patch
---

Report an Internet Computer stake whose ICP may have moved without a neuron to show for it — a transfer the node took without certifying, or one that settled and was then refused a claim or left without a verdict — as unconfirmed or unclaimed, never as a failed transaction, so the app does not offer to stake it again. A governance call the node takes without certifying is now polled rather than reported as failed.
