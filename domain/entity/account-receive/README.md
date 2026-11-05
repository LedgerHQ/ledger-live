# @domain/entity-account-receive

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `receive` kind: whether an account can receive, and on which address.

- `AccountReceive`, keyed by `AccountUUID`, a read replaces it:
  - `{ status: "ready", address }`: the `Address` a sender pays to. A `utxo` account's rotates as it receives.
  - `{ status: "onboardingRequired" }`: the account exists but cannot receive before its onboarding on the network.
- The address is not always the descriptor's: a family may receive on another identifier, or only once onboarded.
- `verification` is what the device action needs, from the `path` to ask the device for:
  - `{ type: "address", address }`: the device derives and shows this address. It may differ from the receive address (Canton shows its key's address, receives on its party id).
  - `{ type: "addressConfirmation", address }`: the device is given the address and confirms its key owns it (Concordium, whose addresses are not derived from a path).
  - `{ type: "publicKey", publicKey }`: the device only knows a key, which controls the account (Hedera).
  - absent: the device cannot confirm it.
  Network specifics (chain id, address format, curve) are not data: the device action reads them from the descriptor's network and path, as each family's `getAddress` does.
- `shielded`: a second address whose received funds stay private (Zcash), with its own verification. Its `address` verification goes through the device's shielded derivation (`getShieldedAddress`), not `getAddress`.
- `selectAccountReceive`. Apps mount the slice at `accountReceives`.

Pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-data-layer.md).
