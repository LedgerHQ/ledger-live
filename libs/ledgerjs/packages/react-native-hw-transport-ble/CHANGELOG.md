# @ledgerhq/react-native-hw-transport-ble

## 6.32.0

### Minor Changes

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: new abort timeout on opening transport and APDU exchange

  On `@ledgerhq/hw-transport`

  - `exchange` adding an optional `abortTimeoutMs` arg to its definition
  - `send` taking an optional `abortTimeoutMs` and passing it to `exchange`
  - Some documentation and tracing

  On `@ledgerhq/react-native-hw-transport-ble`

  - `open`: enabling optional timeout when opening a transport instance
  - `exchange`: enabling optional timeout on APDU exchange, calling `cancelPendingOperations` on timeout
  - `cancelPendingOperations`: using a `currentTransactionIds` array of transactions id for each `write`, we can try to abort completely pending writes
  - More documentation + tracing + simple unit tests

### Patch Changes

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/hw-transport@6.30.1
  - @ledgerhq/errors@6.16.1
  - @ledgerhq/devices@8.2.0

## 6.32.0-next.0

### Minor Changes

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: new abort timeout on opening transport and APDU exchange

  On `@ledgerhq/hw-transport`

  - `exchange` adding an optional `abortTimeoutMs` arg to its definition
  - `send` taking an optional `abortTimeoutMs` and passing it to `exchange`
  - Some documentation and tracing

  On `@ledgerhq/react-native-hw-transport-ble`

  - `open`: enabling optional timeout when opening a transport instance
  - `exchange`: enabling optional timeout on APDU exchange, calling `cancelPendingOperations` on timeout
  - `cancelPendingOperations`: using a `currentTransactionIds` array of transactions id for each `write`, we can try to abort completely pending writes
  - More documentation + tracing + simple unit tests

### Patch Changes

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/hw-transport@6.30.1-next.0
  - @ledgerhq/errors@6.16.1-next.0
  - @ledgerhq/devices@8.2.0-next.0

## 6.31.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/errors@6.16.0
  - @ledgerhq/hw-transport@6.30.0
  - @ledgerhq/devices@8.1.0
  - @ledgerhq/logs@6.12.0

## 6.31.0-next.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/errors@6.16.0-next.0
  - @ledgerhq/hw-transport@6.30.0-next.0
  - @ledgerhq/devices@8.1.0-next.0
  - @ledgerhq/logs@6.12.0-next.0

## 6.30.0

### Minor Changes

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

### Patch Changes

- Updated dependencies [[`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/logs@6.11.0
  - @ledgerhq/hw-transport@6.29.0
  - @ledgerhq/errors@6.15.0
  - @ledgerhq/devices@8.0.8

## 6.30.0-next.0

### Minor Changes

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

### Patch Changes

- Updated dependencies [[`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/logs@6.11.0-next.0
  - @ledgerhq/hw-transport@6.29.0-next.0
  - @ledgerhq/errors@6.15.0-next.0
  - @ledgerhq/devices@8.0.8-next.0

## 6.29.5

### Patch Changes

- Updated dependencies [[`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/devices@8.0.7
  - @ledgerhq/hw-transport@6.28.8

## 6.29.5-next.0

### Patch Changes

- Updated dependencies [[`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/devices@8.0.7-next.0
  - @ledgerhq/hw-transport@6.28.8-next.0

## 6.29.4

### Patch Changes

- Updated dependencies [[`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/devices@8.0.6
  - @ledgerhq/hw-transport@6.28.7

## 6.29.4-next.0

### Patch Changes

- Updated dependencies [[`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/devices@8.0.6-next.0
  - @ledgerhq/hw-transport@6.28.7-next.0

## 6.29.3

### Patch Changes

- Updated dependencies [[`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d)]:
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/devices@8.0.5
  - @ledgerhq/hw-transport@6.28.6

## 6.29.3-next.0

### Patch Changes

- Updated dependencies [[`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d)]:
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/devices@8.0.5-next.0
  - @ledgerhq/hw-transport@6.28.6-next.0

## 6.29.2

### Patch Changes

- [#3790](https://github.com/LedgerHQ/ledger-live/pull/3790) [`7719cbf508`](https://github.com/LedgerHQ/ledger-live/commit/7719cbf5087a44aefa3fc66e7a28c69ba7687bcc) Thanks [@juan-cortes](https://github.com/juan-cortes)! - BleTransport optimization in pairing flows for Stax

## 6.29.2-next.0

### Patch Changes

- [#3790](https://github.com/LedgerHQ/ledger-live/pull/3790) [`7719cbf508`](https://github.com/LedgerHQ/ledger-live/commit/7719cbf5087a44aefa3fc66e7a28c69ba7687bcc) Thanks [@juan-cortes](https://github.com/juan-cortes)! - BleTransport optimization in pairing flows for Stax

## 6.29.1

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914)]:
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/devices@8.0.4
  - @ledgerhq/hw-transport@6.28.5

## 6.29.1-next.0

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914)]:
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/devices@8.0.4-next.0
  - @ledgerhq/hw-transport@6.28.5-next.0

## 6.29.0

### Minor Changes

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Remove BLE high priority connection request as it was breaking the firmware update via BLE on Android

## 6.29.0-next.0

### Minor Changes

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Remove BLE high priority connection request as it was breaking the firmware update via BLE on Android

## 6.28.8

### Patch Changes

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546)]:
  - @ledgerhq/errors@6.12.6
  - @ledgerhq/devices@8.0.3
  - @ledgerhq/hw-transport@6.28.4

## 6.28.8-next.0

### Patch Changes

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546)]:
  - @ledgerhq/errors@6.12.6-next.0
  - @ledgerhq/devices@8.0.3-next.0
  - @ledgerhq/hw-transport@6.28.4-next.0

