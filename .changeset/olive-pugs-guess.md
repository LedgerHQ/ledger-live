---
"@ledgerhq/coin-internet_computer": minor
---

Fix seven defects in the Internet Computer neuron implementation.

Operation history: governance calls were typed `FEES` and filed as a fee that was never charged, with an explorer link that always 404s, and now stay out of history entirely; a settled stake read as a plain send until a device-signed `list_neurons` arrived; retyping a transfer left the stale copy beside the new one; and the stored operation count climbed without bound instead of tracking the account.

Both rejection paths threw a bare `Error`, so the apps said "Something went wrong" about a request the network had answered — `ICPGovernanceRejected` and `ICPCallRejected` are now distinct and quote the network's own wording, and a `list_neurons` read that came back empty raises `ICPNeuronsNotRead` rather than reporting success. Voting power subtracts a neuron's accrued rejection fees, matching the canister's `stake_e8s`. And the operation extra is converted when an account is serialized, so a neuron snapshot riding on an operation cannot break persistence.
