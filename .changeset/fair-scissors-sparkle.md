---
"@ledgerhq/hw-app-str": major
"@ledgerhq/live-common": patch
---

Refactor `hw-app-str` and add `signSorobanAuthorization`. Please check the changelog and documentation of "@ledgerhq/hw-app-str" for more information.

- `Str.getPublicKey`'s function signature has changed. Previously, it was `getPublicKey(path: string, boolValidate?: boolean, boolDisplay?: boolean): Promise<{ publicKey: string; raw: Buffer; }>` and now it is `async getPublicKey(path: string, display = false): Promise<{ rawPublicKey: Buffer }>`
- `Str.signTransaction` will no longer automatically fallback to `Str.signHash`. If you want to sign a hash, you have to call `Str.signHash` directly.
- Removed the fixed limit on the maximum length of the transaction in `Str.signTransaction`. Currently, if the transaction is too large for the device to handle, `StellarUserRefusedError` will be thrown.
- Add `Str.signSorobanAuthorization` method to sign Stellar Soroban authorization.
- `Str.getAppConfiguration` now returns `maxDataSize`, it represents the maximum size of the data that the device can processed.
- Add error classes for better error handling, check the documentation for more information:
  - `StellarUserRefusedError`
  - `StellarHashSigningNotEnabledError`
  - `StellarDataTooLargeError`
  - `StellarDataParsingFailedError`