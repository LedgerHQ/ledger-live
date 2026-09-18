<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/live-signer-tron

> [!NOTE]
> **Status: EXPERIMENTAL** — The DMK path is behind the `ldmkTronSigner` feature flag; the legacy path is the fallback.

Ledger Hardware Wallet Tron JavaScript bindings, integrating [`@ledgerhq/device-signer-kit-tron`](https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/signer/signer-tron) from the Device Management Kit alongside legacy `hw-app-trx`.

Both `DmkSignerTron` and `LegacySignerTron` implement the same `TronSigner` interface, so
`families/tron/setup.ts` can pick one or the other from the feature flag without the coin
framework knowing which is in use.

The DMK signer resolves TRC-10 clear-signing context natively. The legacy signer continues to use
the token signature supplied by Ledger Live.
