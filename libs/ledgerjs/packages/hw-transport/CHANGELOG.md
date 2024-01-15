# @ledgerhq/hw-transport

## 6.30.1

### Patch Changes

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

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/errors@6.16.1
  - @ledgerhq/devices@8.2.0

## 6.30.1-next.0

### Patch Changes

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

- Updated dependencies [[`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2)]:
  - @ledgerhq/errors@6.16.1-next.0
  - @ledgerhq/devices@8.2.0-next.0

## 6.30.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/errors@6.16.0
  - @ledgerhq/devices@8.1.0
  - @ledgerhq/logs@6.12.0

## 6.30.0-next.0

### Minor Changes

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- Updated dependencies [[`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/errors@6.16.0-next.0
  - @ledgerhq/devices@8.1.0-next.0
  - @ledgerhq/logs@6.12.0-next.0

## 6.29.0

### Minor Changes

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

### Patch Changes

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: new mock fixture aTransportBuilder

  For unit tests where a real implementation of a Transport is not necessary.

- [#5063](https://github.com/LedgerHQ/ledger-live/pull/5063) [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix TransportRaceCondition literal

- Updated dependencies [[`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/logs@6.11.0
  - @ledgerhq/errors@6.15.0
  - @ledgerhq/devices@8.0.8

## 6.29.0-next.0

### Minor Changes

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

### Patch Changes

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: new mock fixture aTransportBuilder

  For unit tests where a real implementation of a Transport is not necessary.

- [#5063](https://github.com/LedgerHQ/ledger-live/pull/5063) [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix TransportRaceCondition literal

- Updated dependencies [[`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/logs@6.11.0-next.0
  - @ledgerhq/errors@6.15.0-next.0
  - @ledgerhq/devices@8.0.8-next.0

## 6.28.8

### Patch Changes

- Updated dependencies [[`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/devices@8.0.7

## 6.28.8-next.0

### Patch Changes

- Updated dependencies [[`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/devices@8.0.7-next.0

## 6.28.7

### Patch Changes

- Updated dependencies [[`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/devices@8.0.6

## 6.28.7-next.0

### Patch Changes

- Updated dependencies [[`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/devices@8.0.6-next.0

## 6.28.6

### Patch Changes

- Updated dependencies [[`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d)]:
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/devices@8.0.5

## 6.28.6-next.0

### Patch Changes

- Updated dependencies [[`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d)]:
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/devices@8.0.5-next.0

## 6.28.5

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914)]:
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/devices@8.0.4

## 6.28.5-next.0

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914)]:
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/devices@8.0.4-next.0

## 6.28.4

### Patch Changes

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546)]:
  - @ledgerhq/errors@6.12.6
  - @ledgerhq/devices@8.0.3

## 6.28.4-next.0

### Patch Changes

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546)]:
  - @ledgerhq/errors@6.12.6-next.0
  - @ledgerhq/devices@8.0.3-next.0

## 6.28.3

### Patch Changes

- Updated dependencies [[`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472)]:
  - @ledgerhq/errors@6.12.5
  - @ledgerhq/devices@8.0.2

## 6.28.3-next.0

### Patch Changes

- Updated dependencies [[`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472)]:
  - @ledgerhq/errors@6.12.5-next.0
  - @ledgerhq/devices@8.0.2-next.0

## 6.28.2

### Patch Changes

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4
  - @ledgerhq/devices@8.0.1

## 6.28.2-next.0

### Patch Changes

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4-next.0
  - @ledgerhq/devices@8.0.1-next.0

## 6.28.1

### Patch Changes

- Updated dependencies [[`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7)]:
  - @ledgerhq/devices@8.0.0

## 6.28.1-next.0

### Patch Changes

- Updated dependencies [[`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7)]:
  - @ledgerhq/devices@8.0.0-next.0

## 6.28.0

### Minor Changes

- [#2342](https://github.com/LedgerHQ/ledger-live/pull/2342) [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57) Thanks [@gre](https://github.com/gre)! - Add Transport#exchangeBulk method to have a native batched mecanism to send a lot of APDU at once & in order to do it performantly.

## 6.28.0-next.0

### Minor Changes

- [#2342](https://github.com/LedgerHQ/ledger-live/pull/2342) [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57) Thanks [@gre](https://github.com/gre)! - Add Transport#exchangeBulk method to have a native batched mecanism to send a lot of APDU at once & in order to do it performantly.

## 6.27.10

### Patch Changes

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7
  - @ledgerhq/errors@6.12.3

## 6.27.10-next.0

### Patch Changes

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7-next.0
  - @ledgerhq/errors@6.12.3-next.0

## 6.27.9

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2
  - @ledgerhq/devices@7.0.6

## 6.27.9-next.0

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2-next.0
  - @ledgerhq/devices@7.0.6-next.0

## 6.27.8

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1
  - @ledgerhq/devices@7.0.5

## 6.27.8-next.0

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1-next.0
  - @ledgerhq/devices@7.0.5-next.0

## 6.27.7

### Patch Changes

- [#1729](https://github.com/LedgerHQ/ledger-live/pull/1729) [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f) Thanks [@gre](https://github.com/gre)! - update node-hid to 2.1.2

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/devices@7.0.4

## 6.27.7-next.0

### Patch Changes

- [#1729](https://github.com/LedgerHQ/ledger-live/pull/1729) [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f) Thanks [@gre](https://github.com/gre)! - update node-hid to 2.1.2

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/devices@7.0.4-next.0

## 6.27.6

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3
  - @ledgerhq/errors@6.11.1

## 6.27.6-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/devices@7.0.3-next.0
  - @ledgerhq/errors@6.11.1-next.0

## 6.27.5

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0
  - @ledgerhq/devices@7.0.2

## 6.27.5-next.0

### Patch Changes

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325)]:
  - @ledgerhq/errors@6.11.0-next.0
  - @ledgerhq/devices@7.0.2-next.0

## 6.27.4

### Patch Changes

- Updated dependencies [[`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/devices@7.0.1

## 6.27.4-next.0

### Patch Changes

- Updated dependencies [[`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/devices@7.0.1-next.0

## 6.27.3

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

## 6.27.3-next.0

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

## 6.27.2

### Patch Changes

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0

## 6.27.2-next.0

### Patch Changes

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
