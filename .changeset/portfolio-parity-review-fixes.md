---
"@ledgerhq/portfolio-module-framework": minor
"@ledgerhq/portfolio-module-local": patch
"@ledgerhq/portfolio-module-hybrid": patch
"@ledgerhq/account-module-single-address": patch
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Close the gaps of the portfolio layer's local-mode parity. A single-address account resumes above the block of its newest operation, as legacy does, though a higher block shares its date; the single-address sync reads the tip and the balances before the operations, so a region-refused balance read fails as legacy; a sanctioned bitcoin sender revives as `AddressesSanctionedError`. The hybrid router reads an account the local side holds without asking the service, and a `local` chain wires no service at all. The EVM staking validators (with their id, a new `ValidatorView.id` extension), their prefetch, the Sei association warning and the swap live app's transaction lookup go through the portfolio layer when it serves the chain. In `remote` mode, an account served by an account module (bitcoin) is refused explicitly when sending. The legacy Sei readiness check makes its precompile call once again instead of retrying its expected revert, and the import-boundary lint names more of the network entry points.
