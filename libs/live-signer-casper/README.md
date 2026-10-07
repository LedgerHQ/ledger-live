<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/live-signer-casper

> [!CAUTION]
> **Status: UNSTABLE** — Prototype; consumes a locally packed `@ledgerhq/device-signer-kit-casper`.

Ledger Hardware Wallet Casper bindings implementing the coin-module `CasperSigner` contract:

- `DmkSignerCasper` — via the Device Management Kit ([`@ledgerhq/device-signer-kit-casper`](https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/signer/signer-casper)).
- `LegacySignerCasper` — via `@zondax/ledger-casper` on a legacy `Transport`.

`ledger-live-common/src/families/casper/deviceSigner.ts` picks one per transport, gated by the `ldmkCasperSigner` flag (`setCasperLdmkEnabled`).
