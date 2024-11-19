# @ledgerhq/hw-app-str

## 7.0.4

### Patch Changes

- Updated dependencies [[`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330)]:
  - @ledgerhq/errors@6.19.1
  - @ledgerhq/hw-transport@6.31.4

## 7.0.4-next.0

### Patch Changes

- Updated dependencies [[`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330)]:
  - @ledgerhq/errors@6.19.1-next.0
  - @ledgerhq/hw-transport@6.31.4-next.0

## 7.0.3

### Patch Changes

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/hw-transport@6.31.3

## 7.0.3-next.0

### Patch Changes

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/hw-transport@6.31.3-next.0

## 7.0.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.2

## 7.0.2-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.2-hotfix.0

## 7.0.1

### Patch Changes

- Updated dependencies [[`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/hw-transport@6.31.1

## 7.0.1-next.0

### Patch Changes

- Updated dependencies [[`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/hw-transport@6.31.1-next.0

## 7.0.0

### Major Changes

- [#6923](https://github.com/LedgerHQ/ledger-live/pull/6923) [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737) Thanks [@overcat](https://github.com/overcat)! - Refactor `hw-app-str` and add `signSorobanAuthorization`. Please check the changelog and documentation of "@ledgerhq/hw-app-str" for more information.

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

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

## 7.0.0-next.1

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

## 7.0.0-next.0

### Major Changes

- [#6923](https://github.com/LedgerHQ/ledger-live/pull/6923) [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737) Thanks [@overcat](https://github.com/overcat)! - Refactor `hw-app-str` and add `signSorobanAuthorization`. Please check the changelog and documentation of "@ledgerhq/hw-app-str" for more information.

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

## 6.29.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f)]:
  - @ledgerhq/hw-transport@6.31.0

## 6.29.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f)]:
  - @ledgerhq/hw-transport@6.31.0-next.0

## 6.28.6

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.6

## 6.28.6-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.6-next.0

## 6.28.5

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.5

## 6.28.5-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.5-next.0

## 6.28.4

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.4

## 6.28.4-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.30.4-next.0

## 6.28.3

### Patch Changes

- Updated dependencies [[`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3)]:
  - @ledgerhq/hw-transport@6.30.3

## 6.28.3-next.0

### Patch Changes

- Updated dependencies [[`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3)]:
  - @ledgerhq/hw-transport@6.30.3-next.0

## 6.28.2

### Patch Changes

- Updated dependencies [[`16b4d7a`](https://github.com/LedgerHQ/ledger-live/commit/16b4d7ab4702022d4967f3c054d3c62a76716947)]:
  - @ledgerhq/hw-transport@6.30.2

## 6.28.2-next.0

### Patch Changes

- Updated dependencies [[`16b4d7a`](https://github.com/LedgerHQ/ledger-live/commit/16b4d7ab4702022d4967f3c054d3c62a76716947)]:
  - @ledgerhq/hw-transport@6.30.2-next.0

## 6.28.1

### Patch Changes

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/hw-transport@6.30.1

## 6.28.1-next.0

### Patch Changes

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/hw-transport@6.30.1-next.0

## 6.28.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/hw-transport@6.30.0

## 6.28.0-next.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/hw-transport@6.30.0-next.0

## 6.27.20

### Patch Changes

- Updated dependencies [[`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac)]:
  - @ledgerhq/hw-transport@6.29.0

## 6.27.20-next.0

### Patch Changes

- Updated dependencies [[`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac)]:
  - @ledgerhq/hw-transport@6.29.0-next.0

## 6.27.19

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.8

## 6.27.19-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.8-next.0

## 6.27.18

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.7

## 6.27.18-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.7-next.0

## 6.27.17

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.6

## 6.27.17-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.6-next.0

## 6.27.16

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.5

## 6.27.16-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.5-next.0

## 6.27.15

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.4

## 6.27.15-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.4-next.0

## 6.27.14

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.3

## 6.27.14-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.3-next.0

## 6.27.13

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.2

## 6.27.13-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.2-next.0

## 6.27.12

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.1

## 6.27.12-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.28.1-next.0

## 6.27.11

### Patch Changes

- Updated dependencies [[`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-transport@6.28.0

## 6.27.11-next.0

### Patch Changes

- Updated dependencies [[`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-transport@6.28.0-next.0

## 6.27.10

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.10

## 6.27.10-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.10-next.0

## 6.27.9

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/hw-transport@6.27.9

## 6.27.9-next.0

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/hw-transport@6.27.9-next.0

## 6.27.8

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.8

## 6.27.8-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.8-next.0

## 6.27.7

### Patch Changes

- Updated dependencies [[`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f)]:
  - @ledgerhq/hw-transport@6.27.7

## 6.27.7-next.0

### Patch Changes

- Updated dependencies [[`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f)]:
  - @ledgerhq/hw-transport@6.27.7-next.0

## 6.27.6

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/hw-transport@6.27.6

## 6.27.6-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/hw-transport@6.27.6-next.0

## 6.27.5

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.5

## 6.27.5-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.5-next.0

## 6.27.4

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.4

## 6.27.4-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.4-next.0

## 6.27.3

### Patch Changes

- Updated dependencies [[`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3

## 6.27.3-next.0

### Patch Changes

- Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0

## 6.27.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.2

## 6.27.2-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.2-next.0
