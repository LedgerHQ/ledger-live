# @domain/entity-account-receive

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `receive` kind: on which address an account receives, and how the device confirms it. Whether the account can receive yet (onboarding, token activation) is not this kind's concern.

- No query: an account receives all its assets, its tokens included, on one address. The slice keeps one `AccountReceive` per `AccountUUID`, the older answer never replacing the newer.
- `address`: the `Address` a sender pays to. A `utxo` account's rotates as it receives.
- The address is not always the descriptor's: a family may receive on another identifier (Canton on its party id). An account with no address yet (Canton without a party id, Concordium before its credential is deployed) fails the read.
- `verification` is what the device action needs, from the `path` to ask the device for:
  - `{ type: "address", address }`: the device derives and shows this address. It may differ from the receive address (Canton shows its key's address, receives on its party id).
  - `{ type: "addressConfirmation", address }`: the device is given the address and confirms its key owns it (Concordium, whose addresses are not derived from a path).
  - `{ type: "shieldedAddress", address }`: the device derives and shows this shielded address through its shielded derivation (`getShieldedAddress`), not `getAddress` (Zcash, at the ZIP-32 account path `m/32h/<coin>h/<account>h`).
  - `{ type: "publicKey", publicKey }`: the device only knows a key, which controls the account (Hedera).
  - absent: the device cannot confirm it (Hedera without its public key). An account with no readable device path fails the read with `ReceivePathUnknownError`.
  Network specifics (chain id, address format, curve) are not data: the device action reads them from the descriptor's network and path, as each family's `getAddress` does.
- `shielded`: a second address whose received funds stay private (Zcash), with its own `shieldedAddress` verification.
- `selectAccountReceive(state, accountUUID)`. Apps mount the slice at `accountReceives`.

Pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-data-layer.md).
