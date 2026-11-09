# @ledgerhq/live-signer-polkadot

## 0.1.5-next.0

### Patch Changes

- Updated dependencies [[`189dc9a`](https://github.com/LedgerHQ/ledger-live/commit/189dc9a18a3b93ff96cad3c9d2e0950b92b2646c), [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72), [`4aec050`](https://github.com/LedgerHQ/ledger-live/commit/4aec05059b0c8ab2057aabeb9e7bec564b5c809f), [`a466fb9`](https://github.com/LedgerHQ/ledger-live/commit/a466fb9e11a7f572d289537e91d10404f5f32a13), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e)]:
  - @ledgerhq/coin-polkadot@9.2.0-next.0

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@9.1.1

## 0.1.4-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@9.1.1-next.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/coin-polkadot@9.1.0
  - @ledgerhq/hw-app-polkadot@6.40.0

## 0.1.3-next.0

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/coin-polkadot@9.1.0-next.0
  - @ledgerhq/hw-app-polkadot@6.40.0-next.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`c1cbfec`](https://github.com/LedgerHQ/ledger-live/commit/c1cbfececf814d382ad6319806b966cb341eb1fd)]:
  - @ledgerhq/coin-polkadot@9.0.0

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`c1cbfec`](https://github.com/LedgerHQ/ledger-live/commit/c1cbfececf814d382ad6319806b966cb341eb1fd)]:
  - @ledgerhq/coin-polkadot@9.0.0-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`ff72be2`](https://github.com/LedgerHQ/ledger-live/commit/ff72be2d42151873c3a1a9a24828593bee9847ef)]:
  - @ledgerhq/coin-polkadot@8.0.0
  - @ledgerhq/hw-app-polkadot@6.39.0

## 0.1.1-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@8.0.0-next.1

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`ff72be2`](https://github.com/LedgerHQ/ledger-live/commit/ff72be2d42151873c3a1a9a24828593bee9847ef)]:
  - @ledgerhq/coin-polkadot@8.0.0-next.0
  - @ledgerhq/hw-app-polkadot@6.39.0

## 0.1.0

### Minor Changes

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@7.3.1

## 0.1.0-next.0

### Minor Changes

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@7.3.1-next.0
