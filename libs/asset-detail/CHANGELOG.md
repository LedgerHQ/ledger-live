# @ledgerhq/asset-detail

## 0.2.0

### Minor Changes

- [#17383](https://github.com/LedgerHQ/ledger-live/pull/17383) [`e4818e2`](https://github.com/LedgerHQ/ledger-live/commit/e4818e2abef15aac4db10ac86ab2c4193982f271) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Introduce `@ledgerhq/asset-detail` shared lib with the `useAssetMarketData` hook, `AssetDetailMarketInfo` / `AssetMarketData` types, and `resolveAssetDetailMarketInfo` utils. The desktop Asset Detail feature now consumes the shared module instead of maintaining its own implementation, so mobile can plug in next without re-implementing the fetching strategy.

### Patch Changes

- Updated dependencies [[`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`d806e9f`](https://github.com/LedgerHQ/ledger-live/commit/d806e9f0aa42e4179de38dd1b8debf10aed3b17d), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b8c353`](https://github.com/LedgerHQ/ledger-live/commit/3b8c353ffe1afbdccab0a1dff1aea6f3eeca2ff0), [`239c8b3`](https://github.com/LedgerHQ/ledger-live/commit/239c8b3acbc60bdb485e2fa881d6e8df13feee59), [`9640708`](https://github.com/LedgerHQ/ledger-live/commit/96407084630c8983841a0b8261f071e75461294a), [`43d5b48`](https://github.com/LedgerHQ/ledger-live/commit/43d5b489381ad45340facd7c3777b702798ed73d), [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff), [`ad3b107`](https://github.com/LedgerHQ/ledger-live/commit/ad3b107938cd39a3b2e15e2fcf1e6526fd7b08fc), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`0844c03`](https://github.com/LedgerHQ/ledger-live/commit/0844c03998a9653013964be71c1297ce2634f23c), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`df45280`](https://github.com/LedgerHQ/ledger-live/commit/df45280fc0a148d4138308b9ee1d7076c576f749), [`6d37772`](https://github.com/LedgerHQ/ledger-live/commit/6d37772d94f94e9174c81f75584c9bf70b149e6d), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`6672e79`](https://github.com/LedgerHQ/ledger-live/commit/6672e796929da8fb264e7dbe71b94fc3a74151d8), [`78426e6`](https://github.com/LedgerHQ/ledger-live/commit/78426e6da544dc7e5d85040ac2be5eab956cb20b), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`c54beb4`](https://github.com/LedgerHQ/ledger-live/commit/c54beb480e3aa1f0155013ce15d8b0039d653b6b), [`d20d764`](https://github.com/LedgerHQ/ledger-live/commit/d20d764d3485572353b17690581ee59f8d029afe), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`474c32c`](https://github.com/LedgerHQ/ledger-live/commit/474c32c5763fd25727eb5a83f723e84978288b69), [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`232f22b`](https://github.com/LedgerHQ/ledger-live/commit/232f22bea2703eababffb4862220c1a009d03985), [`3e1b1bd`](https://github.com/LedgerHQ/ledger-live/commit/3e1b1bd5e3343afca8486b8aca96a58b736e3358), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b), [`96bf48f`](https://github.com/LedgerHQ/ledger-live/commit/96bf48f0a53f3b2de047bb99b5c9a32a9328735c), [`8601228`](https://github.com/LedgerHQ/ledger-live/commit/8601228d7c38c2da79357c5d21458fffc210fe7d), [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d)]:
  - @ledgerhq/live-common@34.72.0

## 0.2.0-next.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.72.0-next.3

## 0.2.0-next.2

### Patch Changes

- Updated dependencies [[`9640708`](https://github.com/LedgerHQ/ledger-live/commit/96407084630c8983841a0b8261f071e75461294a)]:
  - @ledgerhq/live-common@34.72.0-next.2

## 0.2.0-next.1

### Patch Changes

- Updated dependencies [[`474c32c`](https://github.com/LedgerHQ/ledger-live/commit/474c32c5763fd25727eb5a83f723e84978288b69)]:
  - @ledgerhq/live-common@34.72.0-next.1

## 0.2.0-next.0

### Minor Changes

- [#17383](https://github.com/LedgerHQ/ledger-live/pull/17383) [`e4818e2`](https://github.com/LedgerHQ/ledger-live/commit/e4818e2abef15aac4db10ac86ab2c4193982f271) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Introduce `@ledgerhq/asset-detail` shared lib with the `useAssetMarketData` hook, `AssetDetailMarketInfo` / `AssetMarketData` types, and `resolveAssetDetailMarketInfo` utils. The desktop Asset Detail feature now consumes the shared module instead of maintaining its own implementation, so mobile can plug in next without re-implementing the fetching strategy.

### Patch Changes

- Updated dependencies [[`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`d806e9f`](https://github.com/LedgerHQ/ledger-live/commit/d806e9f0aa42e4179de38dd1b8debf10aed3b17d), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b8c353`](https://github.com/LedgerHQ/ledger-live/commit/3b8c353ffe1afbdccab0a1dff1aea6f3eeca2ff0), [`239c8b3`](https://github.com/LedgerHQ/ledger-live/commit/239c8b3acbc60bdb485e2fa881d6e8df13feee59), [`43d5b48`](https://github.com/LedgerHQ/ledger-live/commit/43d5b489381ad45340facd7c3777b702798ed73d), [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff), [`ad3b107`](https://github.com/LedgerHQ/ledger-live/commit/ad3b107938cd39a3b2e15e2fcf1e6526fd7b08fc), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`0844c03`](https://github.com/LedgerHQ/ledger-live/commit/0844c03998a9653013964be71c1297ce2634f23c), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`df45280`](https://github.com/LedgerHQ/ledger-live/commit/df45280fc0a148d4138308b9ee1d7076c576f749), [`6d37772`](https://github.com/LedgerHQ/ledger-live/commit/6d37772d94f94e9174c81f75584c9bf70b149e6d), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`6672e79`](https://github.com/LedgerHQ/ledger-live/commit/6672e796929da8fb264e7dbe71b94fc3a74151d8), [`78426e6`](https://github.com/LedgerHQ/ledger-live/commit/78426e6da544dc7e5d85040ac2be5eab956cb20b), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`c54beb4`](https://github.com/LedgerHQ/ledger-live/commit/c54beb480e3aa1f0155013ce15d8b0039d653b6b), [`d20d764`](https://github.com/LedgerHQ/ledger-live/commit/d20d764d3485572353b17690581ee59f8d029afe), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`232f22b`](https://github.com/LedgerHQ/ledger-live/commit/232f22bea2703eababffb4862220c1a009d03985), [`3e1b1bd`](https://github.com/LedgerHQ/ledger-live/commit/3e1b1bd5e3343afca8486b8aca96a58b736e3358), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b), [`96bf48f`](https://github.com/LedgerHQ/ledger-live/commit/96bf48f0a53f3b2de047bb99b5c9a32a9328735c), [`8601228`](https://github.com/LedgerHQ/ledger-live/commit/8601228d7c38c2da79357c5d21458fffc210fe7d), [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d)]:
  - @ledgerhq/live-common@34.72.0-next.0
