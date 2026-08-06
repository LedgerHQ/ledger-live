---
"@ledgerhq/coin-bitcoin": patch
---

Remove the legacy Zcash shielded/PCZT chain-adapter (LIVE-35524).

Its shielded path is superseded by the standalone `@ledgerhq/coin-zcash` module, which now carries all Zcash traffic when the `zcashShielded` feature flag is on; the toggle inside `coin-bitcoin` has been hardcoded off for a while, so the PCZT build/sign/broadcast, the shielded balance/status/sync and the native Halo2/IPC engine were dead code exercised only by this package's own tests. Removed along with the now-unreachable Zcash-specific branches in `getTransactionStatus`/`updateTransaction`/`errors` and the `@ledgerhq/zcash-utils` dependency.

The transparent PSBT path used when the flag is off is unchanged: `createSigner`, `getAddress`, `getWalletXpub`, `getFullViewingKey` and the ZIP-317 fee pricer still back it exactly as before.
