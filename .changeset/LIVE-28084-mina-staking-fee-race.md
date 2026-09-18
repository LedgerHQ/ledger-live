---
"ledger-live-desktop": minor
---

Wait for the mina staking fee before handing the transaction to the device

Picking a validator only sets the recipient on the transaction; the bridge resolves the fee right
after. The continue button of the validator step was enabled as soon as a validator was selected, so
leaving for the device before the fee landed sent it a zero fee — which the mina signer rejects
outright with `Missing or wrong arguments`, without ever displaying the transaction. The button now
waits for the bridge, like the other delegation flows do.

The undelegate flow opens straight on the device step and has no footer to hold it back, so that
step now waits for the same signal before mounting the device action.
