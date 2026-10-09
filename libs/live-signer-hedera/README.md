<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/live-signer-hedera

> [!CAUTION]
> **Status: UNSTABLE** — Prototype; the DMK signer kit lives in `src/kit` until `@ledgerhq/device-signer-kit-hedera` ships from device-sdk-ts.

Ledger Hardware Wallet Hedera bindings implementing the coin-module `HederaSigner` contract:

- `DmkSignerHedera` — via the Device Management Kit, using the commands in `src/kit` (`GetAppConfig`, `GetPublicKey`, `SignTransaction`).
- `LegacySignerHedera` — via `@ledgerhq/hw-app-hedera` on a legacy `Transport`.

`app-hedera` takes a 4-byte little-endian key index, not a BIP32 path, and derives `m/44'/3030'/0'/0'/<index>'`. Ledger Live's `44/3030` path maps to index `0`; any other path is refused.

`ledger-live-common/src/families/hedera/setup.ts` picks one per transport, gated by the `ldmkHederaSigner` flag (`setHederaLdmkEnabled`).
