# @ledgerhq/live-wallet

## 0.6.4-next.0

### Patch Changes

- Updated dependencies [[`87617a9`](https://github.com/LedgerHQ/ledger-live/commit/87617a9930be43a6cdbc5cc5711cc24b00309184), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1)]:
  - @ledgerhq/live-env@2.15.0-next.0
  - @ledgerhq/errors@6.25.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.13-next.0
  - @ledgerhq/live-network@2.0.16-next.0
  - @ledgerhq/speculos-transport@0.2.9-next.0
  - @ledgerhq/hw-transport@6.31.10-next.0
  - @ledgerhq/hw-transport-mocker@6.29.10-next.0

## 0.6.3

### Patch Changes

- Updated dependencies [[`29d9828`](https://github.com/LedgerHQ/ledger-live/commit/29d9828ff1bde9e7a7171e8e37986ee52f01cd59)]:
  - @ledgerhq/types-devices@6.27.0

## 0.6.3-next.0

### Patch Changes

- Updated dependencies [[`29d9828`](https://github.com/LedgerHQ/ledger-live/commit/29d9828ff1bde9e7a7171e8e37986ee52f01cd59)]:
  - @ledgerhq/types-devices@6.27.0-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`75a08cc`](https://github.com/LedgerHQ/ledger-live/commit/75a08cc3061347bae98ddef7ac3cdcd6181ddab5), [`354fa83`](https://github.com/LedgerHQ/ledger-live/commit/354fa83c8107cf8e6b56a8b306569ee65980e10c), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-env@2.14.0
  - @ledgerhq/errors@6.24.0
  - @ledgerhq/types-devices@6.26.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.12
  - @ledgerhq/live-network@2.0.15
  - @ledgerhq/speculos-transport@0.2.8
  - @ledgerhq/hw-transport@6.31.9
  - @ledgerhq/hw-transport-mocker@6.29.9

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`75a08cc`](https://github.com/LedgerHQ/ledger-live/commit/75a08cc3061347bae98ddef7ac3cdcd6181ddab5), [`354fa83`](https://github.com/LedgerHQ/ledger-live/commit/354fa83c8107cf8e6b56a8b306569ee65980e10c), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-env@2.14.0-next.0
  - @ledgerhq/errors@6.24.0-next.0
  - @ledgerhq/types-devices@6.26.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.12-next.0
  - @ledgerhq/live-network@2.0.15-next.0
  - @ledgerhq/speculos-transport@0.2.8-next.0
  - @ledgerhq/hw-transport@6.31.9-next.0
  - @ledgerhq/hw-transport-mocker@6.29.9-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`b9debdf`](https://github.com/LedgerHQ/ledger-live/commit/b9debdfbc822e9f5dc0b26619208f94bbd788777)]:
  - @ledgerhq/live-env@2.13.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.11
  - @ledgerhq/live-network@2.0.14
  - @ledgerhq/speculos-transport@0.2.7

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`b9debdf`](https://github.com/LedgerHQ/ledger-live/commit/b9debdfbc822e9f5dc0b26619208f94bbd788777)]:
  - @ledgerhq/live-env@2.13.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.11-next.0
  - @ledgerhq/live-network@2.0.14-next.0
  - @ledgerhq/speculos-transport@0.2.7-next.0

## 0.6.0

### Minor Changes

- [#10820](https://github.com/LedgerHQ/ledger-live/pull/10820) [`8b02f09`](https://github.com/LedgerHQ/ledger-live/commit/8b02f096a5e55b17df13cbb77ff0b6a7f4e03aee) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔍✨ Improve detection of legacy import base64 strings and invalid address scans

  - Better handling of legacy `Qrcode` base64 imports using stricter format and header checks
  - Improved error resilience when scanning addresses (ETH, BTC, etc.) instead of base64
  - Ignores invalid or malformed input early, reducing false positives

### Patch Changes

- Updated dependencies [[`17e039b`](https://github.com/LedgerHQ/ledger-live/commit/17e039b0c7487dda4a68f6a0fe493b4cf5fd265b), [`20406e5`](https://github.com/LedgerHQ/ledger-live/commit/20406e52b4167289fced610c6ca9824a6d68cdac)]:
  - @ledgerhq/live-env@2.12.0
  - @ledgerhq/errors@6.23.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.10
  - @ledgerhq/live-network@2.0.13
  - @ledgerhq/speculos-transport@0.2.6
  - @ledgerhq/hw-transport@6.31.8
  - @ledgerhq/hw-transport-mocker@6.29.8

## 0.6.0-next.0

### Minor Changes

- [#10820](https://github.com/LedgerHQ/ledger-live/pull/10820) [`8b02f09`](https://github.com/LedgerHQ/ledger-live/commit/8b02f096a5e55b17df13cbb77ff0b6a7f4e03aee) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔍✨ Improve detection of legacy import base64 strings and invalid address scans

  - Better handling of legacy `Qrcode` base64 imports using stricter format and header checks
  - Improved error resilience when scanning addresses (ETH, BTC, etc.) instead of base64
  - Ignores invalid or malformed input early, reducing false positives

### Patch Changes

- Updated dependencies [[`17e039b`](https://github.com/LedgerHQ/ledger-live/commit/17e039b0c7487dda4a68f6a0fe493b4cf5fd265b), [`20406e5`](https://github.com/LedgerHQ/ledger-live/commit/20406e52b4167289fced610c6ca9824a6d68cdac)]:
  - @ledgerhq/live-env@2.12.0-next.0
  - @ledgerhq/errors@6.23.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.10-next.0
  - @ledgerhq/live-network@2.0.13-next.0
  - @ledgerhq/speculos-transport@0.2.6-next.0
  - @ledgerhq/hw-transport@6.31.8-next.0
  - @ledgerhq/hw-transport-mocker@6.29.8-next.0

## 0.5.11

### Patch Changes

- Updated dependencies [[`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/live-env@2.11.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.9
  - @ledgerhq/live-network@2.0.12
  - @ledgerhq/speculos-transport@0.2.5

## 0.5.11-next.0

### Patch Changes

- Updated dependencies [[`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/live-env@2.11.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.9-next.0
  - @ledgerhq/live-network@2.0.12-next.0
  - @ledgerhq/speculos-transport@0.2.5-next.0

## 0.5.10

### Patch Changes

- Updated dependencies [[`b5e3217`](https://github.com/LedgerHQ/ledger-live/commit/b5e321789d3a6f9cb1916067790590640db0876f)]:
  - @ledgerhq/errors@6.22.0
  - @ledgerhq/hw-transport@6.31.7
  - @ledgerhq/live-network@2.0.11
  - @ledgerhq/speculos-transport@0.2.4
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.8
  - @ledgerhq/hw-transport-mocker@6.29.7

## 0.5.10-next.0

### Patch Changes

- Updated dependencies [[`b5e3217`](https://github.com/LedgerHQ/ledger-live/commit/b5e321789d3a6f9cb1916067790590640db0876f)]:
  - @ledgerhq/errors@6.22.0-next.0
  - @ledgerhq/hw-transport@6.31.7-next.0
  - @ledgerhq/live-network@2.0.11-next.0
  - @ledgerhq/speculos-transport@0.2.4-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.8-next.0
  - @ledgerhq/hw-transport-mocker@6.29.7-next.0

## 0.5.9

### Patch Changes

- Updated dependencies [[`8551c28`](https://github.com/LedgerHQ/ledger-live/commit/8551c280f24f7bd4475c6cc12f1b1d92636d9357)]:
  - @ledgerhq/live-env@2.10.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.7
  - @ledgerhq/live-network@2.0.10
  - @ledgerhq/speculos-transport@0.2.3

## 0.5.9-next.0

### Patch Changes

- Updated dependencies [[`8551c28`](https://github.com/LedgerHQ/ledger-live/commit/8551c280f24f7bd4475c6cc12f1b1d92636d9357)]:
  - @ledgerhq/live-env@2.10.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.7-next.0
  - @ledgerhq/live-network@2.0.10-next.0
  - @ledgerhq/speculos-transport@0.2.3-next.0

## 0.5.8

### Patch Changes

- Updated dependencies [[`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772), [`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95)]:
  - @ledgerhq/logs@6.13.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.6
  - @ledgerhq/hw-transport@6.31.6
  - @ledgerhq/hw-transport-mocker@6.29.6
  - @ledgerhq/live-network@2.0.9
  - @ledgerhq/speculos-transport@0.2.2

## 0.5.8-next.1

### Patch Changes

- Updated dependencies [[`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772)]:
  - @ledgerhq/logs@6.13.0-next.1
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.6-next.1
  - @ledgerhq/hw-transport@6.31.6-next.1
  - @ledgerhq/hw-transport-mocker@6.29.6-next.1
  - @ledgerhq/live-network@2.0.9-next.1
  - @ledgerhq/speculos-transport@0.2.2-next.1

## 0.5.8-next.0

### Patch Changes

- Updated dependencies [[`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95)]:
  - @ledgerhq/logs@6.13.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.6-next.0
  - @ledgerhq/hw-transport@6.31.6-next.0
  - @ledgerhq/hw-transport-mocker@6.29.6-next.0
  - @ledgerhq/live-network@2.0.9-next.0
  - @ledgerhq/speculos-transport@0.2.2-next.0

## 0.5.7

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5)]:
  - @ledgerhq/errors@6.21.0
  - @ledgerhq/live-env@2.9.0
  - @ledgerhq/hw-transport@6.31.5
  - @ledgerhq/live-network@2.0.8
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.5
  - @ledgerhq/speculos-transport@0.2.1
  - @ledgerhq/hw-transport-mocker@6.29.5

## 0.5.7-next.0

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5)]:
  - @ledgerhq/errors@6.21.0-next.0
  - @ledgerhq/live-env@2.9.0-next.0
  - @ledgerhq/hw-transport@6.31.5-next.0
  - @ledgerhq/live-network@2.0.8-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.5-next.0
  - @ledgerhq/speculos-transport@0.2.1-next.0
  - @ledgerhq/hw-transport-mocker@6.29.5-next.0

## 0.5.6

### Patch Changes

- Updated dependencies [[`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/speculos-transport@0.2.0
  - @ledgerhq/live-env@2.8.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.4
  - @ledgerhq/live-network@2.0.7

## 0.5.6-next.0

### Patch Changes

- Updated dependencies [[`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/speculos-transport@0.2.0-next.0
  - @ledgerhq/live-env@2.8.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.4-next.0
  - @ledgerhq/live-network@2.0.7-next.0

## 0.5.5

### Patch Changes

- Updated dependencies [[`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7)]:
  - @ledgerhq/live-env@2.7.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.3
  - @ledgerhq/live-network@2.0.6
  - @ledgerhq/speculos-transport@0.1.11

## 0.5.5-next.0

### Patch Changes

- Updated dependencies [[`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7)]:
  - @ledgerhq/live-env@2.7.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.3-next.0
  - @ledgerhq/live-network@2.0.6-next.0
  - @ledgerhq/speculos-transport@0.1.11-next.0

## 0.5.4

### Patch Changes

- Updated dependencies [[`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e), [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1)]:
  - @ledgerhq/live-env@2.6.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.2
  - @ledgerhq/live-network@2.0.5
  - @ledgerhq/speculos-transport@0.1.10

## 0.5.4-next.0

### Patch Changes

- Updated dependencies [[`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e), [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1)]:
  - @ledgerhq/live-env@2.6.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.2-next.0
  - @ledgerhq/live-network@2.0.5-next.0
  - @ledgerhq/speculos-transport@0.1.10-next.0

## 0.5.3

### Patch Changes

- Updated dependencies [[`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890)]:
  - @ledgerhq/live-env@2.5.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.1
  - @ledgerhq/live-network@2.0.4
  - @ledgerhq/speculos-transport@0.1.9

## 0.5.3-next.0

### Patch Changes

- Updated dependencies [[`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890)]:
  - @ledgerhq/live-env@2.5.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.1-next.0
  - @ledgerhq/live-network@2.0.4-next.0
  - @ledgerhq/speculos-transport@0.1.9-next.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`fbff5e4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5e46c871d4f0d9d89a5638309408bb057197)]:
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.0

## 0.5.2-next.0

### Patch Changes

- Updated dependencies [[`fbff5e4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5e46c871d4f0d9d89a5638309408bb057197)]:
  - @ledgerhq/hw-ledger-key-ring-protocol@0.3.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`5c13c7b`](https://github.com/LedgerHQ/ledger-live/commit/5c13c7bf743333f09cbfee720d275dfae7e157d2), [`95fbec9`](https://github.com/LedgerHQ/ledger-live/commit/95fbec9fdff75cd6d4ac23e189e876efffc81906), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93)]:
  - @ledgerhq/live-env@2.4.1
  - @ledgerhq/hw-ledger-key-ring-protocol@0.2.1
  - @ledgerhq/live-network@2.0.3
  - @ledgerhq/speculos-transport@0.1.8

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`5c13c7b`](https://github.com/LedgerHQ/ledger-live/commit/5c13c7bf743333f09cbfee720d275dfae7e157d2), [`95fbec9`](https://github.com/LedgerHQ/ledger-live/commit/95fbec9fdff75cd6d4ac23e189e876efffc81906), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93)]:
  - @ledgerhq/live-env@2.4.1-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.2.1-next.0
  - @ledgerhq/live-network@2.0.3-next.0
  - @ledgerhq/speculos-transport@0.1.8-next.0

## 0.5.0

### Minor Changes

- [#7964](https://github.com/LedgerHQ/ledger-live/pull/7964) [`9032845`](https://github.com/LedgerHQ/ledger-live/commit/9032845a3cbadf40d545d6832e0280880e0be3d7) Thanks [@KVNLS](https://github.com/KVNLS)! - Use Ledger Key Ring Protocol naming

### Patch Changes

- [#7945](https://github.com/LedgerHQ/ledger-live/pull/7945) [`a47e68b`](https://github.com/LedgerHQ/ledger-live/commit/a47e68b568a3b888a241c30345b4935557404215) Thanks [@thesan](https://github.com/thesan)! - Fix type errors in `@ledgerhq/ledger-key-ring-protocol` tests

- Updated dependencies [[`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f), [`9032845`](https://github.com/LedgerHQ/ledger-live/commit/9032845a3cbadf40d545d6832e0280880e0be3d7)]:
  - @ledgerhq/live-env@2.4.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.2.0
  - @ledgerhq/live-network@2.0.2
  - @ledgerhq/speculos-transport@0.1.7

## 0.5.0-next.0

### Minor Changes

- [#7964](https://github.com/LedgerHQ/ledger-live/pull/7964) [`9032845`](https://github.com/LedgerHQ/ledger-live/commit/9032845a3cbadf40d545d6832e0280880e0be3d7) Thanks [@KVNLS](https://github.com/KVNLS)! - Use Ledger Key Ring Protocol naming

### Patch Changes

- [#7945](https://github.com/LedgerHQ/ledger-live/pull/7945) [`a47e68b`](https://github.com/LedgerHQ/ledger-live/commit/a47e68b568a3b888a241c30345b4935557404215) Thanks [@thesan](https://github.com/thesan)! - Fix type errors in `@ledgerhq/ledger-key-ring-protocol` tests

- Updated dependencies [[`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f), [`9032845`](https://github.com/LedgerHQ/ledger-live/commit/9032845a3cbadf40d545d6832e0280880e0be3d7)]:
  - @ledgerhq/live-env@2.4.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.2.0-next.0
  - @ledgerhq/live-network@2.0.2-next.0
  - @ledgerhq/speculos-transport@0.1.7-next.0

## 0.4.1

### Patch Changes

- [#7945](https://github.com/LedgerHQ/ledger-live/pull/7945) [`a47e68b`](https://github.com/LedgerHQ/ledger-live/commit/a47e68b568a3b888a241c30345b4935557404215) Thanks [@thesan](https://github.com/thesan)! - Fix type errors in `@ledgerhq/trustchain` tests

## 0.4.1-next.0

### Patch Changes

- [#7945](https://github.com/LedgerHQ/ledger-live/pull/7945) [`a47e68b`](https://github.com/LedgerHQ/ledger-live/commit/a47e68b568a3b888a241c30345b4935557404215) Thanks [@thesan](https://github.com/thesan)! - Fix type errors in `@ledgerhq/trustchain` tests

## 0.4.0

### Minor Changes

- [#7823](https://github.com/LedgerHQ/ledger-live/pull/7823) [`c4309b1`](https://github.com/LedgerHQ/ledger-live/commit/c4309b17f8e34e664896fd357d1eeac14e318473) Thanks [@thesan](https://github.com/thesan)! - Allow members to sync immediately after getting removed

### Patch Changes

- [#7800](https://github.com/LedgerHQ/ledger-live/pull/7800) [`52ae4d3`](https://github.com/LedgerHQ/ledger-live/commit/52ae4d3ea2ae52306e868923e48f4a5807a78d57) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Display relevant error when scanning old accounts export qr code or an invalid one

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330)]:
  - @ledgerhq/live-network@2.0.1
  - @ledgerhq/errors@6.19.1
  - @ledgerhq/speculos-transport@0.1.6
  - @ledgerhq/hw-transport@6.31.4
  - @ledgerhq/hw-trustchain@0.1.6
  - @ledgerhq/hw-transport-mocker@6.29.4

## 0.4.0-next.1

### Patch Changes

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf)]:
  - @ledgerhq/live-network@2.0.1-next.1
  - @ledgerhq/speculos-transport@0.1.6-next.1

## 0.4.0-next.0

### Minor Changes

- [#7823](https://github.com/LedgerHQ/ledger-live/pull/7823) [`c4309b1`](https://github.com/LedgerHQ/ledger-live/commit/c4309b17f8e34e664896fd357d1eeac14e318473) Thanks [@thesan](https://github.com/thesan)! - Allow members to sync immediately after getting removed

### Patch Changes

- [#7800](https://github.com/LedgerHQ/ledger-live/pull/7800) [`52ae4d3`](https://github.com/LedgerHQ/ledger-live/commit/52ae4d3ea2ae52306e868923e48f4a5807a78d57) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Display relevant error when scanning old accounts export qr code or an invalid one

- Updated dependencies [[`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330)]:
  - @ledgerhq/errors@6.19.1-next.0
  - @ledgerhq/hw-transport@6.31.4-next.0
  - @ledgerhq/live-network@2.0.1-next.0
  - @ledgerhq/speculos-transport@0.1.6-next.0
  - @ledgerhq/hw-trustchain@0.1.6-next.0
  - @ledgerhq/hw-transport-mocker@6.29.4-next.0

## 0.3.0

### Minor Changes

- [#7603](https://github.com/LedgerHQ/ledger-live/pull/7603) [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7) Thanks [@thesan](https://github.com/thesan)! - Fix Trustchain error when switching device while logged in

- [#7646](https://github.com/LedgerHQ/ledger-live/pull/7646) [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added the synchronization of a trustchain from mobile to desktop by scanning the QR code

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

- [#7440](https://github.com/LedgerHQ/ledger-live/pull/7440) [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194) Thanks [@thesan](https://github.com/thesan)! - Request device access within `HWDeviceProvider`

### Patch Changes

- [#7591](https://github.com/LedgerHQ/ledger-live/pull/7591) [`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Prevent duplicate add member

- [#7588](https://github.com/LedgerHQ/ledger-live/pull/7588) [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Removed member ejected on get members

- [#7561](https://github.com/LedgerHQ/ledger-live/pull/7561) [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix get Members errors GetMember :Error: ["useGetMembers", null] data is undefined

- [#7733](https://github.com/LedgerHQ/ledger-live/pull/7733) [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f) Thanks [@thesan](https://github.com/thesan)! - Handle Ledgersync onboarding errors

- [#7712](https://github.com/LedgerHQ/ledger-live/pull/7712) [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handle TrustchainAlreadyInitialized & TrustchainAlreadyInitializedWithOtherSeed on Scan QR

- [#7632](https://github.com/LedgerHQ/ledger-live/pull/7632) [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Fix the getOrCreateTrustchain that wasn't working when another instance destroyed the trustchain

- [#7687](https://github.com/LedgerHQ/ledger-live/pull/7687) [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handling alredy created key with new or same Ledger device

- [#7690](https://github.com/LedgerHQ/ledger-live/pull/7690) [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57) Thanks [@thesan](https://github.com/thesan)! - Refresh ledger sync QR code on expiration

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`8e0ac04`](https://github.com/LedgerHQ/ledger-live/commit/8e0ac04ac8cdaaee59633ebdf219e5dcf44a10df), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/speculos-transport@0.1.5
  - @ledgerhq/live-env@2.3.0
  - @ledgerhq/hw-trustchain@0.1.5
  - @ledgerhq/hw-transport@6.31.3
  - @ledgerhq/hw-transport-mocker@6.29.3

## 0.3.0-next.0

### Minor Changes

- [#7603](https://github.com/LedgerHQ/ledger-live/pull/7603) [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7) Thanks [@thesan](https://github.com/thesan)! - Fix Trustchain error when switching device while logged in

- [#7646](https://github.com/LedgerHQ/ledger-live/pull/7646) [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added the synchronization of a trustchain from mobile to desktop by scanning the QR code

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

- [#7440](https://github.com/LedgerHQ/ledger-live/pull/7440) [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194) Thanks [@thesan](https://github.com/thesan)! - Request device access within `HWDeviceProvider`

### Patch Changes

- [#7591](https://github.com/LedgerHQ/ledger-live/pull/7591) [`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Prevent duplicate add member

- [#7588](https://github.com/LedgerHQ/ledger-live/pull/7588) [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Removed member ejected on get members

- [#7561](https://github.com/LedgerHQ/ledger-live/pull/7561) [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix get Members errors GetMember :Error: ["useGetMembers", null] data is undefined

- [#7733](https://github.com/LedgerHQ/ledger-live/pull/7733) [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f) Thanks [@thesan](https://github.com/thesan)! - Handle Ledgersync onboarding errors

- [#7712](https://github.com/LedgerHQ/ledger-live/pull/7712) [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handle TrustchainAlreadyInitialized & TrustchainAlreadyInitializedWithOtherSeed on Scan QR

- [#7632](https://github.com/LedgerHQ/ledger-live/pull/7632) [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Fix the getOrCreateTrustchain that wasn't working when another instance destroyed the trustchain

- [#7687](https://github.com/LedgerHQ/ledger-live/pull/7687) [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handling alredy created key with new or same Ledger device

- [#7690](https://github.com/LedgerHQ/ledger-live/pull/7690) [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57) Thanks [@thesan](https://github.com/thesan)! - Refresh ledger sync QR code on expiration

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`8e0ac04`](https://github.com/LedgerHQ/ledger-live/commit/8e0ac04ac8cdaaee59633ebdf219e5dcf44a10df), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/speculos-transport@0.1.5-next.0
  - @ledgerhq/live-env@2.3.0-next.0
  - @ledgerhq/hw-trustchain@0.1.5-next.0
  - @ledgerhq/hw-transport@6.31.3-next.0
  - @ledgerhq/hw-transport-mocker@6.29.3-next.0

## 0.2.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7131](https://github.com/LedgerHQ/ledger-live/pull/7131) [`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persistent Trustchain store

- [#7303](https://github.com/LedgerHQ/ledger-live/pull/7303) [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38) Thanks [@thesan](https://github.com/thesan)! - Test refusing member removal on device

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7388](https://github.com/LedgerHQ/ledger-live/pull/7388) [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26) Thanks [@thesan](https://github.com/thesan)! - Factor device interactions out of the Trustchain SDK

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`8dd0fb1`](https://github.com/LedgerHQ/ledger-live/commit/8dd0fb195525eef4600a8ecbca2a80a1899de321)]:
  - @ledgerhq/hw-trustchain@0.1.4
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/live-network@1.4.0
  - @ledgerhq/types-devices@6.25.3
  - @ledgerhq/speculos-transport@0.1.4

## 0.2.0-next.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7131](https://github.com/LedgerHQ/ledger-live/pull/7131) [`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persistent Trustchain store

- [#7303](https://github.com/LedgerHQ/ledger-live/pull/7303) [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38) Thanks [@thesan](https://github.com/thesan)! - Test refusing member removal on device

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7388](https://github.com/LedgerHQ/ledger-live/pull/7388) [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26) Thanks [@thesan](https://github.com/thesan)! - Factor device interactions out of the Trustchain SDK

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`8dd0fb1`](https://github.com/LedgerHQ/ledger-live/commit/8dd0fb195525eef4600a8ecbca2a80a1899de321)]:
  - @ledgerhq/hw-trustchain@0.1.4-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/live-network@1.4.0-next.0
  - @ledgerhq/types-devices@6.25.3-next.0
  - @ledgerhq/speculos-transport@0.1.4-next.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`af3d126`](https://github.com/LedgerHQ/ledger-live/commit/af3d126b524dbacf606e3beb56246608f2243eca)]:
  - @ledgerhq/types-devices@6.25.2
  - @ledgerhq/hw-transport@6.31.2
  - @ledgerhq/speculos-transport@0.1.3
  - @ledgerhq/hw-trustchain@0.1.3
  - @ledgerhq/hw-transport-mocker@6.29.2

## 0.1.3-hotfix.1

### Patch Changes

- Updated dependencies [[`af3d126`](https://github.com/LedgerHQ/ledger-live/commit/af3d126b524dbacf606e3beb56246608f2243eca)]:
  - @ledgerhq/types-devices@6.25.2-hotfix.0

## 0.1.3-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.2-hotfix.0
  - @ledgerhq/speculos-transport@0.1.3-hotfix.0
  - @ledgerhq/hw-trustchain@0.1.3-hotfix.0
  - @ledgerhq/hw-transport-mocker@6.29.2-hotfix.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`c9329bb`](https://github.com/LedgerHQ/ledger-live/commit/c9329bb94d115bef23b02fdbed7c62f01c186d0a), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/types-devices@6.25.1
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/hw-transport@6.31.1
  - @ledgerhq/live-network@1.3.1
  - @ledgerhq/speculos-transport@0.1.2
  - @ledgerhq/hw-trustchain@0.1.2
  - @ledgerhq/hw-transport-mocker@6.29.1

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`c9329bb`](https://github.com/LedgerHQ/ledger-live/commit/c9329bb94d115bef23b02fdbed7c62f01c186d0a), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/types-devices@6.25.1-next.0
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/hw-transport@6.31.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0
  - @ledgerhq/speculos-transport@0.1.2-next.0
  - @ledgerhq/hw-trustchain@0.1.2-next.0
  - @ledgerhq/hw-transport-mocker@6.29.1-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c)]:
  - @ledgerhq/hw-transport@6.31.0
  - @ledgerhq/errors@6.17.0
  - @ledgerhq/live-network@1.3.0
  - @ledgerhq/live-env@2.1.0
  - @ledgerhq/hw-trustchain@0.1.1

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c)]:
  - @ledgerhq/hw-transport@6.31.0-next.0
  - @ledgerhq/errors@6.17.0-next.0
  - @ledgerhq/live-network@1.3.0-next.0
  - @ledgerhq/live-env@2.1.0-next.0
  - @ledgerhq/hw-trustchain@0.1.1-next.0
