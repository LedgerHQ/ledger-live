# @ledgerhq/live-signer-celo

## 1.2.5-next.0

### Patch Changes

- Updated dependencies [[`6780db0`](https://github.com/LedgerHQ/ledger-live/commit/6780db014288dd297ed2d6b9e2133a5d91debc8a), [`937c4f8`](https://github.com/LedgerHQ/ledger-live/commit/937c4f853cfc514a3fdc685bd6b264fd70ff7e13), [`1b789dc`](https://github.com/LedgerHQ/ledger-live/commit/1b789dc76939a2791e34fefb512652bac71ae4df)]:
  - @ledgerhq/coin-celo@3.1.0-next.0
  - @ledgerhq/hw-app-eth@7.8.17-next.0
  - @ledgerhq/hw-app-celo@7.1.14-next.0

## 1.2.4

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@3.0.1
  - @ledgerhq/hw-app-eth@7.8.16
  - @ledgerhq/hw-app-celo@7.1.13

## 1.2.4-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@3.0.1-next.0
  - @ledgerhq/hw-app-eth@7.8.16-next.0
  - @ledgerhq/hw-app-celo@7.1.13-next.0

## 1.2.3

### Patch Changes

- Updated dependencies [[`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b)]:
  - @ledgerhq/coin-celo@3.0.0
  - @ledgerhq/hw-app-eth@7.8.15
  - @ledgerhq/hw-app-celo@7.1.12

## 1.2.3-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@3.0.0-next.1
  - @ledgerhq/hw-app-eth@7.8.15-next.1
  - @ledgerhq/hw-app-celo@7.1.12-next.1

## 1.2.3-next.0

### Patch Changes

- Updated dependencies [[`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b)]:
  - @ledgerhq/coin-celo@3.0.0-next.0
  - @ledgerhq/hw-app-eth@7.8.15-next.0
  - @ledgerhq/hw-app-celo@7.1.12-next.0

## 1.2.2

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63)]:
  - @ledgerhq/coin-celo@2.13.0
  - @ledgerhq/hw-app-eth@7.8.14
  - @ledgerhq/hw-app-celo@7.1.11

## 1.2.2-next.0

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63)]:
  - @ledgerhq/coin-celo@2.13.0-next.0
  - @ledgerhq/hw-app-eth@7.8.14-next.0
  - @ledgerhq/hw-app-celo@7.1.11-next.0

## 1.2.1

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add)]:
  - @ledgerhq/coin-celo@2.12.0
  - @ledgerhq/hw-app-eth@7.8.13
  - @ledgerhq/hw-app-celo@7.1.10

## 1.2.1-next.0

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add)]:
  - @ledgerhq/coin-celo@2.12.0-next.0
  - @ledgerhq/hw-app-eth@7.8.13-next.0
  - @ledgerhq/hw-app-celo@7.1.10-next.0

## 1.2.0

### Minor Changes

- [#19733](https://github.com/LedgerHQ/ledger-live/pull/19733) [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20) Thanks [@ishaba](https://github.com/ishaba)! - celo: fix add-account failing entirely with `UNKNOWN_ERROR (0x6a15)` on older Celo apps. Scanning now skips a derivation path the installed app does not authorize (celoEvm account index >= 1 on apps < 1.7.0, which return the OS "path not authorized" status word) instead of aborting the whole scan — so accounts on authorized paths are still added. Gated on both the `0x6a15` status word and the installed Celo app version (`< 1.7.0`, read via `getAppConfiguration`), so behavior is unchanged on up-to-date apps.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/coin-celo@2.11.0
  - @ledgerhq/hw-app-celo@7.1.9
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/hw-app-eth@7.8.12

## 1.2.0-next.0

### Minor Changes

- [#19733](https://github.com/LedgerHQ/ledger-live/pull/19733) [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20) Thanks [@ishaba](https://github.com/ishaba)! - celo: fix add-account failing entirely with `UNKNOWN_ERROR (0x6a15)` on older Celo apps. Scanning now skips a derivation path the installed app does not authorize (celoEvm account index >= 1 on apps < 1.7.0, which return the OS "path not authorized" status word) instead of aborting the whole scan — so accounts on authorized paths are still added. Gated on both the `0x6a15` status word and the installed Celo app version (`< 1.7.0`, read via `getAppConfiguration`), so behavior is unchanged on up-to-date apps.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/coin-celo@2.11.0-next.0
  - @ledgerhq/hw-app-celo@7.1.9-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/hw-app-eth@7.8.12-next.0

## 1.1.8

### Patch Changes

- Updated dependencies [[`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/coin-celo@2.10.0
  - @ledgerhq/hw-app-eth@7.8.11
  - @ledgerhq/hw-app-celo@7.1.8

## 1.1.8-next.0

### Patch Changes

- Updated dependencies [[`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/coin-celo@2.10.0-next.0
  - @ledgerhq/hw-app-eth@7.8.11-next.0
  - @ledgerhq/hw-app-celo@7.1.8-next.0

## 1.1.7

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f)]:
  - @ledgerhq/coin-celo@2.9.0
  - @ledgerhq/hw-app-eth@7.8.10
  - @ledgerhq/hw-app-celo@7.1.7

## 1.1.7-next.0

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f)]:
  - @ledgerhq/coin-celo@2.9.0-next.0
  - @ledgerhq/hw-app-eth@7.8.10-next.0
  - @ledgerhq/hw-app-celo@7.1.7-next.0

## 1.1.6

### Patch Changes

- Updated dependencies [[`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07), [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38)]:
  - @ledgerhq/coin-celo@2.8.0
  - @ledgerhq/hw-app-eth@7.8.9
  - @ledgerhq/hw-transport@6.35.6
  - @ledgerhq/hw-app-celo@7.1.6

## 1.1.6-next.0

### Patch Changes

- Updated dependencies [[`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07), [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38)]:
  - @ledgerhq/coin-celo@2.8.0-next.0
  - @ledgerhq/hw-app-eth@7.8.9-next.0
  - @ledgerhq/hw-transport@6.35.6-next.0
  - @ledgerhq/hw-app-celo@7.1.6-next.0

## 1.1.5

### Patch Changes

- Updated dependencies [[`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292)]:
  - @ledgerhq/coin-celo@2.7.0
  - @ledgerhq/hw-app-eth@7.8.8
  - @ledgerhq/hw-app-celo@7.1.5
  - @ledgerhq/hw-transport@6.35.5

## 1.1.5-next.0

### Patch Changes

- Updated dependencies [[`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292)]:
  - @ledgerhq/coin-celo@2.7.0-next.0
  - @ledgerhq/hw-app-eth@7.8.8-next.0
  - @ledgerhq/hw-app-celo@7.1.5-next.0
  - @ledgerhq/hw-transport@6.35.5-next.0

## 1.1.4

### Patch Changes

- Updated dependencies [[`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`621a175`](https://github.com/LedgerHQ/ledger-live/commit/621a1756ef8b59844a086a610ff45819521ff633)]:
  - @ledgerhq/coin-celo@2.6.0
  - @ledgerhq/hw-app-eth@7.8.7
  - @ledgerhq/hw-app-celo@7.1.4

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
