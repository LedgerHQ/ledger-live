<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/live-signer-xrp

> [!NOTE]
> **Status: EXPERIMENTAL** — The DMK path is behind the `ldmkXrpSigner` feature flag; the legacy path is the fallback.

Ledger Hardware Wallet XRP JavaScript bindings, integrating [`@ledgerhq/device-signer-kit-xrp`](https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/signer/signer-xrp) from the Device Management Kit alongside legacy `hw-app-xrp`.

Both `DmkSignerXrp` and `LegacySignerXrp` implement the same `XrpSigner` interface, so
`families/xrp/setup.ts` can pick one or the other from the feature flag without the coin
framework knowing which is in use.

### Curve support

The XRP application can sign on secp256k1 or ed25519, selected through the APDU's `p2`. The
signer kit only drives secp256k1 today, so `DmkSignerXrp` throws on `ed25519 = true` rather
than silently signing with the wrong curve. Ledger Live never asks for ed25519 — the generic
coin framework passes an options object, not a boolean — so this only guards direct callers.
