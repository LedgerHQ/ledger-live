# @ledgerhq/hw-transport-node-hid-singleton

## 6.28.5

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1
  - @ledgerhq/devices@7.0.5
  - @ledgerhq/hw-transport@6.27.8
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.8

## 6.28.5-next.0

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1-next.0
  - @ledgerhq/devices@7.0.5-next.0
  - @ledgerhq/hw-transport@6.27.8-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.8-next.0

## 6.28.4

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/hw-transport@6.27.7
  - @ledgerhq/devices@7.0.4
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.7

## 6.28.4-next.0

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/hw-transport@6.27.7-next.0
  - @ledgerhq/devices@7.0.4-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.7-next.0

## 6.28.3

### Patch Changes

- [#1422](https://github.com/LedgerHQ/ledger-live/pull/1422) [`37d00208ab`](https://github.com/LedgerHQ/ledger-live/commit/37d00208abd18fc0f573370518a05e093f13f494) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactor on listen HID devices on LLD:

  - make the listenDevices definition command into TS, and rename into listenToHidDevices
  - transform the ListenDevices component (that was mainly a useEffect returning null) into a hook useListenToHidDevices
  - add the types-devices lib into LLD

## 6.28.3-next.0

### Patch Changes

- [#1422](https://github.com/LedgerHQ/ledger-live/pull/1422) [`37d00208ab`](https://github.com/LedgerHQ/ledger-live/commit/37d00208abd18fc0f573370518a05e093f13f494) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactor on listen HID devices on LLD:

  - make the listenDevices definition command into TS, and rename into listenToHidDevices
  - transform the ListenDevices component (that was mainly a useEffect returning null) into a hook useListenToHidDevices
  - add the types-devices lib into LLD

## 6.28.2

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.6
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1

## 6.28.2-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3-next.0
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.6-next.0
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 6.28.1

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0
  - @ledgerhq/devices@7.0.2
  - @ledgerhq/hw-transport@6.27.5
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.5

## 6.28.1-next.0

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0-next.0
  - @ledgerhq/devices@7.0.2-next.0
  - @ledgerhq/hw-transport@6.27.5-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.5-next.0

## 6.28.0

### Minor Changes

- [#903](https://github.com/LedgerHQ/ledger-live/pull/903) [`41d82e7bb3`](https://github.com/LedgerHQ/ledger-live/commit/41d82e7bb3a30fb4a82c45ece43d13242342f91c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Replaced 'usb-detection' with 'node-usb' in singleton transport

### Patch Changes

- Updated dependencies [[`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/devices@7.0.1
  - @ledgerhq/hw-transport@6.27.4
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.4

## 6.28.0-next.0

### Minor Changes

- [#903](https://github.com/LedgerHQ/ledger-live/pull/903) [`41d82e7bb`](https://github.com/LedgerHQ/ledger-live/commit/41d82e7bb3a30fb4a82c45ece43d13242342f91c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Replaced 'usb-detection' with 'node-usb' in singleton transport

### Patch Changes

- Updated dependencies [[`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/devices@7.0.1-next.0
  - @ledgerhq/hw-transport@6.27.4-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.4-next.0

## 6.27.4

### Patch Changes

- Updated dependencies [[`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.3

## 6.27.4-next.0

### Patch Changes

- Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.3-next.0

## 6.27.3

### Patch Changes

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.2
  - @ledgerhq/hw-transport@6.27.2

## 6.27.3-next.0

### Patch Changes

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-transport-node-hid-noevents@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0

## 6.27.2

### Patch Changes

- [#253](https://github.com/LedgerHQ/ledger-live/pull/253) [`c5c3f48e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c3f48e42fe9b8e7d200e6d0161d990c84f23c1) Thanks [@elbywan](https://github.com/elbywan)! - Add basic support for macOS universal apps.

## 6.27.2-next.0

### Patch Changes

- c5c3f48e4: Add basic support for macOS universal apps.
