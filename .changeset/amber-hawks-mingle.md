---
"@ledgerhq/coin-internet_computer": minor
---

Name the errors an Internet Computer neuron call raises. Both rejection paths threw a bare `Error`, so the apps fell back to "Something went wrong. Please retry" — the wrong instruction for a request the network answered, and no way to tell the two apart. `ICPGovernanceRejected` (the canister ran the command and refused it) and `ICPCallRejected` (the replica refused the ingress message, so nothing ran) are now distinct and carry the network's own wording, with the caller's principal redacted. A `list_neurons` read that came back empty reported success while the snapshot sat untouched; it now raises `ICPNeuronsNotRead`.
