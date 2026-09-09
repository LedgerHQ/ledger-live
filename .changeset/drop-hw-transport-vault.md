---
"ledger-live-desktop": minor
---

Remove the Vault Signer feature and the `@ledgerhq/hw-transport-vault` package behind it, now
that the Ledger Vault product team has confirmed it is unused.

Gone with it: the Experimental setting and its modal, the top banner, the `vaultSigner` settings
slice, and the branch that made `getCurrentDevice` return a synthetic Vault device ahead of every
other transport. A persisted `vaultSigner` key needs no migration — `filterValidSettings` already
strips keys absent from the initial state.
