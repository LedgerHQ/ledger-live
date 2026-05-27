---
"@ledgerhq/coin-tron": patch
"@ledgerhq/live-common": patch
---

Wire Tron into the generic coin framework: implement `validateIntent` and `getNextSequence` in `coin-tron/api/index.ts`, add `families/tron/{signer,bridge}` to `live-common/bridge/generic-coin-framework`, and add the `tron` case to `createTransaction.ts`. Tron stays on the legacy bridge in production (`isGenericCoinFrameworkFamily("tron")` is still `false`); these are no-ops at runtime until the family flag is flipped.