## 6.28.7

### Patch Changes

- [#3380](https://github.com/LedgerHQ/ledger-live/pull/3380) [`05c4b20b3a`](https://github.com/LedgerHQ/ledger-live/commit/05c4b20b3a89a1fe0e851189b51a2b5fdf625f01) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the mapping of errors on the BLE transport. "Disconnect" and "device not found" errors were not correctly being mapped.

## 6.28.7-next.0

### Patch Changes

- [#3380](https://github.com/LedgerHQ/ledger-live/pull/3380) [`05c4b20b3a`](https://github.com/LedgerHQ/ledger-live/commit/05c4b20b3a89a1fe0e851189b51a2b5fdf625f01) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the mapping of errors on the BLE transport. "Disconnect" and "device not found" errors were not correctly being mapped.

## 6.28.6

### Patch Changes

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling for broken pairing

- Updated dependencies [[`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472)]:
  - @ledgerhq/errors@6.12.5
  - @ledgerhq/devices@8.0.2
  - @ledgerhq/hw-transport@6.28.3

## 6.28.6-next.0

### Patch Changes

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling for broken pairing

- Updated dependencies [[`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472)]:
  - @ledgerhq/errors@6.12.5-next.0
  - @ledgerhq/devices@8.0.2-next.0
  - @ledgerhq/hw-transport@6.28.3-next.0

## 6.28.5

### Patch Changes

- [#3078](https://github.com/LedgerHQ/ledger-live/pull/3078) [`5fa4697e8d`](https://github.com/LedgerHQ/ledger-live/commit/5fa4697e8d1cfd1dba0f942745d1bfc6984ae1c9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: request for a specific MTU when trying to BLE connect

  ConnectionOptions was commented as "not used" in react-native-ble-plx,
  but it is actually used and needed when connecting to a device.

## 6.28.5-next.0

### Patch Changes

- [#3078](https://github.com/LedgerHQ/ledger-live/pull/3078) [`5fa4697e8d`](https://github.com/LedgerHQ/ledger-live/commit/5fa4697e8d1cfd1dba0f942745d1bfc6984ae1c9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: request for a specific MTU when trying to BLE connect

  ConnectionOptions was commented as "not used" in react-native-ble-plx,
  but it is actually used and needed when connecting to a device.

## 6.28.4

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`57c52a9fca`](https://github.com/LedgerHQ/ledger-live/commit/57c52a9fca18595e5fe6b0a81fc7b5967b2ca74c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: request for a specific MTU when trying to BLE connect

  ConnectionOptions was commented as "not used" in react-native-ble-plx,
  but it is actually used and needed when connecting to a device.

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4
  - @ledgerhq/devices@8.0.1
  - @ledgerhq/hw-transport@6.28.2

## 6.28.4-next.1

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`57c52a9fca`](https://github.com/LedgerHQ/ledger-live/commit/57c52a9fca18595e5fe6b0a81fc7b5967b2ca74c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: request for a specific MTU when trying to BLE connect

  ConnectionOptions was commented as "not used" in react-native-ble-plx,
  but it is actually used and needed when connecting to a device.

## 6.28.4-next.0

### Patch Changes

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4-next.0
  - @ledgerhq/devices@8.0.1-next.0
  - @ledgerhq/hw-transport@6.28.2-next.0

## 6.28.3

### Patch Changes

- Updated dependencies [[`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7)]:
  - @ledgerhq/devices@8.0.0
  - @ledgerhq/hw-transport@6.28.1

## 6.28.3-next.0

### Patch Changes

- Updated dependencies [[`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7)]:
  - @ledgerhq/devices@8.0.0-next.0
  - @ledgerhq/hw-transport@6.28.1-next.0

## 6.28.2

### Patch Changes

- [#2376](https://github.com/LedgerHQ/ledger-live/pull/2376) [`de3b0da314`](https://github.com/LedgerHQ/ledger-live/commit/de3b0da31428487e025548abcfa26c0d4dac33f1) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: incorrect usage of bleManager instance inside BleTransport

- Updated dependencies [[`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-transport@6.28.0

## 6.28.2-next.0

### Patch Changes

- [#2376](https://github.com/LedgerHQ/ledger-live/pull/2376) [`de3b0da314`](https://github.com/LedgerHQ/ledger-live/commit/de3b0da31428487e025548abcfa26c0d4dac33f1) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: incorrect usage of bleManager instance inside BleTransport

- Updated dependencies [[`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-transport@6.28.0-next.0

## 6.28.1

### Patch Changes

- [#2304](https://github.com/LedgerHQ/ledger-live/pull/2304) [`7399cdba96`](https://github.com/LedgerHQ/ledger-live/commit/7399cdba96c5a39be5018dcff2906fbc11200ba2) Thanks [@elbywan](https://github.com/elbywan)! - Force commonjs imports for ledgerhq-react-native-hw-transport-ble

## 6.28.1-next.0

### Patch Changes

- [#2304](https://github.com/LedgerHQ/ledger-live/pull/2304) [`7399cdba96`](https://github.com/LedgerHQ/ledger-live/commit/7399cdba96c5a39be5018dcff2906fbc11200ba2) Thanks [@elbywan](https://github.com/elbywan)! - Force commonjs imports for ledgerhq-react-native-hw-transport-ble

## 6.28.1

### Patch Changes

- [#2413](https://github.com/LedgerHQ/ledger-live/pull/2413) [`e7bf251ba4`](https://github.com/LedgerHQ/ledger-live/commit/e7bf251ba488a9f38731db58b1d2d69d8fc802ea) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix: incorrect usage of bleManager instance inside BleTransport

## 6.28.1-hotfix.0

### Patch Changes

- [#2413](https://github.com/LedgerHQ/ledger-live/pull/2413) [`e7bf251ba4`](https://github.com/LedgerHQ/ledger-live/commit/e7bf251ba488a9f38731db58b1d2d69d8fc802ea) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix: incorrect usage of bleManager instance inside BleTransport

## 6.28.0

### Minor Changes

- [#2002](https://github.com/LedgerHQ/ledger-live/pull/2002) [`b83ff5509c`](https://github.com/LedgerHQ/ledger-live/commit/b83ff5509cf7b66b39642d300b0d7ec5e8582ea7) Thanks [@vivalaakam](https://github.com/vivalaakam)! - create BleManager instance on request

### Patch Changes

- [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cleaning + log in withDevice

  Setting up BLE connection priority inside BleTransport constructor
  and not in each call to withDevice

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7
  - @ledgerhq/errors@6.12.3
  - @ledgerhq/hw-transport@6.27.10

## 6.28.0-next.0

### Minor Changes

- [#2002](https://github.com/LedgerHQ/ledger-live/pull/2002) [`b83ff5509c`](https://github.com/LedgerHQ/ledger-live/commit/b83ff5509cf7b66b39642d300b0d7ec5e8582ea7) Thanks [@vivalaakam](https://github.com/vivalaakam)! - create BleManager instance on request

### Patch Changes

- [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cleaning + log in withDevice

  Setting up BLE connection priority inside BleTransport constructor
  and not in each call to withDevice

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7-next.0
  - @ledgerhq/errors@6.12.3-next.0
  - @ledgerhq/hw-transport@6.27.10-next.0

## 6.27.12

### Patch Changes

- [#2048](https://github.com/LedgerHQ/ledger-live/pull/2048) [`101e6851ae`](https://github.com/LedgerHQ/ledger-live/commit/101e6851ae76747431b122076dc1752c94ee40d3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Undo the auto disconnect mechanism, due to regressions

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

* Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2
  - @ledgerhq/hw-transport@6.27.9
  - @ledgerhq/devices@7.0.6

## 6.27.12-next.0

### Patch Changes

- [#2048](https://github.com/LedgerHQ/ledger-live/pull/2048) [`101e6851ae`](https://github.com/LedgerHQ/ledger-live/commit/101e6851ae76747431b122076dc1752c94ee40d3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Undo the auto disconnect mechanism, due to regressions

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

* Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2-next.0
  - @ledgerhq/hw-transport@6.27.9-next.0
  - @ledgerhq/devices@7.0.6-next.0

## 6.27.11

### Patch Changes

- [#2024](https://github.com/LedgerHQ/ledger-live/pull/2024) [`627b46b58e`](https://github.com/LedgerHQ/ledger-live/commit/627b46b58ed83970c69d621303af7a3a7e51850b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Undo the auto disconnect mechanism, due to regressions

* [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Provide a forceful disconnection mechanism for close request on BleTransport

## 6.27.11-next.1

### Patch Changes

- [#2024](https://github.com/LedgerHQ/ledger-live/pull/2024) [`627b46b58e`](https://github.com/LedgerHQ/ledger-live/commit/627b46b58ed83970c69d621303af7a3a7e51850b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Undo the auto disconnect mechanism, due to regressions

## 6.27.11-next.0

### Patch Changes

- [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Provide a forceful disconnection mechanism for close request on BleTransport

## 6.27.10

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1
  - @ledgerhq/devices@7.0.5
  - @ledgerhq/hw-transport@6.27.8

## 6.27.10-next.0

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1-next.0
  - @ledgerhq/devices@7.0.5-next.0
  - @ledgerhq/hw-transport@6.27.8-next.0

## 6.27.9

### Patch Changes

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/hw-transport@6.27.7
  - @ledgerhq/devices@7.0.4

## 6.27.9-next.0

### Patch Changes

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/hw-transport@6.27.7-next.0
  - @ledgerhq/devices@7.0.4-next.0

## 6.27.8

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1

## 6.27.8-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3-next.0
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 6.27.7

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0
  - @ledgerhq/devices@7.0.2
  - @ledgerhq/hw-transport@6.27.5

## 6.27.7-next.0

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0-next.0
  - @ledgerhq/devices@7.0.2-next.0
  - @ledgerhq/hw-transport@6.27.5-next.0

## 6.27.6

### Patch Changes

- Updated dependencies [[`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/devices@7.0.1
  - @ledgerhq/hw-transport@6.27.4

## 6.27.6-next.0

### Patch Changes

- Updated dependencies [[`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/devices@7.0.1-next.0
  - @ledgerhq/hw-transport@6.27.4-next.0

## 6.27.5

### Patch Changes

- [#1117](https://github.com/LedgerHQ/ledger-live/pull/1117) [`a7976db5d`](https://github.com/LedgerHQ/ledger-live/commit/a7976db5d3836d3d41ef0a0507373cad0bd8725c) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix crash when scanning for bluetooth devices

## 6.27.5-next.0

### Patch Changes

- [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

## 6.27.3

### Patch Changes

- [`3cc45438a8`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.4

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3

## 6.27.4-next.0

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0

## 6.27.3

### Patch Changes

- [`3cc45438a8`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.3-next.0

### Patch Changes

- [`3cc45438a`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.2

### Patch Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-transport@6.27.2

## 6.27.2-next.0

### Patch Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
