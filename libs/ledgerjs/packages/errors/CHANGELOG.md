# @ledgerhq/errors

## 6.16.1

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

- [#5432](https://github.com/LedgerHQ/ledger-live/pull/5432) [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring TransportStatusError

  Refactor into a real class in order to improve TS inference

## 6.16.1-next.0

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

- [#5432](https://github.com/LedgerHQ/ledger-live/pull/5432) [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring TransportStatusError

  Refactor into a real class in order to improve TS inference

## 6.16.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

## 6.16.0-next.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#5430](https://github.com/LedgerHQ/ledger-live/pull/5430) [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update documentation v14 ledgerjs

### Patch Changes

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

## 6.15.0

### Minor Changes

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

## 6.15.0-next.0

### Minor Changes

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

## 6.14.0

### Minor Changes

- [#4154](https://github.com/LedgerHQ/ledger-live/pull/4154) [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Added NotEnoughGasSwap to errors, will return amountFromWarning from useSwapTransaction and display and interpolate NotEnoughGasSwap in LLD

### Patch Changes

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

## 6.14.0-next.0

### Minor Changes

- [#4154](https://github.com/LedgerHQ/ledger-live/pull/4154) [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Added NotEnoughGasSwap to errors, will return amountFromWarning from useSwapTransaction and display and interpolate NotEnoughGasSwap in LLD

### Patch Changes

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

## 6.13.1

### Patch Changes

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new error (only used in the device SDK) `UnresponsiveDeviceError`

## 6.13.1-next.0

### Patch Changes

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new error (only used in the device SDK) `UnresponsiveDeviceError`

## 6.13.0

### Minor Changes

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

## 6.13.0-next.0

### Minor Changes

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

## 6.12.7

### Patch Changes

- [#3631](https://github.com/LedgerHQ/ledger-live/pull/3631) [`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914) Thanks [@scnale](https://github.com/scnale)! - Adds message to TransportStatusErrors displayed in node.js

## 6.12.7-next.0

### Patch Changes

- [#3631](https://github.com/LedgerHQ/ledger-live/pull/3631) [`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914) Thanks [@scnale](https://github.com/scnale)! - Adds message to TransportStatusErrors displayed in node.js

## 6.12.6

### Patch Changes

- [#3306](https://github.com/LedgerHQ/ledger-live/pull/3306) [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546) Thanks [@chabroA](https://github.com/chabroA)! - Add missing ClaimRewardsFeesWarning error definition

## 6.12.6-next.0

### Patch Changes

- [#3306](https://github.com/LedgerHQ/ledger-live/pull/3306) [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546) Thanks [@chabroA](https://github.com/chabroA)! - Add missing ClaimRewardsFeesWarning error definition

## 6.12.5

### Patch Changes

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added mising error for broken ble pairing

## 6.12.5-next.0

### Patch Changes

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added mising error for broken ble pairing

## 6.12.4

### Patch Changes

- [#2949](https://github.com/LedgerHQ/ledger-live/pull/2949) [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - added new status code to unboarded device

- [#3002](https://github.com/LedgerHQ/ledger-live/pull/3002) [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Support 5102 status on language pack installation (full device)

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

## 6.12.4-next.0

### Patch Changes

- [#2949](https://github.com/LedgerHQ/ledger-live/pull/2949) [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - added new status code to unboarded device

- [#3002](https://github.com/LedgerHQ/ledger-live/pull/3002) [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Support 5102 status on language pack installation (full device)

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

## 6.12.3

### Patch Changes

- [#2176](https://github.com/LedgerHQ/ledger-live/pull/2176) [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handled IL old firmware bug that prevented access to My Ledger

* [#2205](https://github.com/LedgerHQ/ledger-live/pull/2205) [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling in socket.ts connections to scriptrunners

## 6.12.3-next.0

### Patch Changes

- [#2176](https://github.com/LedgerHQ/ledger-live/pull/2176) [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handled IL old firmware bug that prevented access to My Ledger

* [#2205](https://github.com/LedgerHQ/ledger-live/pull/2205) [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling in socket.ts connections to scriptrunners

## 6.12.2

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

## 6.12.2-next.0

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

## 6.12.1

### Patch Changes

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added missing StatusCodes for custom image fetch

* [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

## 6.12.1-next.0

### Patch Changes

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added missing StatusCodes for custom image fetch

* [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

## 6.12.0

### Minor Changes

- [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add EIP1559 related errors

### Patch Changes

- [#1766](https://github.com/LedgerHQ/ledger-live/pull/1766) [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff) Thanks [@gre](https://github.com/gre)! - Fixes resiliency of deserializeError.

* [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 6.12.0-next.0

### Minor Changes

- [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add EIP1559 related errors

### Patch Changes

- [#1766](https://github.com/LedgerHQ/ledger-live/pull/1766) [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff) Thanks [@gre](https://github.com/gre)! - Fixes resiliency of deserializeError.

* [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 6.11.1

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

## 6.11.1-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

## 6.11.0

### Minor Changes

- [#1253](https://github.com/LedgerHQ/ledger-live/pull/1253) [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Warning when btc transactions are pending in send flow

## 6.11.0-next.0

### Minor Changes

- [#1253](https://github.com/LedgerHQ/ledger-live/pull/1253) [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Warning when btc transactions are pending in send flow

## 6.10.2

### Patch Changes

- [#1179](https://github.com/LedgerHQ/ledger-live/pull/1179) [`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7) Thanks [@gre](https://github.com/gre)! - Improve TypeScript of @ledgerhq/errors and fixes 2 bugs in swap and stellar on their error handling

## 6.10.2-next.0

### Patch Changes

- [#1179](https://github.com/LedgerHQ/ledger-live/pull/1179) [`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7) Thanks [@gre](https://github.com/gre)! - Improve TypeScript of @ledgerhq/errors and fixes 2 bugs in swap and stellar on their error handling

## 6.10.1

### Patch Changes

- [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors

## 6.10.1-next.0

### Patch Changes

- [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors
