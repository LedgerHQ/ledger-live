# @ledgerhq/coin-near

## 0.4.0-nightly.6

### Minor Changes

- [#6712](https://github.com/LedgerHQ/ledger-live/pull/6712) [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix everything broken in the Near coin-module. Upgrade to the new broadcast endpoint because the old was deprecated, introduce 2 types of nodes used in different conditions (based on data sensitivity) and fix transaction building using Numbers for BigNumbers.

## 0.3.12-nightly.5

### Patch Changes

- Updated dependencies [[`b0ebe3a`](https://github.com/LedgerHQ/ledger-live/commit/b0ebe3acea586afbdeddb5877c15bcfc28f43016), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`c930c6e`](https://github.com/LedgerHQ/ledger-live/commit/c930c6e833bb29456e543b47e83de425ae6eeefa), [`cfb97f7`](https://github.com/LedgerHQ/ledger-live/commit/cfb97f7d5c81824815522e8699b7469047b1513a)]:
  - @ledgerhq/types-live@6.46.0-nightly.3
  - @ledgerhq/types-cryptoassets@7.11.0-nightly.0
  - @ledgerhq/coin-framework@0.12.0-nightly.5
  - @ledgerhq/live-network@1.2.1-nightly.2

## 0.3.12-nightly.4

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.11.4-nightly.4

## 0.3.12-nightly.3

### Patch Changes

- Updated dependencies [[`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167)]:
  - @ledgerhq/coin-framework@0.11.4-nightly.3
  - @ledgerhq/types-live@6.46.0-nightly.2

## 0.3.12-nightly.2

### Patch Changes

- Updated dependencies [[`33c4239`](https://github.com/LedgerHQ/ledger-live/commit/33c42392386e5e8ebf9f3251ccf1ade3af11644d)]:
  - @ledgerhq/types-live@6.46.0-nightly.1
  - @ledgerhq/coin-framework@0.11.4-nightly.2

## 0.3.12-nightly.1

### Patch Changes

- Updated dependencies [[`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e)]:
  - @ledgerhq/live-env@2.0.1-nightly.0
  - @ledgerhq/coin-framework@0.11.4-nightly.1
  - @ledgerhq/live-network@1.2.1-nightly.1

## 0.3.12-nightly.0

### Patch Changes

- Updated dependencies [[`dd1d17f`](https://github.com/LedgerHQ/ledger-live/commit/dd1d17fd3ce7ed42558204b2f93707fb9b1599de), [`9ada63a`](https://github.com/LedgerHQ/ledger-live/commit/9ada63a05b2d2518af09a9c07937cf94b5b2ea67)]:
  - @ledgerhq/errors@6.16.4-nightly.0
  - @ledgerhq/types-live@6.46.0-nightly.0
  - @ledgerhq/coin-framework@0.11.4-nightly.0
  - @ledgerhq/devices@8.2.3-nightly.0
  - @ledgerhq/live-network@1.2.1-nightly.0

## 0.3.11

### Patch Changes

- [#6262](https://github.com/LedgerHQ/ledger-live/pull/6262) [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0) Thanks [@JesseKuntz](https://github.com/JesseKuntz)! - Updating the near-api-js library and fetching the NEAR staking positions from the node rather than the kitwallet API.

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`6de15bc`](https://github.com/LedgerHQ/ledger-live/commit/6de15bc96e8b97a2a6815cf3fb1da874f7044b49), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6)]:
  - @ledgerhq/live-env@2.0.0
  - @ledgerhq/errors@6.16.3
  - @ledgerhq/types-live@6.45.0
  - @ledgerhq/coin-framework@0.11.3
  - @ledgerhq/live-network@1.2.0
  - @ledgerhq/types-cryptoassets@7.10.0
  - @ledgerhq/devices@8.2.2

## 0.3.11-next.0

### Patch Changes

- [#6262](https://github.com/LedgerHQ/ledger-live/pull/6262) [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0) Thanks [@JesseKuntz](https://github.com/JesseKuntz)! - Updating the near-api-js library and fetching the NEAR staking positions from the node rather than the kitwallet API.

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`6de15bc`](https://github.com/LedgerHQ/ledger-live/commit/6de15bc96e8b97a2a6815cf3fb1da874f7044b49), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6)]:
  - @ledgerhq/live-env@2.0.0-next.0
  - @ledgerhq/errors@6.16.3-next.0
  - @ledgerhq/types-live@6.45.0-next.0
  - @ledgerhq/coin-framework@0.11.3-next.0
  - @ledgerhq/live-network@1.2.0-next.0
  - @ledgerhq/types-cryptoassets@7.10.0-next.0
  - @ledgerhq/devices@8.2.2-next.0

## 0.3.10

### Patch Changes

- [#6279](https://github.com/LedgerHQ/ledger-live/pull/6279) [`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Updating the near-api-js library and fetching the NEAR staking positions from the node rather than the kitwallet API.

- Updated dependencies [[`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/live-env@1.0.1
  - @ledgerhq/coin-framework@0.11.2
  - @ledgerhq/live-network@1.1.13

## 0.3.10-hotfix.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.11.2-hotfix.1

## 0.3.10-hotfix.0

### Patch Changes

- [#6279](https://github.com/LedgerHQ/ledger-live/pull/6279) [`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Updating the near-api-js library and fetching the NEAR staking positions from the node rather than the kitwallet API.

- Updated dependencies [[`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/live-env@1.0.1-hotfix.0
  - @ledgerhq/coin-framework@0.11.2-hotfix.0
  - @ledgerhq/live-network@1.1.13-hotfix.0

## 0.3.9

### Patch Changes

- Updated dependencies [[`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`ee88785`](https://github.com/LedgerHQ/ledger-live/commit/ee8878515671241ce1037362af5e8f7799b3673a), [`8d99b81`](https://github.com/LedgerHQ/ledger-live/commit/8d99b81feaf5e8d46e0c26f34bc70b709a7e3c14), [`43eea9e`](https://github.com/LedgerHQ/ledger-live/commit/43eea9e8076f2c9d5aeb0f8a3b0738e97b3152c8), [`1cb83b5`](https://github.com/LedgerHQ/ledger-live/commit/1cb83b5baa4603e22f391609438e349ca0ce9b0e), [`c217a6c`](https://github.com/LedgerHQ/ledger-live/commit/c217a6cfa59218278d25d2d987a06dfb33977cd9)]:
  - @ledgerhq/live-env@1.0.0
  - @ledgerhq/errors@6.16.2
  - @ledgerhq/coin-framework@0.11.1
  - @ledgerhq/types-live@6.44.1
  - @ledgerhq/live-network@1.1.12
  - @ledgerhq/devices@8.2.1

## 0.3.9-next.0

### Patch Changes

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9)]:
  - @ledgerhq/live-env@1.0.0-next.0
  - @ledgerhq/errors@6.16.2-next.0
  - @ledgerhq/coin-framework@0.11.1-next.0
  - @ledgerhq/types-live@6.44.1-next.0
  - @ledgerhq/live-network@1.1.12-next.0
  - @ledgerhq/devices@8.2.1-next.0
