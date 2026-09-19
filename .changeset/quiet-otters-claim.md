---
"@ledgerhq/coin-internet_computer": minor
---

Report an Internet Computer stake whose outcome the network did not settle as unconfirmed or unclaimed, never as a failed transaction, so the app does not offer to stake it again.

That covers a transfer the node took without certifying, or answered with a certificate that could not be read, and one that settled and was then refused a claim or left without a verdict. A call the node refused before replication, or the replica rejected, is reported as rejected: nothing ran, so it can be retried. A governance call the node takes without certifying is polled rather than reported as failed, and a refused status read is polled past rather than taken for a refused call.
