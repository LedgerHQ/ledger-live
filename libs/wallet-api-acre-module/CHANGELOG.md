# @ledgerhq/wallet-api-acre-module

## 0.9.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

## 0.9.0-next.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

## 0.8.0

### Minor Changes

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12030](https://github.com/LedgerHQ/ledger-live/pull/12030) [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a) Thanks [@semeano](https://github.com/semeano)! - Update wallet API dependencies

## 0.8.0-next.0

### Minor Changes

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12030](https://github.com/LedgerHQ/ledger-live/pull/12030) [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a) Thanks [@semeano](https://github.com/semeano)! - Update wallet API dependencies

## 0.7.0

### Minor Changes

- [#11369](https://github.com/LedgerHQ/ledger-live/pull/11369) [`9ed8f42`](https://github.com/LedgerHQ/ledger-live/commit/9ed8f42b179e6c18811a613e5fe9d8ff899b5b94) Thanks [@RomanWlm](https://github.com/RomanWlm)! - Add new ACRE custom handler endpoint alowwing ACRE dApp to register btc Yield Bearing ETh account as part of LedgerLive accounts

## 0.7.0-next.0

### Minor Changes

- [#11369](https://github.com/LedgerHQ/ledger-live/pull/11369) [`9ed8f42`](https://github.com/LedgerHQ/ledger-live/commit/9ed8f42b179e6c18811a613e5fe9d8ff899b5b94) Thanks [@RomanWlm](https://github.com/RomanWlm)! - Add new ACRE custom handler endpoint alowwing ACRE dApp to register btc Yield Bearing ETh account as part of LedgerLive accounts

## 0.6.0

### Minor Changes

- [#10895](https://github.com/LedgerHQ/ledger-live/pull/10895) [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Support Apex

## 0.6.0-next.0

### Minor Changes

- [#10895](https://github.com/LedgerHQ/ledger-live/pull/10895) [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Support Apex

## 0.5.0

### Minor Changes

- [#9837](https://github.com/LedgerHQ/ledger-live/pull/9837) [`1488235`](https://github.com/LedgerHQ/ledger-live/commit/1488235ee13fd1f6e71b7bae0da88142986e6c6d) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#10146](https://github.com/LedgerHQ/ledger-live/pull/10146) [`ff447b4`](https://github.com/LedgerHQ/ledger-live/commit/ff447b4ded74469b3e9599068951c7f4f2aa4dc5) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.5.0-next.0

### Minor Changes

- [#9837](https://github.com/LedgerHQ/ledger-live/pull/9837) [`1488235`](https://github.com/LedgerHQ/ledger-live/commit/1488235ee13fd1f6e71b7bae0da88142986e6c6d) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#10146](https://github.com/LedgerHQ/ledger-live/pull/10146) [`ff447b4`](https://github.com/LedgerHQ/ledger-live/commit/ff447b4ded74469b3e9599068951c7f4f2aa4dc5) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.4.0

### Minor Changes

- [#9811](https://github.com/LedgerHQ/ledger-live/pull/9811) [`7456a97`](https://github.com/LedgerHQ/ledger-live/commit/7456a97e358afa5d59e0d394dfa29cb80dee65d1) Thanks [@qperrot](https://github.com/qperrot)! - Add approve and revoke commande and upgarde wallet api versions

## 0.4.0-next.0

### Minor Changes

- [#9811](https://github.com/LedgerHQ/ledger-live/pull/9811) [`7456a97`](https://github.com/LedgerHQ/ledger-live/commit/7456a97e358afa5d59e0d394dfa29cb80dee65d1) Thanks [@qperrot](https://github.com/qperrot)! - Add approve and revoke commande and upgarde wallet api versions

## 0.3.0

### Minor Changes

- [#9660](https://github.com/LedgerHQ/ledger-live/pull/9660) [`ad6d873`](https://github.com/LedgerHQ/ledger-live/commit/ad6d87394cf53f7912a1aa7a5392635570b8374f) Thanks [@jonezque](https://github.com/jonezque)! - chore: bumped wallet-api with sui integration

## 0.3.0-next.0

### Minor Changes

- [#9660](https://github.com/LedgerHQ/ledger-live/pull/9660) [`ad6d873`](https://github.com/LedgerHQ/ledger-live/commit/ad6d87394cf53f7912a1aa7a5392635570b8374f) Thanks [@jonezque](https://github.com/jonezque)! - chore: bumped wallet-api with sui integration

## 0.2.0

### Minor Changes

- [#9147](https://github.com/LedgerHQ/ledger-live/pull/9147) [`1bd0955`](https://github.com/LedgerHQ/ledger-live/commit/1bd0955280a92fab7cf800b49d0ca5314ecbbdc9) Thanks [@semeano](https://github.com/semeano)! - Update wallet api dependencies

- [#9096](https://github.com/LedgerHQ/ledger-live/pull/9096) [`49cb00c`](https://github.com/LedgerHQ/ledger-live/commit/49cb00cca4ac96634a4e052ec6a007a19cb73ed5) Thanks [@semeano](https://github.com/semeano)! - Update WalletAPI dependencies

## 0.2.0-next.0

### Minor Changes

- [#9147](https://github.com/LedgerHQ/ledger-live/pull/9147) [`1bd0955`](https://github.com/LedgerHQ/ledger-live/commit/1bd0955280a92fab7cf800b49d0ca5314ecbbdc9) Thanks [@semeano](https://github.com/semeano)! - Update wallet api dependencies

- [#9096](https://github.com/LedgerHQ/ledger-live/pull/9096) [`49cb00c`](https://github.com/LedgerHQ/ledger-live/commit/49cb00cca4ac96634a4e052ec6a007a19cb73ed5) Thanks [@semeano](https://github.com/semeano)! - Update WalletAPI dependencies

## 0.1.0

### Minor Changes

- [#7944](https://github.com/LedgerHQ/ledger-live/pull/7944) [`abe4dcc`](https://github.com/LedgerHQ/ledger-live/commit/abe4dcc0cc839a860228d5d89f769546cde7fdcb) Thanks [@Justkant](https://github.com/Justkant)! - feat: bootstrap wallet-api custom ACRE module and handlers

## 0.1.0-next.0

### Minor Changes

- [#7944](https://github.com/LedgerHQ/ledger-live/pull/7944) [`abe4dcc`](https://github.com/LedgerHQ/ledger-live/commit/abe4dcc0cc839a860228d5d89f769546cde7fdcb) Thanks [@Justkant](https://github.com/Justkant)! - feat: bootstrap wallet-api custom ACRE module and handlers
