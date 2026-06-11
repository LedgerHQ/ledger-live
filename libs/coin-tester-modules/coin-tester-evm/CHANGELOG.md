# @ledgerhq/coin-tester-evm

## 1.27.0

### Minor Changes

- [#18120](https://github.com/LedgerHQ/ledger-live/pull/18120) [`8d30c81`](https://github.com/LedgerHQ/ledger-live/commit/8d30c812c1f629dbea7b19a6245d5087d3252640) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `.js` extension from relative dynamic `import()` specifiers in live-common (coin module loaders and the generic coin framework bridge/api). Switch the remaining NodeNext consumers that read live-common source to `moduleResolution: "bundler"` so extensionless imports resolve in the IDE, while keeping their CommonJS build output unchanged.

- [#18169](https://github.com/LedgerHQ/ledger-live/pull/18169) [`7dae0fa`](https://github.com/LedgerHQ/ledger-live/commit/7dae0fad3d05437ecb680925ff891c95352f8607) Thanks [@ysitbon](https://github.com/ysitbon)! - Privatize `@ledgerhq/live-common` so it is no longer published to npm and can depend on private workspace packages. Its published runtime dependents (`@ledgerhq/asset-detail`, `@ledgerhq/coin-modules-monitoring`, `@ledgerhq/coin-tester-evm`, `-solana`, `-tezos`) are privatized in lockstep; internal consumers keep resolving it through the workspace.

### Patch Changes

- Updated dependencies [[`5d89724`](https://github.com/LedgerHQ/ledger-live/commit/5d89724ffaa8c4c7f2a616bf4929d2b4be91b26b), [`4170470`](https://github.com/LedgerHQ/ledger-live/commit/4170470d04610ce98eee8ac53944cb0012000da9), [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`5d89724`](https://github.com/LedgerHQ/ledger-live/commit/5d89724ffaa8c4c7f2a616bf4929d2b4be91b26b), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`422c258`](https://github.com/LedgerHQ/ledger-live/commit/422c2589e8a45bdfab5f5e850e31fe79cdd71f05), [`cb3d141`](https://github.com/LedgerHQ/ledger-live/commit/cb3d1412c23e3ba84662c3a25c2010f658b5d752), [`44d473d`](https://github.com/LedgerHQ/ledger-live/commit/44d473d588dd96b1b71e910d775d59770c747637), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`8d78462`](https://github.com/LedgerHQ/ledger-live/commit/8d784626afecbc4f336b7bcfb3d95302491a6147), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`8d30c81`](https://github.com/LedgerHQ/ledger-live/commit/8d30c812c1f629dbea7b19a6245d5087d3252640), [`fd81ba0`](https://github.com/LedgerHQ/ledger-live/commit/fd81ba03b5bc5a676852027003a43d3751275679), [`14c87ea`](https://github.com/LedgerHQ/ledger-live/commit/14c87eae01f09889156d3b1c3cda971d327830b5), [`7eb1ec7`](https://github.com/LedgerHQ/ledger-live/commit/7eb1ec7d91ded7f5dacbf11c2c3a8b795bbebbbf), [`c49b7a5`](https://github.com/LedgerHQ/ledger-live/commit/c49b7a5bb809f8d055d7c503de5857796af6e6ad), [`92c4e61`](https://github.com/LedgerHQ/ledger-live/commit/92c4e612567def2c801277537c940c87a1335361), [`ef35323`](https://github.com/LedgerHQ/ledger-live/commit/ef35323328e7fac3a0ab0c8a1cd0716bb5a3f8a9), [`7d0a074`](https://github.com/LedgerHQ/ledger-live/commit/7d0a074683c68c427de9822c1fbe3d4b19e5a277), [`d30362b`](https://github.com/LedgerHQ/ledger-live/commit/d30362bafd6d32f64cd991401e64d433614fc31a), [`717f9b7`](https://github.com/LedgerHQ/ledger-live/commit/717f9b7603e8e1329e94a65bfd1c209def99c391), [`4e8ba32`](https://github.com/LedgerHQ/ledger-live/commit/4e8ba3283c1e15b113799fc7f2648e38c0f113e9), [`608c418`](https://github.com/LedgerHQ/ledger-live/commit/608c41868f012cb738001217ce7290824b4640d6), [`4ac4774`](https://github.com/LedgerHQ/ledger-live/commit/4ac4774a41655310e652f1a990e83f9821dee1e4), [`3e91099`](https://github.com/LedgerHQ/ledger-live/commit/3e91099517e494f27dde4ff872ae4c2a58070728), [`f1334e7`](https://github.com/LedgerHQ/ledger-live/commit/f1334e76d8bc893b136c17c38780016c5367cd22), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`c984d17`](https://github.com/LedgerHQ/ledger-live/commit/c984d17e715a371285d16a9926e3212ea9d6ddac), [`8528176`](https://github.com/LedgerHQ/ledger-live/commit/8528176df806fe5df4584e257f6b112ffa776f64), [`3fce7f6`](https://github.com/LedgerHQ/ledger-live/commit/3fce7f6821f1f3ca07264d68c293a6971efe48c4), [`3624b3d`](https://github.com/LedgerHQ/ledger-live/commit/3624b3da9dcde1909a990f89515742283f4a88f8), [`16694d5`](https://github.com/LedgerHQ/ledger-live/commit/16694d5120b9e04ba98e0725a4a907f3996b4d41), [`95c31f8`](https://github.com/LedgerHQ/ledger-live/commit/95c31f8120446925a6591150fb5b0b4af1f60913), [`2670997`](https://github.com/LedgerHQ/ledger-live/commit/2670997b889d9ba56fdceb3cd4208b4bf6fcc424), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`7dae0fa`](https://github.com/LedgerHQ/ledger-live/commit/7dae0fad3d05437ecb680925ff891c95352f8607), [`fb56998`](https://github.com/LedgerHQ/ledger-live/commit/fb56998e190b3fb2a034d51da29254f15e043760), [`5210095`](https://github.com/LedgerHQ/ledger-live/commit/52100952ee805aa42f7fc6d8002f496b00211853), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`5d663fc`](https://github.com/LedgerHQ/ledger-live/commit/5d663fcaaaa525369ee9b1e16510bd89a064625c), [`8333f85`](https://github.com/LedgerHQ/ledger-live/commit/8333f85228a167e8ef6372223f1f29d5540152a0), [`4d9b8f5`](https://github.com/LedgerHQ/ledger-live/commit/4d9b8f59185f8f054963249403aa5f3bd8a87b5a), [`d32b48b`](https://github.com/LedgerHQ/ledger-live/commit/d32b48bdcfd968e400a3958d4d3e6a52c5a526da), [`6d58638`](https://github.com/LedgerHQ/ledger-live/commit/6d5863870298f73c3fe2237a6744c7e181c194c4), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`e251664`](https://github.com/LedgerHQ/ledger-live/commit/e251664ae771550bccafb19290c8dc969f2e9968), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`42bf395`](https://github.com/LedgerHQ/ledger-live/commit/42bf39556293546850d9c839e88d754b26c03ff1), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024), [`2e42f3a`](https://github.com/LedgerHQ/ledger-live/commit/2e42f3a38c3cf1d25250d9c6271c51c1b6b08531), [`0a78795`](https://github.com/LedgerHQ/ledger-live/commit/0a78795d5319cfac4dd722737c58280624c5f604), [`27a6979`](https://github.com/LedgerHQ/ledger-live/commit/27a6979699dbb64e152cc8e4651ed78e3e73274f)]:
  - @ledgerhq/live-common@36.1.0
  - @ledgerhq/types-live@6.111.0
  - @ledgerhq/cryptoassets@13.51.0
  - @ledgerhq/ledger-wallet-framework@2.1.0
  - @ledgerhq/coin-evm@4.2.0
  - @ledgerhq/live-config@3.8.0
  - @ledgerhq/coin-tester@0.20.0

## 1.27.0-next.0

### Minor Changes

- [#18120](https://github.com/LedgerHQ/ledger-live/pull/18120) [`8d30c81`](https://github.com/LedgerHQ/ledger-live/commit/8d30c812c1f629dbea7b19a6245d5087d3252640) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `.js` extension from relative dynamic `import()` specifiers in live-common (coin module loaders and the generic coin framework bridge/api). Switch the remaining NodeNext consumers that read live-common source to `moduleResolution: "bundler"` so extensionless imports resolve in the IDE, while keeping their CommonJS build output unchanged.

- [#18169](https://github.com/LedgerHQ/ledger-live/pull/18169) [`7dae0fa`](https://github.com/LedgerHQ/ledger-live/commit/7dae0fad3d05437ecb680925ff891c95352f8607) Thanks [@ysitbon](https://github.com/ysitbon)! - Privatize `@ledgerhq/live-common` so it is no longer published to npm and can depend on private workspace packages. Its published runtime dependents (`@ledgerhq/asset-detail`, `@ledgerhq/coin-modules-monitoring`, `@ledgerhq/coin-tester-evm`, `-solana`, `-tezos`) are privatized in lockstep; internal consumers keep resolving it through the workspace.

### Patch Changes

- Updated dependencies [[`5d89724`](https://github.com/LedgerHQ/ledger-live/commit/5d89724ffaa8c4c7f2a616bf4929d2b4be91b26b), [`4170470`](https://github.com/LedgerHQ/ledger-live/commit/4170470d04610ce98eee8ac53944cb0012000da9), [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`5d89724`](https://github.com/LedgerHQ/ledger-live/commit/5d89724ffaa8c4c7f2a616bf4929d2b4be91b26b), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`422c258`](https://github.com/LedgerHQ/ledger-live/commit/422c2589e8a45bdfab5f5e850e31fe79cdd71f05), [`cb3d141`](https://github.com/LedgerHQ/ledger-live/commit/cb3d1412c23e3ba84662c3a25c2010f658b5d752), [`44d473d`](https://github.com/LedgerHQ/ledger-live/commit/44d473d588dd96b1b71e910d775d59770c747637), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`8d78462`](https://github.com/LedgerHQ/ledger-live/commit/8d784626afecbc4f336b7bcfb3d95302491a6147), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`8d30c81`](https://github.com/LedgerHQ/ledger-live/commit/8d30c812c1f629dbea7b19a6245d5087d3252640), [`fd81ba0`](https://github.com/LedgerHQ/ledger-live/commit/fd81ba03b5bc5a676852027003a43d3751275679), [`14c87ea`](https://github.com/LedgerHQ/ledger-live/commit/14c87eae01f09889156d3b1c3cda971d327830b5), [`7eb1ec7`](https://github.com/LedgerHQ/ledger-live/commit/7eb1ec7d91ded7f5dacbf11c2c3a8b795bbebbbf), [`c49b7a5`](https://github.com/LedgerHQ/ledger-live/commit/c49b7a5bb809f8d055d7c503de5857796af6e6ad), [`92c4e61`](https://github.com/LedgerHQ/ledger-live/commit/92c4e612567def2c801277537c940c87a1335361), [`ef35323`](https://github.com/LedgerHQ/ledger-live/commit/ef35323328e7fac3a0ab0c8a1cd0716bb5a3f8a9), [`7d0a074`](https://github.com/LedgerHQ/ledger-live/commit/7d0a074683c68c427de9822c1fbe3d4b19e5a277), [`d30362b`](https://github.com/LedgerHQ/ledger-live/commit/d30362bafd6d32f64cd991401e64d433614fc31a), [`717f9b7`](https://github.com/LedgerHQ/ledger-live/commit/717f9b7603e8e1329e94a65bfd1c209def99c391), [`4e8ba32`](https://github.com/LedgerHQ/ledger-live/commit/4e8ba3283c1e15b113799fc7f2648e38c0f113e9), [`608c418`](https://github.com/LedgerHQ/ledger-live/commit/608c41868f012cb738001217ce7290824b4640d6), [`4ac4774`](https://github.com/LedgerHQ/ledger-live/commit/4ac4774a41655310e652f1a990e83f9821dee1e4), [`3e91099`](https://github.com/LedgerHQ/ledger-live/commit/3e91099517e494f27dde4ff872ae4c2a58070728), [`f1334e7`](https://github.com/LedgerHQ/ledger-live/commit/f1334e76d8bc893b136c17c38780016c5367cd22), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`c984d17`](https://github.com/LedgerHQ/ledger-live/commit/c984d17e715a371285d16a9926e3212ea9d6ddac), [`8528176`](https://github.com/LedgerHQ/ledger-live/commit/8528176df806fe5df4584e257f6b112ffa776f64), [`3fce7f6`](https://github.com/LedgerHQ/ledger-live/commit/3fce7f6821f1f3ca07264d68c293a6971efe48c4), [`3624b3d`](https://github.com/LedgerHQ/ledger-live/commit/3624b3da9dcde1909a990f89515742283f4a88f8), [`16694d5`](https://github.com/LedgerHQ/ledger-live/commit/16694d5120b9e04ba98e0725a4a907f3996b4d41), [`95c31f8`](https://github.com/LedgerHQ/ledger-live/commit/95c31f8120446925a6591150fb5b0b4af1f60913), [`2670997`](https://github.com/LedgerHQ/ledger-live/commit/2670997b889d9ba56fdceb3cd4208b4bf6fcc424), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`7dae0fa`](https://github.com/LedgerHQ/ledger-live/commit/7dae0fad3d05437ecb680925ff891c95352f8607), [`fb56998`](https://github.com/LedgerHQ/ledger-live/commit/fb56998e190b3fb2a034d51da29254f15e043760), [`5210095`](https://github.com/LedgerHQ/ledger-live/commit/52100952ee805aa42f7fc6d8002f496b00211853), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`5d663fc`](https://github.com/LedgerHQ/ledger-live/commit/5d663fcaaaa525369ee9b1e16510bd89a064625c), [`8333f85`](https://github.com/LedgerHQ/ledger-live/commit/8333f85228a167e8ef6372223f1f29d5540152a0), [`4d9b8f5`](https://github.com/LedgerHQ/ledger-live/commit/4d9b8f59185f8f054963249403aa5f3bd8a87b5a), [`d32b48b`](https://github.com/LedgerHQ/ledger-live/commit/d32b48bdcfd968e400a3958d4d3e6a52c5a526da), [`6d58638`](https://github.com/LedgerHQ/ledger-live/commit/6d5863870298f73c3fe2237a6744c7e181c194c4), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`e251664`](https://github.com/LedgerHQ/ledger-live/commit/e251664ae771550bccafb19290c8dc969f2e9968), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`42bf395`](https://github.com/LedgerHQ/ledger-live/commit/42bf39556293546850d9c839e88d754b26c03ff1), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024), [`2e42f3a`](https://github.com/LedgerHQ/ledger-live/commit/2e42f3a38c3cf1d25250d9c6271c51c1b6b08531), [`0a78795`](https://github.com/LedgerHQ/ledger-live/commit/0a78795d5319cfac4dd722737c58280624c5f604), [`27a6979`](https://github.com/LedgerHQ/ledger-live/commit/27a6979699dbb64e152cc8e4651ed78e3e73274f)]:
  - @ledgerhq/live-common@36.1.0-next.0
  - @ledgerhq/types-live@6.111.0-next.0
  - @ledgerhq/cryptoassets@13.51.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.1.0-next.0
  - @ledgerhq/coin-evm@4.2.0-next.0
  - @ledgerhq/live-config@3.8.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.26.0

### Minor Changes

- [#17648](https://github.com/LedgerHQ/ledger-live/pull/17648) [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Arc and Arc Testnet (Circle's USDC-native EVM L1, chainIds 5042 and 5042002)

### Patch Changes

- Updated dependencies [[`0725ee1`](https://github.com/LedgerHQ/ledger-live/commit/0725ee1dc568cf9624d7aea0ea5e06a31e8aa071), [`ddbb329`](https://github.com/LedgerHQ/ledger-live/commit/ddbb329dcacf46902dacd06091c655e1faf0a022), [`9a53131`](https://github.com/LedgerHQ/ledger-live/commit/9a53131488a40476f7a8c43a87e322b2610245f2), [`3c9d788`](https://github.com/LedgerHQ/ledger-live/commit/3c9d78801a2d45ee19a70263ecf5be0937f2f158), [`c17272e`](https://github.com/LedgerHQ/ledger-live/commit/c17272e63b4036057022cfb28d7433a4a56201c9), [`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`6f00871`](https://github.com/LedgerHQ/ledger-live/commit/6f00871f7bbef39a98fb32b7695576f83458d588), [`08c5655`](https://github.com/LedgerHQ/ledger-live/commit/08c5655c8bcd894eb69c28c81e00d892cfc7b621), [`212cea6`](https://github.com/LedgerHQ/ledger-live/commit/212cea6aa1eff575ea111d7b7f89831452fd18d2), [`76a8f10`](https://github.com/LedgerHQ/ledger-live/commit/76a8f101847811a642d440ef764d87a11dd02904), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`881cb3b`](https://github.com/LedgerHQ/ledger-live/commit/881cb3b59ac8d1aada4f3e8092ada951b716dfea), [`d330d70`](https://github.com/LedgerHQ/ledger-live/commit/d330d707d0dabe55b00fdbc92b95bbb0f917d708), [`9960460`](https://github.com/LedgerHQ/ledger-live/commit/9960460013f52482dd81d455ae5382acc28fee9b), [`72f3d72`](https://github.com/LedgerHQ/ledger-live/commit/72f3d729080e2aa5bffc7d71c26902c27ff89d17), [`cb41e42`](https://github.com/LedgerHQ/ledger-live/commit/cb41e42371a2de3ee42c80c88a83740ca8ae3bee), [`f67cdb9`](https://github.com/LedgerHQ/ledger-live/commit/f67cdb9ac250719be1b51dc0f60abe2241d3a812), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`a8d6945`](https://github.com/LedgerHQ/ledger-live/commit/a8d6945d4a259c544912396132870857a572bcf1), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`76e74f1`](https://github.com/LedgerHQ/ledger-live/commit/76e74f12f49cbbbcd2f0dfa239d99e4b3b199835), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274), [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f), [`4160842`](https://github.com/LedgerHQ/ledger-live/commit/4160842477cb55ee5df701b590c201e7c700685a)]:
  - @ledgerhq/live-common@36.0.0
  - @ledgerhq/coin-evm@4.1.0
  - @ledgerhq/types-live@6.110.0
  - @ledgerhq/cryptoassets@13.50.0
  - @ledgerhq/ledger-wallet-framework@2.0.0
  - @ledgerhq/coin-tester@0.20.0

## 1.26.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.0.0-next.1

## 1.26.0-next.0

### Minor Changes

- [#17648](https://github.com/LedgerHQ/ledger-live/pull/17648) [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Arc and Arc Testnet (Circle's USDC-native EVM L1, chainIds 5042 and 5042002)

### Patch Changes

- Updated dependencies [[`0725ee1`](https://github.com/LedgerHQ/ledger-live/commit/0725ee1dc568cf9624d7aea0ea5e06a31e8aa071), [`ddbb329`](https://github.com/LedgerHQ/ledger-live/commit/ddbb329dcacf46902dacd06091c655e1faf0a022), [`9a53131`](https://github.com/LedgerHQ/ledger-live/commit/9a53131488a40476f7a8c43a87e322b2610245f2), [`3c9d788`](https://github.com/LedgerHQ/ledger-live/commit/3c9d78801a2d45ee19a70263ecf5be0937f2f158), [`c17272e`](https://github.com/LedgerHQ/ledger-live/commit/c17272e63b4036057022cfb28d7433a4a56201c9), [`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`6f00871`](https://github.com/LedgerHQ/ledger-live/commit/6f00871f7bbef39a98fb32b7695576f83458d588), [`08c5655`](https://github.com/LedgerHQ/ledger-live/commit/08c5655c8bcd894eb69c28c81e00d892cfc7b621), [`212cea6`](https://github.com/LedgerHQ/ledger-live/commit/212cea6aa1eff575ea111d7b7f89831452fd18d2), [`76a8f10`](https://github.com/LedgerHQ/ledger-live/commit/76a8f101847811a642d440ef764d87a11dd02904), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`881cb3b`](https://github.com/LedgerHQ/ledger-live/commit/881cb3b59ac8d1aada4f3e8092ada951b716dfea), [`d330d70`](https://github.com/LedgerHQ/ledger-live/commit/d330d707d0dabe55b00fdbc92b95bbb0f917d708), [`9960460`](https://github.com/LedgerHQ/ledger-live/commit/9960460013f52482dd81d455ae5382acc28fee9b), [`72f3d72`](https://github.com/LedgerHQ/ledger-live/commit/72f3d729080e2aa5bffc7d71c26902c27ff89d17), [`cb41e42`](https://github.com/LedgerHQ/ledger-live/commit/cb41e42371a2de3ee42c80c88a83740ca8ae3bee), [`f67cdb9`](https://github.com/LedgerHQ/ledger-live/commit/f67cdb9ac250719be1b51dc0f60abe2241d3a812), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`a8d6945`](https://github.com/LedgerHQ/ledger-live/commit/a8d6945d4a259c544912396132870857a572bcf1), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`76e74f1`](https://github.com/LedgerHQ/ledger-live/commit/76e74f12f49cbbbcd2f0dfa239d99e4b3b199835), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274), [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f), [`4160842`](https://github.com/LedgerHQ/ledger-live/commit/4160842477cb55ee5df701b590c201e7c700685a)]:
  - @ledgerhq/live-common@36.0.0-next.0
  - @ledgerhq/coin-evm@4.1.0-next.0
  - @ledgerhq/types-live@6.110.0-next.0
  - @ledgerhq/cryptoassets@13.50.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.0.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.25.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@35.0.1

## 1.25.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@35.0.1-hotfix.0

## 1.25.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`96fca36`](https://github.com/LedgerHQ/ledger-live/commit/96fca3613561a3e59a2e47d20ab9758905754aac), [`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`5c6c279`](https://github.com/LedgerHQ/ledger-live/commit/5c6c279d5f55db5dea587c972b1c19d7e97d648c), [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`a361e56`](https://github.com/LedgerHQ/ledger-live/commit/a361e56b25a687409b8a8eb5c23b437ab5fbb8bb), [`19b82d1`](https://github.com/LedgerHQ/ledger-live/commit/19b82d1983960c9738b0db7b8dae77fdaecdac9b), [`0d3ce2b`](https://github.com/LedgerHQ/ledger-live/commit/0d3ce2b77a30d3c05b236bf4fd7f7c3a37f814fe), [`dadec17`](https://github.com/LedgerHQ/ledger-live/commit/dadec17e1b504c48d4b507863e040c9dcd2d17ea), [`08bf45f`](https://github.com/LedgerHQ/ledger-live/commit/08bf45f011e561317041fdc24f0b761d4df68870), [`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba), [`be85ca3`](https://github.com/LedgerHQ/ledger-live/commit/be85ca35a3c8d660ee8c35924a67178ff8e922e5), [`0bfc7aa`](https://github.com/LedgerHQ/ledger-live/commit/0bfc7aac28e91f4ab1c8c6e2c281f1354d3d52fb), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`3c81a7b`](https://github.com/LedgerHQ/ledger-live/commit/3c81a7b32a87c5b6157dadaeefa66f00158abc31), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a02b142`](https://github.com/LedgerHQ/ledger-live/commit/a02b142c37c1e009f2096922f51ccd959b72e390), [`bcfe643`](https://github.com/LedgerHQ/ledger-live/commit/bcfe643398e1632ef1175d899ad04e47f9d70801), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`7214fb3`](https://github.com/LedgerHQ/ledger-live/commit/7214fb3aafaa6367d85e79450190eb511f71fd74), [`2188360`](https://github.com/LedgerHQ/ledger-live/commit/2188360b016a70080b82d0dfeb76f3c417c7270e), [`49adeeb`](https://github.com/LedgerHQ/ledger-live/commit/49adeeb5f410a581adadd106d24ad09de840e91e), [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490), [`381be2c`](https://github.com/LedgerHQ/ledger-live/commit/381be2c4f63aa30fd29ffd211f05a6f44701819b), [`40f9d3b`](https://github.com/LedgerHQ/ledger-live/commit/40f9d3b64cd697865b761412147e6c181fdd4a63), [`4e281e4`](https://github.com/LedgerHQ/ledger-live/commit/4e281e487e9bfffd9599082928d8209e28f8aabe), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`c4d44f6`](https://github.com/LedgerHQ/ledger-live/commit/c4d44f6c682bf9375d43de778e50d7adfa47eeab), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`990438b`](https://github.com/LedgerHQ/ledger-live/commit/990438bee754d772fa7ca9cca1d083aaf3ac8ec9), [`c9ec82a`](https://github.com/LedgerHQ/ledger-live/commit/c9ec82a2f1078a52c25028f71402aa4dcc03f735), [`5c5a8f3`](https://github.com/LedgerHQ/ledger-live/commit/5c5a8f3ebbe5f0cf8ea2b39ab7a7628329c4013e), [`59c2b56`](https://github.com/LedgerHQ/ledger-live/commit/59c2b56e3096c352aad58923e070513a373ffae3), [`7bd49c1`](https://github.com/LedgerHQ/ledger-live/commit/7bd49c158a84723a3dd7c44a2c8be2ae0449f20c), [`73e9f74`](https://github.com/LedgerHQ/ledger-live/commit/73e9f746de01be5dc4e4161eb19e5f0ae99615cd), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d), [`21290f4`](https://github.com/LedgerHQ/ledger-live/commit/21290f4a9cdd90e182674bd67dde5369638dc72f), [`39fd9af`](https://github.com/LedgerHQ/ledger-live/commit/39fd9af15ddeeb729c43763d1ed7c77bdad257a4)]:
  - @ledgerhq/live-common@35.0.0
  - @ledgerhq/cryptoassets@13.49.0
  - @ledgerhq/types-cryptoassets@7.37.0
  - @ledgerhq/coin-evm@4.0.0
  - @ledgerhq/types-live@6.109.0
  - @ledgerhq/ledger-wallet-framework@1.6.0
  - @ledgerhq/coin-tester@0.20.0

## 1.25.0-next.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`96fca36`](https://github.com/LedgerHQ/ledger-live/commit/96fca3613561a3e59a2e47d20ab9758905754aac), [`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`5c6c279`](https://github.com/LedgerHQ/ledger-live/commit/5c6c279d5f55db5dea587c972b1c19d7e97d648c), [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`a361e56`](https://github.com/LedgerHQ/ledger-live/commit/a361e56b25a687409b8a8eb5c23b437ab5fbb8bb), [`19b82d1`](https://github.com/LedgerHQ/ledger-live/commit/19b82d1983960c9738b0db7b8dae77fdaecdac9b), [`0d3ce2b`](https://github.com/LedgerHQ/ledger-live/commit/0d3ce2b77a30d3c05b236bf4fd7f7c3a37f814fe), [`dadec17`](https://github.com/LedgerHQ/ledger-live/commit/dadec17e1b504c48d4b507863e040c9dcd2d17ea), [`08bf45f`](https://github.com/LedgerHQ/ledger-live/commit/08bf45f011e561317041fdc24f0b761d4df68870), [`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba), [`be85ca3`](https://github.com/LedgerHQ/ledger-live/commit/be85ca35a3c8d660ee8c35924a67178ff8e922e5), [`0bfc7aa`](https://github.com/LedgerHQ/ledger-live/commit/0bfc7aac28e91f4ab1c8c6e2c281f1354d3d52fb), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`3c81a7b`](https://github.com/LedgerHQ/ledger-live/commit/3c81a7b32a87c5b6157dadaeefa66f00158abc31), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a02b142`](https://github.com/LedgerHQ/ledger-live/commit/a02b142c37c1e009f2096922f51ccd959b72e390), [`bcfe643`](https://github.com/LedgerHQ/ledger-live/commit/bcfe643398e1632ef1175d899ad04e47f9d70801), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`7214fb3`](https://github.com/LedgerHQ/ledger-live/commit/7214fb3aafaa6367d85e79450190eb511f71fd74), [`2188360`](https://github.com/LedgerHQ/ledger-live/commit/2188360b016a70080b82d0dfeb76f3c417c7270e), [`49adeeb`](https://github.com/LedgerHQ/ledger-live/commit/49adeeb5f410a581adadd106d24ad09de840e91e), [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490), [`381be2c`](https://github.com/LedgerHQ/ledger-live/commit/381be2c4f63aa30fd29ffd211f05a6f44701819b), [`40f9d3b`](https://github.com/LedgerHQ/ledger-live/commit/40f9d3b64cd697865b761412147e6c181fdd4a63), [`4e281e4`](https://github.com/LedgerHQ/ledger-live/commit/4e281e487e9bfffd9599082928d8209e28f8aabe), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`c4d44f6`](https://github.com/LedgerHQ/ledger-live/commit/c4d44f6c682bf9375d43de778e50d7adfa47eeab), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`990438b`](https://github.com/LedgerHQ/ledger-live/commit/990438bee754d772fa7ca9cca1d083aaf3ac8ec9), [`c9ec82a`](https://github.com/LedgerHQ/ledger-live/commit/c9ec82a2f1078a52c25028f71402aa4dcc03f735), [`5c5a8f3`](https://github.com/LedgerHQ/ledger-live/commit/5c5a8f3ebbe5f0cf8ea2b39ab7a7628329c4013e), [`59c2b56`](https://github.com/LedgerHQ/ledger-live/commit/59c2b56e3096c352aad58923e070513a373ffae3), [`7bd49c1`](https://github.com/LedgerHQ/ledger-live/commit/7bd49c158a84723a3dd7c44a2c8be2ae0449f20c), [`73e9f74`](https://github.com/LedgerHQ/ledger-live/commit/73e9f746de01be5dc4e4161eb19e5f0ae99615cd), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d), [`21290f4`](https://github.com/LedgerHQ/ledger-live/commit/21290f4a9cdd90e182674bd67dde5369638dc72f), [`39fd9af`](https://github.com/LedgerHQ/ledger-live/commit/39fd9af15ddeeb729c43763d1ed7c77bdad257a4)]:
  - @ledgerhq/live-common@35.0.0-next.0
  - @ledgerhq/cryptoassets@13.49.0-next.0
  - @ledgerhq/types-cryptoassets@7.37.0-next.0
  - @ledgerhq/coin-evm@4.0.0-next.0
  - @ledgerhq/types-live@6.109.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.6.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.24.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

### Patch Changes

- Updated dependencies [[`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`d806e9f`](https://github.com/LedgerHQ/ledger-live/commit/d806e9f0aa42e4179de38dd1b8debf10aed3b17d), [`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b8c353`](https://github.com/LedgerHQ/ledger-live/commit/3b8c353ffe1afbdccab0a1dff1aea6f3eeca2ff0), [`559f321`](https://github.com/LedgerHQ/ledger-live/commit/559f321e3704b0ba0c4460cf868fbb7a984cd192), [`239c8b3`](https://github.com/LedgerHQ/ledger-live/commit/239c8b3acbc60bdb485e2fa881d6e8df13feee59), [`9640708`](https://github.com/LedgerHQ/ledger-live/commit/96407084630c8983841a0b8261f071e75461294a), [`4fc786d`](https://github.com/LedgerHQ/ledger-live/commit/4fc786d9a00f9e6601a8ac3082ced230bde8fb58), [`43d5b48`](https://github.com/LedgerHQ/ledger-live/commit/43d5b489381ad45340facd7c3777b702798ed73d), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff), [`ad3b107`](https://github.com/LedgerHQ/ledger-live/commit/ad3b107938cd39a3b2e15e2fcf1e6526fd7b08fc), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`0844c03`](https://github.com/LedgerHQ/ledger-live/commit/0844c03998a9653013964be71c1297ce2634f23c), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`df45280`](https://github.com/LedgerHQ/ledger-live/commit/df45280fc0a148d4138308b9ee1d7076c576f749), [`6d37772`](https://github.com/LedgerHQ/ledger-live/commit/6d37772d94f94e9174c81f75584c9bf70b149e6d), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`6672e79`](https://github.com/LedgerHQ/ledger-live/commit/6672e796929da8fb264e7dbe71b94fc3a74151d8), [`78426e6`](https://github.com/LedgerHQ/ledger-live/commit/78426e6da544dc7e5d85040ac2be5eab956cb20b), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6ebf340`](https://github.com/LedgerHQ/ledger-live/commit/6ebf34025630a0caf892b5df88a290b1a76ca1b7), [`c54beb4`](https://github.com/LedgerHQ/ledger-live/commit/c54beb480e3aa1f0155013ce15d8b0039d653b6b), [`d20d764`](https://github.com/LedgerHQ/ledger-live/commit/d20d764d3485572353b17690581ee59f8d029afe), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`474c32c`](https://github.com/LedgerHQ/ledger-live/commit/474c32c5763fd25727eb5a83f723e84978288b69), [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`232f22b`](https://github.com/LedgerHQ/ledger-live/commit/232f22bea2703eababffb4862220c1a009d03985), [`3e1b1bd`](https://github.com/LedgerHQ/ledger-live/commit/3e1b1bd5e3343afca8486b8aca96a58b736e3358), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b), [`96bf48f`](https://github.com/LedgerHQ/ledger-live/commit/96bf48f0a53f3b2de047bb99b5c9a32a9328735c), [`8601228`](https://github.com/LedgerHQ/ledger-live/commit/8601228d7c38c2da79357c5d21458fffc210fe7d), [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d)]:
  - @ledgerhq/live-common@34.72.0
  - @ledgerhq/types-live@6.108.0
  - @ledgerhq/coin-evm@3.7.0
  - @ledgerhq/ledger-wallet-framework@1.5.0
  - @ledgerhq/cryptoassets@13.48.0
  - @ledgerhq/coin-tester@0.20.0

## 1.24.0-next.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.72.0-next.3

## 1.24.0-next.2

### Patch Changes

- Updated dependencies [[`9640708`](https://github.com/LedgerHQ/ledger-live/commit/96407084630c8983841a0b8261f071e75461294a)]:
  - @ledgerhq/live-common@34.72.0-next.2

## 1.24.0-next.1

### Patch Changes

- Updated dependencies [[`474c32c`](https://github.com/LedgerHQ/ledger-live/commit/474c32c5763fd25727eb5a83f723e84978288b69)]:
  - @ledgerhq/live-common@34.72.0-next.1

## 1.24.0-next.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

### Patch Changes

- Updated dependencies [[`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921), [`d806e9f`](https://github.com/LedgerHQ/ledger-live/commit/d806e9f0aa42e4179de38dd1b8debf10aed3b17d), [`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b8c353`](https://github.com/LedgerHQ/ledger-live/commit/3b8c353ffe1afbdccab0a1dff1aea6f3eeca2ff0), [`559f321`](https://github.com/LedgerHQ/ledger-live/commit/559f321e3704b0ba0c4460cf868fbb7a984cd192), [`239c8b3`](https://github.com/LedgerHQ/ledger-live/commit/239c8b3acbc60bdb485e2fa881d6e8df13feee59), [`4fc786d`](https://github.com/LedgerHQ/ledger-live/commit/4fc786d9a00f9e6601a8ac3082ced230bde8fb58), [`43d5b48`](https://github.com/LedgerHQ/ledger-live/commit/43d5b489381ad45340facd7c3777b702798ed73d), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff), [`ad3b107`](https://github.com/LedgerHQ/ledger-live/commit/ad3b107938cd39a3b2e15e2fcf1e6526fd7b08fc), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`0844c03`](https://github.com/LedgerHQ/ledger-live/commit/0844c03998a9653013964be71c1297ce2634f23c), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`df45280`](https://github.com/LedgerHQ/ledger-live/commit/df45280fc0a148d4138308b9ee1d7076c576f749), [`6d37772`](https://github.com/LedgerHQ/ledger-live/commit/6d37772d94f94e9174c81f75584c9bf70b149e6d), [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34), [`6672e79`](https://github.com/LedgerHQ/ledger-live/commit/6672e796929da8fb264e7dbe71b94fc3a74151d8), [`78426e6`](https://github.com/LedgerHQ/ledger-live/commit/78426e6da544dc7e5d85040ac2be5eab956cb20b), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6ebf340`](https://github.com/LedgerHQ/ledger-live/commit/6ebf34025630a0caf892b5df88a290b1a76ca1b7), [`c54beb4`](https://github.com/LedgerHQ/ledger-live/commit/c54beb480e3aa1f0155013ce15d8b0039d653b6b), [`d20d764`](https://github.com/LedgerHQ/ledger-live/commit/d20d764d3485572353b17690581ee59f8d029afe), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`232f22b`](https://github.com/LedgerHQ/ledger-live/commit/232f22bea2703eababffb4862220c1a009d03985), [`3e1b1bd`](https://github.com/LedgerHQ/ledger-live/commit/3e1b1bd5e3343afca8486b8aca96a58b736e3358), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b), [`96bf48f`](https://github.com/LedgerHQ/ledger-live/commit/96bf48f0a53f3b2de047bb99b5c9a32a9328735c), [`8601228`](https://github.com/LedgerHQ/ledger-live/commit/8601228d7c38c2da79357c5d21458fffc210fe7d), [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d)]:
  - @ledgerhq/live-common@34.72.0-next.0
  - @ledgerhq/types-live@6.108.0-next.0
  - @ledgerhq/coin-evm@3.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.5.0-next.0
  - @ledgerhq/cryptoassets@13.48.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.23.1

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/coin-evm@3.6.0
  - @ledgerhq/ledger-wallet-framework@1.4.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/coin-tester@0.20.0

## 1.23.1-next.1

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.1
  - @ledgerhq/live-common@34.71.0-next.1
  - @ledgerhq/coin-evm@3.6.0-next.1

## 1.23.1-next.0

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0-next.0
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/coin-evm@3.6.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/coin-tester@0.20.0

## 1.23.1

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/live-common@34.70.1
  - @ledgerhq/coin-evm@3.5.1
  - @ledgerhq/ledger-wallet-framework@1.3.2
  - @ledgerhq/cryptoassets@13.46.2

## 1.23.1-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/live-common@34.70.1-hotfix.0
  - @ledgerhq/coin-evm@3.5.1-hotfix.0
  - @ledgerhq/ledger-wallet-framework@1.3.2-hotfix.0
  - @ledgerhq/cryptoassets@13.46.2-hotfix.0

## 1.23.0

### Minor Changes

- [#16470](https://github.com/LedgerHQ/ledger-live/pull/16470) [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove direct runtime imports of `@ledgerhq/coin-*` packages from shared live-common code (`account/helpers`, `operation`, `bridge/generic-alpaca/validateAddress`); all coin-specific behaviour is now deferred via the `coinModuleLoaders` registry. wallet-cli no longer needs the tronweb proto polyfill as a side effect.

- [#16450](https://github.com/LedgerHQ/ledger-live/pull/16450) [`de3566a`](https://github.com/LedgerHQ/ledger-live/commit/de3566a676681c852a7a03b6027baffdad3c1050) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-testers): add and wait for healthchecks

- [#16536](https://github.com/LedgerHQ/ledger-live/pull/16536) [`2491ce5`](https://github.com/LedgerHQ/ledger-live/commit/2491ce58ccf2f7e07132749b6ae5f6859aaa847a) Thanks [@qperrot](https://github.com/qperrot)! - Fix: coin tester for Base now uses a new RPC endpoint so Anvil can use the `--fork-block-number` flag and avoid rate limits.

### Patch Changes

- Updated dependencies [[`292828a`](https://github.com/LedgerHQ/ledger-live/commit/292828a9797e39f6524f84a0f1064381013e2c77), [`c764fc7`](https://github.com/LedgerHQ/ledger-live/commit/c764fc74b2a0d28a6cd1ec1892968b5eb9845b14), [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac), [`12eb67a`](https://github.com/LedgerHQ/ledger-live/commit/12eb67ae64f08b589c2009c977895a557d1c156f), [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4), [`317c479`](https://github.com/LedgerHQ/ledger-live/commit/317c479353be58645e9581175081619d76a9b5c3), [`2374fcf`](https://github.com/LedgerHQ/ledger-live/commit/2374fcf74a240431baab4f2c73bbb1c913a0f7d5), [`b661cd9`](https://github.com/LedgerHQ/ledger-live/commit/b661cd965e9634840e2ebafb2fbbd1b1328ce98f), [`c51170a`](https://github.com/LedgerHQ/ledger-live/commit/c51170a8d615d5eb3b10b0572d4960e0d36ebc6b), [`8ade8bd`](https://github.com/LedgerHQ/ledger-live/commit/8ade8bdfb0826dc1dbea50a3aa4682cab52ee7b6), [`3e00c6c`](https://github.com/LedgerHQ/ledger-live/commit/3e00c6c2c70497cdb41ae939e97c57bb0911e46c), [`178bda8`](https://github.com/LedgerHQ/ledger-live/commit/178bda8455ef6aca48eaa00ccc0c37adf582d86f), [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429), [`025b4ae`](https://github.com/LedgerHQ/ledger-live/commit/025b4aececb5752ec6a0b4e29562716597308a54), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`e23ca29`](https://github.com/LedgerHQ/ledger-live/commit/e23ca29bb4fd553ff7612d1ea4d9f0e70f7fe0c7), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c619afb`](https://github.com/LedgerHQ/ledger-live/commit/c619afb939fb32c6c669fc700493fce8f2bde49d), [`9099298`](https://github.com/LedgerHQ/ledger-live/commit/9099298c0fed96aea636b4c31f5d36d7d1f57f85), [`1e47a25`](https://github.com/LedgerHQ/ledger-live/commit/1e47a25b02490fef7896d31c41c8609765939f97), [`5c4efa6`](https://github.com/LedgerHQ/ledger-live/commit/5c4efa6c748a7fab0e14bd8b8c975e71ed77756a), [`4afb1f9`](https://github.com/LedgerHQ/ledger-live/commit/4afb1f982d535c6fc8166281ff4fa1ed03569265), [`8dbf2f3`](https://github.com/LedgerHQ/ledger-live/commit/8dbf2f3808af7a5f1ffe279fc99d0b64350779ef)]:
  - @ledgerhq/live-common@34.70.0
  - @ledgerhq/coin-evm@3.5.0
  - @ledgerhq/types-live@6.106.0
  - @ledgerhq/coin-tester@0.20.0
  - @ledgerhq/ledger-wallet-framework@1.3.1
  - @ledgerhq/cryptoassets@13.46.1

## 1.23.0-next.1

### Patch Changes

- Updated dependencies [[`3e00c6c`](https://github.com/LedgerHQ/ledger-live/commit/3e00c6c2c70497cdb41ae939e97c57bb0911e46c)]:
  - @ledgerhq/live-common@34.70.0-next.1

## 1.23.0-next.0

### Minor Changes

- [#16470](https://github.com/LedgerHQ/ledger-live/pull/16470) [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove direct runtime imports of `@ledgerhq/coin-*` packages from shared live-common code (`account/helpers`, `operation`, `bridge/generic-alpaca/validateAddress`); all coin-specific behaviour is now deferred via the `coinModuleLoaders` registry. wallet-cli no longer needs the tronweb proto polyfill as a side effect.

- [#16450](https://github.com/LedgerHQ/ledger-live/pull/16450) [`de3566a`](https://github.com/LedgerHQ/ledger-live/commit/de3566a676681c852a7a03b6027baffdad3c1050) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-testers): add and wait for healthchecks

- [#16536](https://github.com/LedgerHQ/ledger-live/pull/16536) [`2491ce5`](https://github.com/LedgerHQ/ledger-live/commit/2491ce58ccf2f7e07132749b6ae5f6859aaa847a) Thanks [@qperrot](https://github.com/qperrot)! - Fix: coin tester for Base now uses a new RPC endpoint so Anvil can use the `--fork-block-number` flag and avoid rate limits.

### Patch Changes

- Updated dependencies [[`292828a`](https://github.com/LedgerHQ/ledger-live/commit/292828a9797e39f6524f84a0f1064381013e2c77), [`c764fc7`](https://github.com/LedgerHQ/ledger-live/commit/c764fc74b2a0d28a6cd1ec1892968b5eb9845b14), [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac), [`12eb67a`](https://github.com/LedgerHQ/ledger-live/commit/12eb67ae64f08b589c2009c977895a557d1c156f), [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4), [`317c479`](https://github.com/LedgerHQ/ledger-live/commit/317c479353be58645e9581175081619d76a9b5c3), [`2374fcf`](https://github.com/LedgerHQ/ledger-live/commit/2374fcf74a240431baab4f2c73bbb1c913a0f7d5), [`b661cd9`](https://github.com/LedgerHQ/ledger-live/commit/b661cd965e9634840e2ebafb2fbbd1b1328ce98f), [`c51170a`](https://github.com/LedgerHQ/ledger-live/commit/c51170a8d615d5eb3b10b0572d4960e0d36ebc6b), [`8ade8bd`](https://github.com/LedgerHQ/ledger-live/commit/8ade8bdfb0826dc1dbea50a3aa4682cab52ee7b6), [`178bda8`](https://github.com/LedgerHQ/ledger-live/commit/178bda8455ef6aca48eaa00ccc0c37adf582d86f), [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429), [`025b4ae`](https://github.com/LedgerHQ/ledger-live/commit/025b4aececb5752ec6a0b4e29562716597308a54), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`e23ca29`](https://github.com/LedgerHQ/ledger-live/commit/e23ca29bb4fd553ff7612d1ea4d9f0e70f7fe0c7), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c619afb`](https://github.com/LedgerHQ/ledger-live/commit/c619afb939fb32c6c669fc700493fce8f2bde49d), [`9099298`](https://github.com/LedgerHQ/ledger-live/commit/9099298c0fed96aea636b4c31f5d36d7d1f57f85), [`1e47a25`](https://github.com/LedgerHQ/ledger-live/commit/1e47a25b02490fef7896d31c41c8609765939f97), [`5c4efa6`](https://github.com/LedgerHQ/ledger-live/commit/5c4efa6c748a7fab0e14bd8b8c975e71ed77756a), [`4afb1f9`](https://github.com/LedgerHQ/ledger-live/commit/4afb1f982d535c6fc8166281ff4fa1ed03569265), [`8dbf2f3`](https://github.com/LedgerHQ/ledger-live/commit/8dbf2f3808af7a5f1ffe279fc99d0b64350779ef)]:
  - @ledgerhq/live-common@34.70.0-next.0
  - @ledgerhq/coin-evm@3.5.0-next.0
  - @ledgerhq/types-live@6.106.0-next.0
  - @ledgerhq/coin-tester@0.20.0
  - @ledgerhq/ledger-wallet-framework@1.3.1-next.0
  - @ledgerhq/cryptoassets@13.46.1-next.0

## 1.22.0

### Minor Changes

- [#16028](https://github.com/LedgerHQ/ledger-live/pull/16028) [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660) Thanks [@qperrot](https://github.com/qperrot)! - Fix: change optimism oracle to new proxy upgrade

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#16215](https://github.com/LedgerHQ/ledger-live/pull/16215) [`253bdcf`](https://github.com/LedgerHQ/ledger-live/commit/253bdcf3cc90cfd00a6d75da773cd5e53c96def9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: migrate to oxlint/oxfmt on coin-tester modules

### Patch Changes

- Updated dependencies [[`3d310a6`](https://github.com/LedgerHQ/ledger-live/commit/3d310a6b00dd1742fbd292545b8aa87b736932b4), [`44b4abc`](https://github.com/LedgerHQ/ledger-live/commit/44b4abc85fd456f1f364e7213add739d79321ccc), [`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`0b3f80f`](https://github.com/LedgerHQ/ledger-live/commit/0b3f80f20a2fbf25875ab7ebce3924722099a5ab), [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660), [`242028a`](https://github.com/LedgerHQ/ledger-live/commit/242028aafdaca520aeb4a9b818c9f91f2d35ab43), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`13faa62`](https://github.com/LedgerHQ/ledger-live/commit/13faa62f0c2c7b6102c4ba33bdfed77354403860), [`966b159`](https://github.com/LedgerHQ/ledger-live/commit/966b159634bee81955c8b07b7fa5d98bb3a9cb07), [`206730c`](https://github.com/LedgerHQ/ledger-live/commit/206730c71ded9a6ea54254ad39da796c38f4c7ee), [`0d745c6`](https://github.com/LedgerHQ/ledger-live/commit/0d745c68eab72411201843d8aa20c127fc98d189), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`1cee996`](https://github.com/LedgerHQ/ledger-live/commit/1cee9961e8bcf46793fa11fc86ce9ae32883f860), [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508), [`560708f`](https://github.com/LedgerHQ/ledger-live/commit/560708fafbb61c0f1aac5763bfb2b27ec201e2bf), [`5e17255`](https://github.com/LedgerHQ/ledger-live/commit/5e172557f706459cdda9f684cf56d13bbc968986), [`02831f2`](https://github.com/LedgerHQ/ledger-live/commit/02831f222367ffe67858b7a3c3984c495d0ebb29), [`5082f0d`](https://github.com/LedgerHQ/ledger-live/commit/5082f0d7dd1a9e73b97b2226782c63a579ca4331), [`936164c`](https://github.com/LedgerHQ/ledger-live/commit/936164cfa7d0dd2ef97deb16004a211598eeab37), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`de99bc1`](https://github.com/LedgerHQ/ledger-live/commit/de99bc14f09e699af591dc6acf12f9547d792dfd), [`367c7e0`](https://github.com/LedgerHQ/ledger-live/commit/367c7e03f07b3f2ae96927fc33d12e35ffe81621), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`37fe0e0`](https://github.com/LedgerHQ/ledger-live/commit/37fe0e0011efb6b9cf4e7a9d1ddb01768aa77798), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`253bdcf`](https://github.com/LedgerHQ/ledger-live/commit/253bdcf3cc90cfd00a6d75da773cd5e53c96def9), [`bcc9607`](https://github.com/LedgerHQ/ledger-live/commit/bcc960793ca72aa4f05b46c726db9cba82a4b9a7), [`197fed7`](https://github.com/LedgerHQ/ledger-live/commit/197fed7554701e0bbe96c7c3f819d8dba297ba48), [`e83e793`](https://github.com/LedgerHQ/ledger-live/commit/e83e79399bf1d9b2edf9e6b242f18162dfa5a8a3), [`dc2ca09`](https://github.com/LedgerHQ/ledger-live/commit/dc2ca093de2957966455f15a94c470431783fbb4), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`0c78234`](https://github.com/LedgerHQ/ledger-live/commit/0c78234bfb672411b6950a874f4b50f864ac40b9), [`8a4b151`](https://github.com/LedgerHQ/ledger-live/commit/8a4b1511dcac3bbd6066996aecd4dedbaf1f24c0), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`b599228`](https://github.com/LedgerHQ/ledger-live/commit/b59922882b679b2e2a5069707a233d9cb6293881), [`93f3199`](https://github.com/LedgerHQ/ledger-live/commit/93f3199af5ba10f269e11b3ac37ffa77b8a05e0f), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`11cd80f`](https://github.com/LedgerHQ/ledger-live/commit/11cd80f7c262f3e44fbbb19a8b034e9767c02db6), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`d9c2b45`](https://github.com/LedgerHQ/ledger-live/commit/d9c2b454793568993215c2be6e448cb2f90fdb6d), [`12ac92f`](https://github.com/LedgerHQ/ledger-live/commit/12ac92f7418f2248673257f9900490ade204d086), [`4e95387`](https://github.com/LedgerHQ/ledger-live/commit/4e953874f6c1ea274f54640cb50744c85dfc3e41), [`0e803da`](https://github.com/LedgerHQ/ledger-live/commit/0e803dac441988ba47d3c915c124319c1cfe0b86), [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226), [`2b02dbd`](https://github.com/LedgerHQ/ledger-live/commit/2b02dbd791a761890837c664e002d682ac335d0a), [`6da0c45`](https://github.com/LedgerHQ/ledger-live/commit/6da0c451d3099a7ce610eff343cae84442f4ac30), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/live-common@34.69.0
  - @ledgerhq/cryptoassets@13.46.0
  - @ledgerhq/coin-evm@3.4.0
  - @ledgerhq/types-live@6.105.0
  - @ledgerhq/ledger-wallet-framework@1.3.0
  - @ledgerhq/coin-tester@0.20.0

## 1.22.0-next.3

### Patch Changes

- Updated dependencies [[`0b3f80f`](https://github.com/LedgerHQ/ledger-live/commit/0b3f80f20a2fbf25875ab7ebce3924722099a5ab)]:
  - @ledgerhq/live-common@34.69.0-next.3
  - @ledgerhq/coin-evm@3.4.0-next.1

## 1.22.0-next.2

### Patch Changes

- Updated dependencies [[`de99bc1`](https://github.com/LedgerHQ/ledger-live/commit/de99bc14f09e699af591dc6acf12f9547d792dfd)]:
  - @ledgerhq/live-common@34.69.0-next.2

## 1.22.0-next.1

### Patch Changes

- Updated dependencies [[`4e95387`](https://github.com/LedgerHQ/ledger-live/commit/4e953874f6c1ea274f54640cb50744c85dfc3e41)]:
  - @ledgerhq/live-common@34.69.0-next.1

## 1.22.0-next.0

### Minor Changes

- [#16028](https://github.com/LedgerHQ/ledger-live/pull/16028) [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660) Thanks [@qperrot](https://github.com/qperrot)! - Fix: change optimism oracle to new proxy upgrade

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#16215](https://github.com/LedgerHQ/ledger-live/pull/16215) [`253bdcf`](https://github.com/LedgerHQ/ledger-live/commit/253bdcf3cc90cfd00a6d75da773cd5e53c96def9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: migrate to oxlint/oxfmt on coin-tester modules

### Patch Changes

- Updated dependencies [[`3d310a6`](https://github.com/LedgerHQ/ledger-live/commit/3d310a6b00dd1742fbd292545b8aa87b736932b4), [`44b4abc`](https://github.com/LedgerHQ/ledger-live/commit/44b4abc85fd456f1f364e7213add739d79321ccc), [`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660), [`242028a`](https://github.com/LedgerHQ/ledger-live/commit/242028aafdaca520aeb4a9b818c9f91f2d35ab43), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`13faa62`](https://github.com/LedgerHQ/ledger-live/commit/13faa62f0c2c7b6102c4ba33bdfed77354403860), [`966b159`](https://github.com/LedgerHQ/ledger-live/commit/966b159634bee81955c8b07b7fa5d98bb3a9cb07), [`206730c`](https://github.com/LedgerHQ/ledger-live/commit/206730c71ded9a6ea54254ad39da796c38f4c7ee), [`0d745c6`](https://github.com/LedgerHQ/ledger-live/commit/0d745c68eab72411201843d8aa20c127fc98d189), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`1cee996`](https://github.com/LedgerHQ/ledger-live/commit/1cee9961e8bcf46793fa11fc86ce9ae32883f860), [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508), [`560708f`](https://github.com/LedgerHQ/ledger-live/commit/560708fafbb61c0f1aac5763bfb2b27ec201e2bf), [`5e17255`](https://github.com/LedgerHQ/ledger-live/commit/5e172557f706459cdda9f684cf56d13bbc968986), [`02831f2`](https://github.com/LedgerHQ/ledger-live/commit/02831f222367ffe67858b7a3c3984c495d0ebb29), [`5082f0d`](https://github.com/LedgerHQ/ledger-live/commit/5082f0d7dd1a9e73b97b2226782c63a579ca4331), [`936164c`](https://github.com/LedgerHQ/ledger-live/commit/936164cfa7d0dd2ef97deb16004a211598eeab37), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`367c7e0`](https://github.com/LedgerHQ/ledger-live/commit/367c7e03f07b3f2ae96927fc33d12e35ffe81621), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`37fe0e0`](https://github.com/LedgerHQ/ledger-live/commit/37fe0e0011efb6b9cf4e7a9d1ddb01768aa77798), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`253bdcf`](https://github.com/LedgerHQ/ledger-live/commit/253bdcf3cc90cfd00a6d75da773cd5e53c96def9), [`bcc9607`](https://github.com/LedgerHQ/ledger-live/commit/bcc960793ca72aa4f05b46c726db9cba82a4b9a7), [`197fed7`](https://github.com/LedgerHQ/ledger-live/commit/197fed7554701e0bbe96c7c3f819d8dba297ba48), [`e83e793`](https://github.com/LedgerHQ/ledger-live/commit/e83e79399bf1d9b2edf9e6b242f18162dfa5a8a3), [`dc2ca09`](https://github.com/LedgerHQ/ledger-live/commit/dc2ca093de2957966455f15a94c470431783fbb4), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`0c78234`](https://github.com/LedgerHQ/ledger-live/commit/0c78234bfb672411b6950a874f4b50f864ac40b9), [`8a4b151`](https://github.com/LedgerHQ/ledger-live/commit/8a4b1511dcac3bbd6066996aecd4dedbaf1f24c0), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`b599228`](https://github.com/LedgerHQ/ledger-live/commit/b59922882b679b2e2a5069707a233d9cb6293881), [`93f3199`](https://github.com/LedgerHQ/ledger-live/commit/93f3199af5ba10f269e11b3ac37ffa77b8a05e0f), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`11cd80f`](https://github.com/LedgerHQ/ledger-live/commit/11cd80f7c262f3e44fbbb19a8b034e9767c02db6), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`d9c2b45`](https://github.com/LedgerHQ/ledger-live/commit/d9c2b454793568993215c2be6e448cb2f90fdb6d), [`12ac92f`](https://github.com/LedgerHQ/ledger-live/commit/12ac92f7418f2248673257f9900490ade204d086), [`0e803da`](https://github.com/LedgerHQ/ledger-live/commit/0e803dac441988ba47d3c915c124319c1cfe0b86), [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226), [`2b02dbd`](https://github.com/LedgerHQ/ledger-live/commit/2b02dbd791a761890837c664e002d682ac335d0a), [`6da0c45`](https://github.com/LedgerHQ/ledger-live/commit/6da0c451d3099a7ce610eff343cae84442f4ac30), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/live-common@34.69.0-next.0
  - @ledgerhq/cryptoassets@13.46.0-next.0
  - @ledgerhq/coin-evm@3.4.0-next.0
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.0-next.0
  - @ledgerhq/coin-tester@0.20.0-next.0

## 1.21.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`691e9e9`](https://github.com/LedgerHQ/ledger-live/commit/691e9e9dcbd59788a70c05b461b8402a9eddc0a8), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`888dea6`](https://github.com/LedgerHQ/ledger-live/commit/888dea61ca08db3a136b63ed8ff27dff1f206f29), [`f26326d`](https://github.com/LedgerHQ/ledger-live/commit/f26326d0998bdaa33b6bc92da0757352f8ae635c), [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9), [`f9f2112`](https://github.com/LedgerHQ/ledger-live/commit/f9f21123c44d93c128ac05a4e7aa850f07cd32af), [`864409e`](https://github.com/LedgerHQ/ledger-live/commit/864409ea83ede4be801656abecbb4d8d6330731a), [`8eafe19`](https://github.com/LedgerHQ/ledger-live/commit/8eafe196b5f670df667915931ba1fe5a6dbe1766), [`ea43cc3`](https://github.com/LedgerHQ/ledger-live/commit/ea43cc3bcd85e0592fea91a671cb396f4c784d17), [`4c72375`](https://github.com/LedgerHQ/ledger-live/commit/4c72375f922381b5c69a304c838105e5abc775eb), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`fd53476`](https://github.com/LedgerHQ/ledger-live/commit/fd53476419e3557f5e0b408d9401738bb37920c2), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`b755e91`](https://github.com/LedgerHQ/ledger-live/commit/b755e916e4c1e7ebd9043dfc959eba2c5081ec5b), [`6bc31fc`](https://github.com/LedgerHQ/ledger-live/commit/6bc31fc9bbbf04bcd72d7865067ec04f483544ab), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`b84b090`](https://github.com/LedgerHQ/ledger-live/commit/b84b090b9ad7215fd98978a87b071aa19199759b), [`39d4880`](https://github.com/LedgerHQ/ledger-live/commit/39d48807a35ced14767c0747faff4e2c2b09420d), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`f46f748`](https://github.com/LedgerHQ/ledger-live/commit/f46f74823c644ba21f38cd39c64fb9b722a3eb37), [`6ac1511`](https://github.com/LedgerHQ/ledger-live/commit/6ac151194e28391f84a5991fab24d5581bc955f9), [`33bd668`](https://github.com/LedgerHQ/ledger-live/commit/33bd668453b1b287f6ea797ef605f359f72aa63f), [`82a476e`](https://github.com/LedgerHQ/ledger-live/commit/82a476e2a6d1c1f766964496d9c046902d45ce06), [`d9d9903`](https://github.com/LedgerHQ/ledger-live/commit/d9d9903e8c91709b2ff2f3de25f42c31eebdd7ba), [`72147bb`](https://github.com/LedgerHQ/ledger-live/commit/72147bb1d0dea91bacda444211e80a1c7242765f), [`739dbe7`](https://github.com/LedgerHQ/ledger-live/commit/739dbe71b7309f552918e07f916fbf9aeb41c1bb), [`4ef4261`](https://github.com/LedgerHQ/ledger-live/commit/4ef4261ec1a090c2200e5a6a3081d230cba4b80b), [`776e38c`](https://github.com/LedgerHQ/ledger-live/commit/776e38cb2e5362210ecfb345c8a56ad9ed7b1be5), [`9f5ba50`](https://github.com/LedgerHQ/ledger-live/commit/9f5ba50335cf10f8b0f31031168bf17033af1d9d), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21), [`da41380`](https://github.com/LedgerHQ/ledger-live/commit/da41380880ab3434413a505494c6fd81bf3a74d8), [`c8753b0`](https://github.com/LedgerHQ/ledger-live/commit/c8753b04658150dd121a9480a1c96ae98edeb910)]:
  - @ledgerhq/live-common@34.68.0
  - @ledgerhq/types-live@6.104.0
  - @ledgerhq/coin-evm@3.3.0
  - @ledgerhq/ledger-wallet-framework@1.2.0
  - @ledgerhq/cryptoassets@13.45.0
  - @ledgerhq/types-cryptoassets@7.36.0
  - @ledgerhq/live-config@3.7.0
  - @ledgerhq/coin-tester@0.19.0

## 1.21.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.68.0-next.1

## 1.21.0-next.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`691e9e9`](https://github.com/LedgerHQ/ledger-live/commit/691e9e9dcbd59788a70c05b461b8402a9eddc0a8), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`888dea6`](https://github.com/LedgerHQ/ledger-live/commit/888dea61ca08db3a136b63ed8ff27dff1f206f29), [`f26326d`](https://github.com/LedgerHQ/ledger-live/commit/f26326d0998bdaa33b6bc92da0757352f8ae635c), [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9), [`f9f2112`](https://github.com/LedgerHQ/ledger-live/commit/f9f21123c44d93c128ac05a4e7aa850f07cd32af), [`864409e`](https://github.com/LedgerHQ/ledger-live/commit/864409ea83ede4be801656abecbb4d8d6330731a), [`8eafe19`](https://github.com/LedgerHQ/ledger-live/commit/8eafe196b5f670df667915931ba1fe5a6dbe1766), [`ea43cc3`](https://github.com/LedgerHQ/ledger-live/commit/ea43cc3bcd85e0592fea91a671cb396f4c784d17), [`4c72375`](https://github.com/LedgerHQ/ledger-live/commit/4c72375f922381b5c69a304c838105e5abc775eb), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`fd53476`](https://github.com/LedgerHQ/ledger-live/commit/fd53476419e3557f5e0b408d9401738bb37920c2), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`b755e91`](https://github.com/LedgerHQ/ledger-live/commit/b755e916e4c1e7ebd9043dfc959eba2c5081ec5b), [`6bc31fc`](https://github.com/LedgerHQ/ledger-live/commit/6bc31fc9bbbf04bcd72d7865067ec04f483544ab), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`b84b090`](https://github.com/LedgerHQ/ledger-live/commit/b84b090b9ad7215fd98978a87b071aa19199759b), [`39d4880`](https://github.com/LedgerHQ/ledger-live/commit/39d48807a35ced14767c0747faff4e2c2b09420d), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`f46f748`](https://github.com/LedgerHQ/ledger-live/commit/f46f74823c644ba21f38cd39c64fb9b722a3eb37), [`6ac1511`](https://github.com/LedgerHQ/ledger-live/commit/6ac151194e28391f84a5991fab24d5581bc955f9), [`33bd668`](https://github.com/LedgerHQ/ledger-live/commit/33bd668453b1b287f6ea797ef605f359f72aa63f), [`82a476e`](https://github.com/LedgerHQ/ledger-live/commit/82a476e2a6d1c1f766964496d9c046902d45ce06), [`d9d9903`](https://github.com/LedgerHQ/ledger-live/commit/d9d9903e8c91709b2ff2f3de25f42c31eebdd7ba), [`72147bb`](https://github.com/LedgerHQ/ledger-live/commit/72147bb1d0dea91bacda444211e80a1c7242765f), [`739dbe7`](https://github.com/LedgerHQ/ledger-live/commit/739dbe71b7309f552918e07f916fbf9aeb41c1bb), [`4ef4261`](https://github.com/LedgerHQ/ledger-live/commit/4ef4261ec1a090c2200e5a6a3081d230cba4b80b), [`776e38c`](https://github.com/LedgerHQ/ledger-live/commit/776e38cb2e5362210ecfb345c8a56ad9ed7b1be5), [`9f5ba50`](https://github.com/LedgerHQ/ledger-live/commit/9f5ba50335cf10f8b0f31031168bf17033af1d9d), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21), [`da41380`](https://github.com/LedgerHQ/ledger-live/commit/da41380880ab3434413a505494c6fd81bf3a74d8), [`c8753b0`](https://github.com/LedgerHQ/ledger-live/commit/c8753b04658150dd121a9480a1c96ae98edeb910)]:
  - @ledgerhq/live-common@34.68.0-next.0
  - @ledgerhq/types-live@6.104.0-next.0
  - @ledgerhq/coin-evm@3.3.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.2.0-next.0
  - @ledgerhq/cryptoassets@13.45.0-next.0
  - @ledgerhq/types-cryptoassets@7.36.0-next.0
  - @ledgerhq/live-config@3.7.0-next.0
  - @ledgerhq/coin-tester@0.19.0

## 1.20.0

### Minor Changes

- [#15547](https://github.com/LedgerHQ/ledger-live/pull/15547) [`5563a42`](https://github.com/LedgerHQ/ledger-live/commit/5563a42a175e516cc2747782c98e47b90a3b4bf8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-tester-evm): remove HTTP calls to indexers

### Patch Changes

- Updated dependencies [[`9945904`](https://github.com/LedgerHQ/ledger-live/commit/994590400e55453ae8d4ac1507918164d296f05b), [`72d1b81`](https://github.com/LedgerHQ/ledger-live/commit/72d1b81187121e44624ebc976e8d3309bd9dd8a1), [`f5ffcb9`](https://github.com/LedgerHQ/ledger-live/commit/f5ffcb9d7f253f3ae4e88acd0815aa8893ecd29a), [`69bb48c`](https://github.com/LedgerHQ/ledger-live/commit/69bb48c0dc5b76ddf0d2c96a18ebb35b82927afc), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`4527739`](https://github.com/LedgerHQ/ledger-live/commit/45277399251db055e9e1df98687730af7dabf058), [`57bef7c`](https://github.com/LedgerHQ/ledger-live/commit/57bef7c24c6e1cd53a8717cd3cf54c5faf6d13e4), [`69c3e87`](https://github.com/LedgerHQ/ledger-live/commit/69c3e8710dec424703993273dfcf449054ffb4ed), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`932a26c`](https://github.com/LedgerHQ/ledger-live/commit/932a26cb4de4e0b48af492d28a9fec50ad120418), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`fe728f8`](https://github.com/LedgerHQ/ledger-live/commit/fe728f8e5064f31c47eafb4fd04aedbeabeb1201), [`0431655`](https://github.com/LedgerHQ/ledger-live/commit/043165591a3bd650b43a220b23bd952ff82d56a0), [`6ed2cc3`](https://github.com/LedgerHQ/ledger-live/commit/6ed2cc3e388df915015f6e4083917015ef800804), [`2176f11`](https://github.com/LedgerHQ/ledger-live/commit/2176f11b3a4eaffb8c2f5e1b8a2c074492d02762), [`e3aa3be`](https://github.com/LedgerHQ/ledger-live/commit/e3aa3be0dd7478a47fb52ed2bdab3c8913160b11), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc), [`9af2737`](https://github.com/LedgerHQ/ledger-live/commit/9af27370f39378b088b7ca0cb17382edb0d84077), [`d1b1f81`](https://github.com/LedgerHQ/ledger-live/commit/d1b1f816452e2195af8ad9032689ea500cad87ba), [`c87be08`](https://github.com/LedgerHQ/ledger-live/commit/c87be081099d6c2666995e1b8830bb5c1c4efa62)]:
  - @ledgerhq/live-common@34.67.0
  - @ledgerhq/coin-evm@3.2.0
  - @ledgerhq/types-live@6.103.0
  - @ledgerhq/cryptoassets@13.44.0
  - @ledgerhq/ledger-wallet-framework@1.1.0
  - @ledgerhq/coin-tester@0.19.0

## 1.20.0-next.0

### Minor Changes

- [#15547](https://github.com/LedgerHQ/ledger-live/pull/15547) [`5563a42`](https://github.com/LedgerHQ/ledger-live/commit/5563a42a175e516cc2747782c98e47b90a3b4bf8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-tester-evm): remove HTTP calls to indexers

### Patch Changes

- Updated dependencies [[`9945904`](https://github.com/LedgerHQ/ledger-live/commit/994590400e55453ae8d4ac1507918164d296f05b), [`72d1b81`](https://github.com/LedgerHQ/ledger-live/commit/72d1b81187121e44624ebc976e8d3309bd9dd8a1), [`f5ffcb9`](https://github.com/LedgerHQ/ledger-live/commit/f5ffcb9d7f253f3ae4e88acd0815aa8893ecd29a), [`69bb48c`](https://github.com/LedgerHQ/ledger-live/commit/69bb48c0dc5b76ddf0d2c96a18ebb35b82927afc), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`4527739`](https://github.com/LedgerHQ/ledger-live/commit/45277399251db055e9e1df98687730af7dabf058), [`57bef7c`](https://github.com/LedgerHQ/ledger-live/commit/57bef7c24c6e1cd53a8717cd3cf54c5faf6d13e4), [`69c3e87`](https://github.com/LedgerHQ/ledger-live/commit/69c3e8710dec424703993273dfcf449054ffb4ed), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`932a26c`](https://github.com/LedgerHQ/ledger-live/commit/932a26cb4de4e0b48af492d28a9fec50ad120418), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`fe728f8`](https://github.com/LedgerHQ/ledger-live/commit/fe728f8e5064f31c47eafb4fd04aedbeabeb1201), [`0431655`](https://github.com/LedgerHQ/ledger-live/commit/043165591a3bd650b43a220b23bd952ff82d56a0), [`6ed2cc3`](https://github.com/LedgerHQ/ledger-live/commit/6ed2cc3e388df915015f6e4083917015ef800804), [`2176f11`](https://github.com/LedgerHQ/ledger-live/commit/2176f11b3a4eaffb8c2f5e1b8a2c074492d02762), [`e3aa3be`](https://github.com/LedgerHQ/ledger-live/commit/e3aa3be0dd7478a47fb52ed2bdab3c8913160b11), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc), [`9af2737`](https://github.com/LedgerHQ/ledger-live/commit/9af27370f39378b088b7ca0cb17382edb0d84077), [`d1b1f81`](https://github.com/LedgerHQ/ledger-live/commit/d1b1f816452e2195af8ad9032689ea500cad87ba), [`c87be08`](https://github.com/LedgerHQ/ledger-live/commit/c87be081099d6c2666995e1b8830bb5c1c4efa62)]:
  - @ledgerhq/live-common@34.67.0-next.0
  - @ledgerhq/coin-evm@3.2.0-next.0
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/cryptoassets@13.44.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.1.0-next.0
  - @ledgerhq/coin-tester@0.19.0-next.0

## 1.19.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

### Patch Changes

- Updated dependencies [[`d8d142e`](https://github.com/LedgerHQ/ledger-live/commit/d8d142eb73f1e8b5f4229ed69f55cb17770ee411), [`be83068`](https://github.com/LedgerHQ/ledger-live/commit/be83068b1580be86b1e97c1eb4c6b19db54ff2a4), [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`b78589c`](https://github.com/LedgerHQ/ledger-live/commit/b78589c7458ce37160264cd9f28f8d7abcca3942), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`f7c0705`](https://github.com/LedgerHQ/ledger-live/commit/f7c07058dda135f94f9cc75b50dbfdb92973268f), [`1f0721a`](https://github.com/LedgerHQ/ledger-live/commit/1f0721a1987ec4415b802b395e0bf9f7c61030ea), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`a6414f2`](https://github.com/LedgerHQ/ledger-live/commit/a6414f2aedae2ff657b29c2c4fa3e2c081e6e959), [`1c564a9`](https://github.com/LedgerHQ/ledger-live/commit/1c564a9da3a4c0aea9eda63c084dd2068b36b284), [`817d87a`](https://github.com/LedgerHQ/ledger-live/commit/817d87aadb553acb2c2d4410ab1011df32170e32), [`f1959b4`](https://github.com/LedgerHQ/ledger-live/commit/f1959b4e9a35f126b926972ad888081dab20c3c4), [`dd98891`](https://github.com/LedgerHQ/ledger-live/commit/dd98891e9c2e1bd4795b8adcb64b3c8c45b9eb75), [`1740fb5`](https://github.com/LedgerHQ/ledger-live/commit/1740fb51184ab2f0f773ad127c8015cd47cf7637), [`3488291`](https://github.com/LedgerHQ/ledger-live/commit/348829182b4fdb06f26078e68bce98ee637dfd1b), [`73681cc`](https://github.com/LedgerHQ/ledger-live/commit/73681cc69c80e7d64c7320bb4afcb0b44691d416), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f), [`b76ebac`](https://github.com/LedgerHQ/ledger-live/commit/b76ebac99eb485e5a8dc0607ab8325639ef30a9e), [`d7b8e13`](https://github.com/LedgerHQ/ledger-live/commit/d7b8e13caa615ca3f2c08c3a21b8e0226ea163b2), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41), [`7de6683`](https://github.com/LedgerHQ/ledger-live/commit/7de6683522c09a23a26137569ffd014bf0b255ec), [`166c038`](https://github.com/LedgerHQ/ledger-live/commit/166c038f05beca81af0c89d09a1147d50d7c20c4), [`5eeb5c0`](https://github.com/LedgerHQ/ledger-live/commit/5eeb5c0af77c9930de849fd23d4a724be7b3bee5)]:
  - @ledgerhq/live-common@34.66.0
  - @ledgerhq/coin-evm@3.1.0
  - @ledgerhq/types-live@6.102.0
  - @ledgerhq/cryptoassets@13.43.0
  - @ledgerhq/ledger-wallet-framework@1.0.1
  - @ledgerhq/coin-tester@0.18.0

## 1.19.0-next.1

### Patch Changes

- Updated dependencies [[`166c038`](https://github.com/LedgerHQ/ledger-live/commit/166c038f05beca81af0c89d09a1147d50d7c20c4)]:
  - @ledgerhq/live-common@34.66.0-next.1

## 1.19.0-next.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

### Patch Changes

- Updated dependencies [[`d8d142e`](https://github.com/LedgerHQ/ledger-live/commit/d8d142eb73f1e8b5f4229ed69f55cb17770ee411), [`be83068`](https://github.com/LedgerHQ/ledger-live/commit/be83068b1580be86b1e97c1eb4c6b19db54ff2a4), [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`b78589c`](https://github.com/LedgerHQ/ledger-live/commit/b78589c7458ce37160264cd9f28f8d7abcca3942), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`f7c0705`](https://github.com/LedgerHQ/ledger-live/commit/f7c07058dda135f94f9cc75b50dbfdb92973268f), [`1f0721a`](https://github.com/LedgerHQ/ledger-live/commit/1f0721a1987ec4415b802b395e0bf9f7c61030ea), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`a6414f2`](https://github.com/LedgerHQ/ledger-live/commit/a6414f2aedae2ff657b29c2c4fa3e2c081e6e959), [`1c564a9`](https://github.com/LedgerHQ/ledger-live/commit/1c564a9da3a4c0aea9eda63c084dd2068b36b284), [`817d87a`](https://github.com/LedgerHQ/ledger-live/commit/817d87aadb553acb2c2d4410ab1011df32170e32), [`f1959b4`](https://github.com/LedgerHQ/ledger-live/commit/f1959b4e9a35f126b926972ad888081dab20c3c4), [`dd98891`](https://github.com/LedgerHQ/ledger-live/commit/dd98891e9c2e1bd4795b8adcb64b3c8c45b9eb75), [`1740fb5`](https://github.com/LedgerHQ/ledger-live/commit/1740fb51184ab2f0f773ad127c8015cd47cf7637), [`3488291`](https://github.com/LedgerHQ/ledger-live/commit/348829182b4fdb06f26078e68bce98ee637dfd1b), [`73681cc`](https://github.com/LedgerHQ/ledger-live/commit/73681cc69c80e7d64c7320bb4afcb0b44691d416), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f), [`b76ebac`](https://github.com/LedgerHQ/ledger-live/commit/b76ebac99eb485e5a8dc0607ab8325639ef30a9e), [`d7b8e13`](https://github.com/LedgerHQ/ledger-live/commit/d7b8e13caa615ca3f2c08c3a21b8e0226ea163b2), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41), [`7de6683`](https://github.com/LedgerHQ/ledger-live/commit/7de6683522c09a23a26137569ffd014bf0b255ec), [`5eeb5c0`](https://github.com/LedgerHQ/ledger-live/commit/5eeb5c0af77c9930de849fd23d4a724be7b3bee5)]:
  - @ledgerhq/live-common@34.66.0-next.0
  - @ledgerhq/coin-evm@3.1.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0
  - @ledgerhq/cryptoassets@13.43.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.0.1-next.0
  - @ledgerhq/coin-tester@0.18.0

## 1.18.1

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ece4eee`](https://github.com/LedgerHQ/ledger-live/commit/ece4eee6ac30e1e329c84f2045a76f469dc4c456), [`466b00b`](https://github.com/LedgerHQ/ledger-live/commit/466b00b14606b8eede7206ae3abe7d558a9076d6), [`3bc04f3`](https://github.com/LedgerHQ/ledger-live/commit/3bc04f3d0228fe810e269cbf69573c712ff51de5), [`a2223e1`](https://github.com/LedgerHQ/ledger-live/commit/a2223e1a64c49c71869426799e787026364d0ca7), [`8a8ead3`](https://github.com/LedgerHQ/ledger-live/commit/8a8ead3a5afef8273783cb3fe6fab322145ee711), [`c752d5c`](https://github.com/LedgerHQ/ledger-live/commit/c752d5c8ddf5c2032267ca87b1739efd7bc2e9bf), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`81cbdde`](https://github.com/LedgerHQ/ledger-live/commit/81cbdde31a92aef2e3b4706d300d93f53974deef), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`d6555fa`](https://github.com/LedgerHQ/ledger-live/commit/d6555fa38cacd6f7a60efc0d80f8f2b0160b852b), [`175471d`](https://github.com/LedgerHQ/ledger-live/commit/175471d9420ba21bba9245c21f5c8c5dbece418e), [`17423fa`](https://github.com/LedgerHQ/ledger-live/commit/17423fa88b3aa95beee57ff05f77aeeb8e9bc36e), [`044f9c0`](https://github.com/LedgerHQ/ledger-live/commit/044f9c0dbfa4f95b218c7f5d4299de0214f54806), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`cce5793`](https://github.com/LedgerHQ/ledger-live/commit/cce5793f2ea69b2ab382dfbf9ae5fee67104b897), [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`2e1d372`](https://github.com/LedgerHQ/ledger-live/commit/2e1d3723be3944e18b5b417aa9a52de39a32cf97), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`e2f95d7`](https://github.com/LedgerHQ/ledger-live/commit/e2f95d7e3df2fa5cd0a87f3a6cd9479b7dd9d2a6), [`fbd2fc2`](https://github.com/LedgerHQ/ledger-live/commit/fbd2fc2ee5c163840949cc8f9f85538bb4ace0a5), [`acd1dd2`](https://github.com/LedgerHQ/ledger-live/commit/acd1dd241dc900408fc480ef155dad3bdf56d786), [`80f5bab`](https://github.com/LedgerHQ/ledger-live/commit/80f5bab6210dba0e63e62d34709d5114f005fa11), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`b6cd425`](https://github.com/LedgerHQ/ledger-live/commit/b6cd425b5b78a52ca8b8fd3e27c56065dc158dbb), [`0d627ba`](https://github.com/LedgerHQ/ledger-live/commit/0d627ba04e4e0d9365fd5d6e6eb401cf0388ca78), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`e5096c1`](https://github.com/LedgerHQ/ledger-live/commit/e5096c1c6730707de81e958e000333f06058bf07), [`2943437`](https://github.com/LedgerHQ/ledger-live/commit/2943437759c850b28b1cc7952ea085db59b0ee6b), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`3c093bf`](https://github.com/LedgerHQ/ledger-live/commit/3c093bfa879d95105557f2c8a95e8f3da6ff8fa1), [`31e4cce`](https://github.com/LedgerHQ/ledger-live/commit/31e4cce50a89f8589fcbb762dad585f55ed17c92), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`b4669e8`](https://github.com/LedgerHQ/ledger-live/commit/b4669e83b42add5dec9b58c25cd6e0aba7cac71f), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0
  - @ledgerhq/live-common@34.65.0
  - @ledgerhq/types-cryptoassets@7.35.0
  - @ledgerhq/types-live@6.101.0
  - @ledgerhq/coin-evm@3.0.0
  - @ledgerhq/coin-framework@6.20.0
  - @ledgerhq/coin-tester@0.18.0

## 1.18.1-next.0

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ece4eee`](https://github.com/LedgerHQ/ledger-live/commit/ece4eee6ac30e1e329c84f2045a76f469dc4c456), [`466b00b`](https://github.com/LedgerHQ/ledger-live/commit/466b00b14606b8eede7206ae3abe7d558a9076d6), [`3bc04f3`](https://github.com/LedgerHQ/ledger-live/commit/3bc04f3d0228fe810e269cbf69573c712ff51de5), [`a2223e1`](https://github.com/LedgerHQ/ledger-live/commit/a2223e1a64c49c71869426799e787026364d0ca7), [`8a8ead3`](https://github.com/LedgerHQ/ledger-live/commit/8a8ead3a5afef8273783cb3fe6fab322145ee711), [`c752d5c`](https://github.com/LedgerHQ/ledger-live/commit/c752d5c8ddf5c2032267ca87b1739efd7bc2e9bf), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`81cbdde`](https://github.com/LedgerHQ/ledger-live/commit/81cbdde31a92aef2e3b4706d300d93f53974deef), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`d6555fa`](https://github.com/LedgerHQ/ledger-live/commit/d6555fa38cacd6f7a60efc0d80f8f2b0160b852b), [`175471d`](https://github.com/LedgerHQ/ledger-live/commit/175471d9420ba21bba9245c21f5c8c5dbece418e), [`17423fa`](https://github.com/LedgerHQ/ledger-live/commit/17423fa88b3aa95beee57ff05f77aeeb8e9bc36e), [`044f9c0`](https://github.com/LedgerHQ/ledger-live/commit/044f9c0dbfa4f95b218c7f5d4299de0214f54806), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`cce5793`](https://github.com/LedgerHQ/ledger-live/commit/cce5793f2ea69b2ab382dfbf9ae5fee67104b897), [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`2e1d372`](https://github.com/LedgerHQ/ledger-live/commit/2e1d3723be3944e18b5b417aa9a52de39a32cf97), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`e2f95d7`](https://github.com/LedgerHQ/ledger-live/commit/e2f95d7e3df2fa5cd0a87f3a6cd9479b7dd9d2a6), [`fbd2fc2`](https://github.com/LedgerHQ/ledger-live/commit/fbd2fc2ee5c163840949cc8f9f85538bb4ace0a5), [`acd1dd2`](https://github.com/LedgerHQ/ledger-live/commit/acd1dd241dc900408fc480ef155dad3bdf56d786), [`80f5bab`](https://github.com/LedgerHQ/ledger-live/commit/80f5bab6210dba0e63e62d34709d5114f005fa11), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`b6cd425`](https://github.com/LedgerHQ/ledger-live/commit/b6cd425b5b78a52ca8b8fd3e27c56065dc158dbb), [`0d627ba`](https://github.com/LedgerHQ/ledger-live/commit/0d627ba04e4e0d9365fd5d6e6eb401cf0388ca78), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`e5096c1`](https://github.com/LedgerHQ/ledger-live/commit/e5096c1c6730707de81e958e000333f06058bf07), [`2943437`](https://github.com/LedgerHQ/ledger-live/commit/2943437759c850b28b1cc7952ea085db59b0ee6b), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`3c093bf`](https://github.com/LedgerHQ/ledger-live/commit/3c093bfa879d95105557f2c8a95e8f3da6ff8fa1), [`31e4cce`](https://github.com/LedgerHQ/ledger-live/commit/31e4cce50a89f8589fcbb762dad585f55ed17c92), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`b4669e8`](https://github.com/LedgerHQ/ledger-live/commit/b4669e83b42add5dec9b58c25cd6e0aba7cac71f), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0-next.0
  - @ledgerhq/live-common@34.65.0-next.0
  - @ledgerhq/types-cryptoassets@7.35.0-next.0
  - @ledgerhq/types-live@6.101.0-next.0
  - @ledgerhq/coin-evm@3.0.0-next.0
  - @ledgerhq/coin-framework@6.20.0-next.0
  - @ledgerhq/coin-tester@0.18.0

## 1.18.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`cc1cbc8`](https://github.com/LedgerHQ/ledger-live/commit/cc1cbc8ffad02ae0bd4685f78427cbe4c630e717), [`c57b8d3`](https://github.com/LedgerHQ/ledger-live/commit/c57b8d340596bcc8dda212a184339bc9abaccf28), [`c9c94da`](https://github.com/LedgerHQ/ledger-live/commit/c9c94daeb352cd5d7bac3b98adb415f6abff26c8), [`bbf1f7c`](https://github.com/LedgerHQ/ledger-live/commit/bbf1f7ccb4a9f3c9d8756137d54dd37c5c9e0bf1), [`dda6826`](https://github.com/LedgerHQ/ledger-live/commit/dda6826a032213a5081b88c793b58cd0fbcb4088), [`158872e`](https://github.com/LedgerHQ/ledger-live/commit/158872e435155e91b1feea7a925523fe434447c4), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`59772c3`](https://github.com/LedgerHQ/ledger-live/commit/59772c3482ae412c76502f556c795932e80a69a0), [`b71fec2`](https://github.com/LedgerHQ/ledger-live/commit/b71fec2338ed6d292e1d8829d593e9eda78c208c), [`b43dd92`](https://github.com/LedgerHQ/ledger-live/commit/b43dd92c70265c88b9634a0513bec11f0c80669d), [`328332d`](https://github.com/LedgerHQ/ledger-live/commit/328332d460fbddab979a5e282990f2d2de1f8bc6), [`c2f73ae`](https://github.com/LedgerHQ/ledger-live/commit/c2f73aeed5bc502dc0ef2467954ce5367acf906f), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`e3628db`](https://github.com/LedgerHQ/ledger-live/commit/e3628db2abf9df401333a4040fe0f87ce48f2e9e), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f), [`91c1111`](https://github.com/LedgerHQ/ledger-live/commit/91c11111573e87002fefa9ed79b5a1872b8b3a34), [`cf0be50`](https://github.com/LedgerHQ/ledger-live/commit/cf0be503293e724a5281de15892af54cb5c6429c), [`721fd04`](https://github.com/LedgerHQ/ledger-live/commit/721fd04b40b7a574ef02dbbcffe449d3de670b3c)]:
  - @ledgerhq/types-live@6.100.0
  - @ledgerhq/live-common@34.64.0
  - @ledgerhq/coin-evm@2.46.0
  - @ledgerhq/coin-framework@6.19.0
  - @ledgerhq/cryptoassets@13.41.0
  - @ledgerhq/types-cryptoassets@7.34.0
  - @ledgerhq/coin-tester@0.18.0
  - @ledgerhq/live-config@3.6.0

## 1.18.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`cc1cbc8`](https://github.com/LedgerHQ/ledger-live/commit/cc1cbc8ffad02ae0bd4685f78427cbe4c630e717), [`c57b8d3`](https://github.com/LedgerHQ/ledger-live/commit/c57b8d340596bcc8dda212a184339bc9abaccf28), [`c9c94da`](https://github.com/LedgerHQ/ledger-live/commit/c9c94daeb352cd5d7bac3b98adb415f6abff26c8), [`bbf1f7c`](https://github.com/LedgerHQ/ledger-live/commit/bbf1f7ccb4a9f3c9d8756137d54dd37c5c9e0bf1), [`dda6826`](https://github.com/LedgerHQ/ledger-live/commit/dda6826a032213a5081b88c793b58cd0fbcb4088), [`158872e`](https://github.com/LedgerHQ/ledger-live/commit/158872e435155e91b1feea7a925523fe434447c4), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`59772c3`](https://github.com/LedgerHQ/ledger-live/commit/59772c3482ae412c76502f556c795932e80a69a0), [`b71fec2`](https://github.com/LedgerHQ/ledger-live/commit/b71fec2338ed6d292e1d8829d593e9eda78c208c), [`b43dd92`](https://github.com/LedgerHQ/ledger-live/commit/b43dd92c70265c88b9634a0513bec11f0c80669d), [`328332d`](https://github.com/LedgerHQ/ledger-live/commit/328332d460fbddab979a5e282990f2d2de1f8bc6), [`c2f73ae`](https://github.com/LedgerHQ/ledger-live/commit/c2f73aeed5bc502dc0ef2467954ce5367acf906f), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`e3628db`](https://github.com/LedgerHQ/ledger-live/commit/e3628db2abf9df401333a4040fe0f87ce48f2e9e), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f), [`91c1111`](https://github.com/LedgerHQ/ledger-live/commit/91c11111573e87002fefa9ed79b5a1872b8b3a34), [`cf0be50`](https://github.com/LedgerHQ/ledger-live/commit/cf0be503293e724a5281de15892af54cb5c6429c), [`721fd04`](https://github.com/LedgerHQ/ledger-live/commit/721fd04b40b7a574ef02dbbcffe449d3de670b3c)]:
  - @ledgerhq/types-live@6.100.0-next.0
  - @ledgerhq/live-common@34.64.0-next.0
  - @ledgerhq/coin-evm@2.46.0-next.0
  - @ledgerhq/coin-framework@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.41.0-next.0
  - @ledgerhq/types-cryptoassets@7.34.0-next.0
  - @ledgerhq/coin-tester@0.18.0-next.0
  - @ledgerhq/live-config@3.6.0-next.0

## 1.17.2

### Patch Changes

- Updated dependencies [[`b16f564`](https://github.com/LedgerHQ/ledger-live/commit/b16f564dbdd61c0e85e0280ba049d737395251aa), [`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5), [`6553406`](https://github.com/LedgerHQ/ledger-live/commit/6553406aced5e36d10679538c175465460ae8016), [`177defb`](https://github.com/LedgerHQ/ledger-live/commit/177defb8210c15f302c04761dc56627d3702a618), [`4c62031`](https://github.com/LedgerHQ/ledger-live/commit/4c62031295defabdb02444b9df261684d08368ce), [`133530f`](https://github.com/LedgerHQ/ledger-live/commit/133530f13d6f1bbefcf5bc38735dabe1e5412a33), [`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`517fd99`](https://github.com/LedgerHQ/ledger-live/commit/517fd99b4e058e1ab7bb1f3a1e9e271eb5d0ff16), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`6eef19c`](https://github.com/LedgerHQ/ledger-live/commit/6eef19c97d523af696ffdb9795942998b0853e8e), [`1c305c8`](https://github.com/LedgerHQ/ledger-live/commit/1c305c89eb35d02bfca72f2aa0c9a694a56a7dab), [`e389cd4`](https://github.com/LedgerHQ/ledger-live/commit/e389cd4fe163c3f54029c747141ae37dda5b4da7), [`0041229`](https://github.com/LedgerHQ/ledger-live/commit/00412299786667b6f4ddc964ebe928fdf1bc9209), [`c2b8a34`](https://github.com/LedgerHQ/ledger-live/commit/c2b8a34e934e7d84c88633ffcabd930da51c2041), [`494ccd1`](https://github.com/LedgerHQ/ledger-live/commit/494ccd12f74b5733844567883d21826bfed0f2c0), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`45c33f6`](https://github.com/LedgerHQ/ledger-live/commit/45c33f630249e48371252e7bd745c934d212f143), [`6f59516`](https://github.com/LedgerHQ/ledger-live/commit/6f59516a966c541ce444996181b70cc3530030b8), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`1d56507`](https://github.com/LedgerHQ/ledger-live/commit/1d565073a613cece7f4086bae266f2eea169047c), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`50a440d`](https://github.com/LedgerHQ/ledger-live/commit/50a440d0d67f1baa740c3fad92d6a4b29a101103), [`dfe0a79`](https://github.com/LedgerHQ/ledger-live/commit/dfe0a79c38957be69c90de6b66bf26a9a92a8d3a), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af), [`9d5c4c6`](https://github.com/LedgerHQ/ledger-live/commit/9d5c4c6a0baec0292720d522b3d827a9c2c55247), [`31c6c51`](https://github.com/LedgerHQ/ledger-live/commit/31c6c510097a64ae0941e4ccace7e2a2ba86270a), [`ca57786`](https://github.com/LedgerHQ/ledger-live/commit/ca577869886e96231c0fbbe332cce126fa943cd6), [`c34109f`](https://github.com/LedgerHQ/ledger-live/commit/c34109f4f2f7fd783f5f94c8046b24e08bf54de5), [`b1f7cca`](https://github.com/LedgerHQ/ledger-live/commit/b1f7cca4c75433670d87a58149c6ab236ea6f05c), [`a4b1ec0`](https://github.com/LedgerHQ/ledger-live/commit/a4b1ec062a093cb7d063a27830ddddef2727c7d3)]:
  - @ledgerhq/live-common@34.63.0
  - @ledgerhq/coin-evm@2.45.0
  - @ledgerhq/types-live@6.99.0
  - @ledgerhq/cryptoassets@13.40.0
  - @ledgerhq/coin-framework@6.18.0
  - @ledgerhq/coin-tester@0.17.0

## 1.17.2-next.0

### Patch Changes

- Updated dependencies [[`b16f564`](https://github.com/LedgerHQ/ledger-live/commit/b16f564dbdd61c0e85e0280ba049d737395251aa), [`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5), [`6553406`](https://github.com/LedgerHQ/ledger-live/commit/6553406aced5e36d10679538c175465460ae8016), [`177defb`](https://github.com/LedgerHQ/ledger-live/commit/177defb8210c15f302c04761dc56627d3702a618), [`4c62031`](https://github.com/LedgerHQ/ledger-live/commit/4c62031295defabdb02444b9df261684d08368ce), [`133530f`](https://github.com/LedgerHQ/ledger-live/commit/133530f13d6f1bbefcf5bc38735dabe1e5412a33), [`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`517fd99`](https://github.com/LedgerHQ/ledger-live/commit/517fd99b4e058e1ab7bb1f3a1e9e271eb5d0ff16), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`6eef19c`](https://github.com/LedgerHQ/ledger-live/commit/6eef19c97d523af696ffdb9795942998b0853e8e), [`1c305c8`](https://github.com/LedgerHQ/ledger-live/commit/1c305c89eb35d02bfca72f2aa0c9a694a56a7dab), [`e389cd4`](https://github.com/LedgerHQ/ledger-live/commit/e389cd4fe163c3f54029c747141ae37dda5b4da7), [`0041229`](https://github.com/LedgerHQ/ledger-live/commit/00412299786667b6f4ddc964ebe928fdf1bc9209), [`c2b8a34`](https://github.com/LedgerHQ/ledger-live/commit/c2b8a34e934e7d84c88633ffcabd930da51c2041), [`494ccd1`](https://github.com/LedgerHQ/ledger-live/commit/494ccd12f74b5733844567883d21826bfed0f2c0), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`45c33f6`](https://github.com/LedgerHQ/ledger-live/commit/45c33f630249e48371252e7bd745c934d212f143), [`6f59516`](https://github.com/LedgerHQ/ledger-live/commit/6f59516a966c541ce444996181b70cc3530030b8), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`1d56507`](https://github.com/LedgerHQ/ledger-live/commit/1d565073a613cece7f4086bae266f2eea169047c), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`50a440d`](https://github.com/LedgerHQ/ledger-live/commit/50a440d0d67f1baa740c3fad92d6a4b29a101103), [`dfe0a79`](https://github.com/LedgerHQ/ledger-live/commit/dfe0a79c38957be69c90de6b66bf26a9a92a8d3a), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af), [`9d5c4c6`](https://github.com/LedgerHQ/ledger-live/commit/9d5c4c6a0baec0292720d522b3d827a9c2c55247), [`31c6c51`](https://github.com/LedgerHQ/ledger-live/commit/31c6c510097a64ae0941e4ccace7e2a2ba86270a), [`ca57786`](https://github.com/LedgerHQ/ledger-live/commit/ca577869886e96231c0fbbe332cce126fa943cd6), [`c34109f`](https://github.com/LedgerHQ/ledger-live/commit/c34109f4f2f7fd783f5f94c8046b24e08bf54de5), [`b1f7cca`](https://github.com/LedgerHQ/ledger-live/commit/b1f7cca4c75433670d87a58149c6ab236ea6f05c), [`a4b1ec0`](https://github.com/LedgerHQ/ledger-live/commit/a4b1ec062a093cb7d063a27830ddddef2727c7d3)]:
  - @ledgerhq/live-common@34.63.0-next.0
  - @ledgerhq/coin-evm@2.45.0-next.0
  - @ledgerhq/types-live@6.99.0-next.0
  - @ledgerhq/cryptoassets@13.40.0-next.0
  - @ledgerhq/coin-framework@6.18.0-next.0
  - @ledgerhq/coin-tester@0.17.0

## 1.17.1

### Patch Changes

- Updated dependencies [[`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835), [`e7879f0`](https://github.com/LedgerHQ/ledger-live/commit/e7879f010edbff6df939662218ac4f007b2911ab), [`438989f`](https://github.com/LedgerHQ/ledger-live/commit/438989f96a31dfbd494284dadd05723f9eb864f5), [`bd39baa`](https://github.com/LedgerHQ/ledger-live/commit/bd39baa199c5e63a889c8120e7650445a8c63521), [`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`ff67587`](https://github.com/LedgerHQ/ledger-live/commit/ff67587241e5c521b4e1be2074985450fb6f9edc), [`171a22c`](https://github.com/LedgerHQ/ledger-live/commit/171a22c1a01784111cd0e07526ad9114a445c4e6), [`2aa87ef`](https://github.com/LedgerHQ/ledger-live/commit/2aa87ef53048a0a4abbe5a1365db0fa1f6d1d428), [`5c9240a`](https://github.com/LedgerHQ/ledger-live/commit/5c9240aed148dd302cc6c29796fd1260411f0f9e), [`dd5e9c6`](https://github.com/LedgerHQ/ledger-live/commit/dd5e9c6680aef53b82e5e0fcdd21f39d83916b2f), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197), [`9c7f26f`](https://github.com/LedgerHQ/ledger-live/commit/9c7f26f62427bffe4af23cccf253e8b2dd3cf616), [`e03aa47`](https://github.com/LedgerHQ/ledger-live/commit/e03aa476da9d83fdf535a787e52b74f630911718), [`ac7f317`](https://github.com/LedgerHQ/ledger-live/commit/ac7f3179daa08d562618d334ca39847162300df8), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/live-common@34.62.0
  - @ledgerhq/coin-evm@2.44.0
  - @ledgerhq/types-live@6.98.0
  - @ledgerhq/coin-framework@6.17.0
  - @ledgerhq/coin-tester@0.17.0
  - @ledgerhq/cryptoassets@13.39.1

## 1.17.1-next.1

### Patch Changes

- Updated dependencies [[`9c7f26f`](https://github.com/LedgerHQ/ledger-live/commit/9c7f26f62427bffe4af23cccf253e8b2dd3cf616)]:
  - @ledgerhq/live-common@34.62.0-next.1

## 1.17.1-next.0

### Patch Changes

- Updated dependencies [[`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835), [`e7879f0`](https://github.com/LedgerHQ/ledger-live/commit/e7879f010edbff6df939662218ac4f007b2911ab), [`438989f`](https://github.com/LedgerHQ/ledger-live/commit/438989f96a31dfbd494284dadd05723f9eb864f5), [`bd39baa`](https://github.com/LedgerHQ/ledger-live/commit/bd39baa199c5e63a889c8120e7650445a8c63521), [`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`ff67587`](https://github.com/LedgerHQ/ledger-live/commit/ff67587241e5c521b4e1be2074985450fb6f9edc), [`171a22c`](https://github.com/LedgerHQ/ledger-live/commit/171a22c1a01784111cd0e07526ad9114a445c4e6), [`2aa87ef`](https://github.com/LedgerHQ/ledger-live/commit/2aa87ef53048a0a4abbe5a1365db0fa1f6d1d428), [`5c9240a`](https://github.com/LedgerHQ/ledger-live/commit/5c9240aed148dd302cc6c29796fd1260411f0f9e), [`dd5e9c6`](https://github.com/LedgerHQ/ledger-live/commit/dd5e9c6680aef53b82e5e0fcdd21f39d83916b2f), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197), [`e03aa47`](https://github.com/LedgerHQ/ledger-live/commit/e03aa476da9d83fdf535a787e52b74f630911718), [`ac7f317`](https://github.com/LedgerHQ/ledger-live/commit/ac7f3179daa08d562618d334ca39847162300df8), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/live-common@34.62.0-next.0
  - @ledgerhq/coin-evm@2.44.0-next.0
  - @ledgerhq/types-live@6.98.0-next.0
  - @ledgerhq/coin-framework@6.17.0-next.0
  - @ledgerhq/coin-tester@0.17.0
  - @ledgerhq/cryptoassets@13.39.1-next.0

## 1.17.0

### Minor Changes

- [#14385](https://github.com/LedgerHQ/ledger-live/pull/14385) [`4c642cb`](https://github.com/LedgerHQ/ledger-live/commit/4c642cbf197bbc5bd7783a08f36774d016ab3b22) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - deps(coin-evm,coin-tester-evm): remove `bluebird`

### Patch Changes

- Updated dependencies [[`cb6cce9`](https://github.com/LedgerHQ/ledger-live/commit/cb6cce9031b6400968eca11017c6e4d0606805a2), [`d221665`](https://github.com/LedgerHQ/ledger-live/commit/d221665087351c7c59312bc557c758a0026c36c9), [`a54870f`](https://github.com/LedgerHQ/ledger-live/commit/a54870f2aa2371822807350b026619379d38bb1c), [`a83545a`](https://github.com/LedgerHQ/ledger-live/commit/a83545add7d5e150208084350d7f9c51481db06d), [`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`c4e7d20`](https://github.com/LedgerHQ/ledger-live/commit/c4e7d20ce631d43d7c8847d3f56187f68140fbab), [`c039174`](https://github.com/LedgerHQ/ledger-live/commit/c03917424131f87923a8151d75e04de272c42aab), [`ebb41ed`](https://github.com/LedgerHQ/ledger-live/commit/ebb41ed183ed5d6c16b82eb94c9fceea3fe26b61), [`9da7bfe`](https://github.com/LedgerHQ/ledger-live/commit/9da7bfe1696fec2fc0eea424791e56008349bcdd), [`3e78638`](https://github.com/LedgerHQ/ledger-live/commit/3e7863810cbf421ce091cc5e94116a9f4d3930ac), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`595fee5`](https://github.com/LedgerHQ/ledger-live/commit/595fee5e8be4280e34b87cf2258c7a8dcdeb82d5), [`6b74a70`](https://github.com/LedgerHQ/ledger-live/commit/6b74a7029baab853b3032122be5e7fbf39969128), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`e3255a5`](https://github.com/LedgerHQ/ledger-live/commit/e3255a58ed749bfa63f46f837e4454cccf13c6e3), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`4c642cb`](https://github.com/LedgerHQ/ledger-live/commit/4c642cbf197bbc5bd7783a08f36774d016ab3b22), [`95805b8`](https://github.com/LedgerHQ/ledger-live/commit/95805b8344c1577b3cd917d76b882e28dd134ee0), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`62e9b32`](https://github.com/LedgerHQ/ledger-live/commit/62e9b32207ad55211a2985e9e00d568abc2abe37), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-evm@2.43.0
  - @ledgerhq/live-common@34.61.0
  - @ledgerhq/coin-framework@6.16.0
  - @ledgerhq/cryptoassets@13.39.0
  - @ledgerhq/types-live@6.97.0
  - @ledgerhq/types-cryptoassets@7.33.0
  - @ledgerhq/coin-tester@0.17.0

## 1.17.0-next.0

### Minor Changes

- [#14385](https://github.com/LedgerHQ/ledger-live/pull/14385) [`4c642cb`](https://github.com/LedgerHQ/ledger-live/commit/4c642cbf197bbc5bd7783a08f36774d016ab3b22) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - deps(coin-evm,coin-tester-evm): remove `bluebird`

### Patch Changes

- Updated dependencies [[`cb6cce9`](https://github.com/LedgerHQ/ledger-live/commit/cb6cce9031b6400968eca11017c6e4d0606805a2), [`d221665`](https://github.com/LedgerHQ/ledger-live/commit/d221665087351c7c59312bc557c758a0026c36c9), [`a54870f`](https://github.com/LedgerHQ/ledger-live/commit/a54870f2aa2371822807350b026619379d38bb1c), [`a83545a`](https://github.com/LedgerHQ/ledger-live/commit/a83545add7d5e150208084350d7f9c51481db06d), [`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`c4e7d20`](https://github.com/LedgerHQ/ledger-live/commit/c4e7d20ce631d43d7c8847d3f56187f68140fbab), [`c039174`](https://github.com/LedgerHQ/ledger-live/commit/c03917424131f87923a8151d75e04de272c42aab), [`ebb41ed`](https://github.com/LedgerHQ/ledger-live/commit/ebb41ed183ed5d6c16b82eb94c9fceea3fe26b61), [`9da7bfe`](https://github.com/LedgerHQ/ledger-live/commit/9da7bfe1696fec2fc0eea424791e56008349bcdd), [`3e78638`](https://github.com/LedgerHQ/ledger-live/commit/3e7863810cbf421ce091cc5e94116a9f4d3930ac), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`595fee5`](https://github.com/LedgerHQ/ledger-live/commit/595fee5e8be4280e34b87cf2258c7a8dcdeb82d5), [`6b74a70`](https://github.com/LedgerHQ/ledger-live/commit/6b74a7029baab853b3032122be5e7fbf39969128), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`e3255a5`](https://github.com/LedgerHQ/ledger-live/commit/e3255a58ed749bfa63f46f837e4454cccf13c6e3), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`4c642cb`](https://github.com/LedgerHQ/ledger-live/commit/4c642cbf197bbc5bd7783a08f36774d016ab3b22), [`95805b8`](https://github.com/LedgerHQ/ledger-live/commit/95805b8344c1577b3cd917d76b882e28dd134ee0), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`62e9b32`](https://github.com/LedgerHQ/ledger-live/commit/62e9b32207ad55211a2985e9e00d568abc2abe37), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-evm@2.43.0-next.0
  - @ledgerhq/live-common@34.61.0-next.0
  - @ledgerhq/coin-framework@6.16.0-next.0
  - @ledgerhq/cryptoassets@13.39.0-next.0
  - @ledgerhq/types-live@6.97.0-next.0
  - @ledgerhq/types-cryptoassets@7.33.0-next.0
  - @ledgerhq/coin-tester@0.17.0

## 1.16.0

### Minor Changes

- [#14117](https://github.com/LedgerHQ/ledger-live/pull/14117) [`396c930`](https://github.com/LedgerHQ/ledger-live/commit/396c930f6ca46c7c546dc305a9a0ab0fff1a1bb4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-tester-evm): block non local http requests

### Patch Changes

- Updated dependencies [[`ed6d076`](https://github.com/LedgerHQ/ledger-live/commit/ed6d07693d9cdd16c954127520da6fcb16273d93), [`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`196ac42`](https://github.com/LedgerHQ/ledger-live/commit/196ac4225b08b40fd04d137ee17cf9e75a502443), [`6dc7fa6`](https://github.com/LedgerHQ/ledger-live/commit/6dc7fa6de3ef8f2357a40c8243d6af004796c4d4), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`463df0d`](https://github.com/LedgerHQ/ledger-live/commit/463df0d85df9a223bde62ddb45d783920348c92f), [`59b4d7e`](https://github.com/LedgerHQ/ledger-live/commit/59b4d7e4052bf873644dfb817ee910ab1f046332), [`64a32d2`](https://github.com/LedgerHQ/ledger-live/commit/64a32d23aa176c904974bb6e3acd717d9c75729a), [`982a7e9`](https://github.com/LedgerHQ/ledger-live/commit/982a7e9c73867b7c7b90ccae6df575d59c06806c), [`c36a6b1`](https://github.com/LedgerHQ/ledger-live/commit/c36a6b1112bb87e53ae106f676069327726b90c7), [`65f0757`](https://github.com/LedgerHQ/ledger-live/commit/65f0757b1ea33a5971132d338e270ecf3242ba10), [`c9f56c4`](https://github.com/LedgerHQ/ledger-live/commit/c9f56c4af8a2825f52696c2ef241564e62c55111), [`c502474`](https://github.com/LedgerHQ/ledger-live/commit/c502474fb1cd531511eaa0188affe2f315ef0cdf), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`f9c121a`](https://github.com/LedgerHQ/ledger-live/commit/f9c121aaee36b33be60af7111f841dde038a95f2), [`9b10692`](https://github.com/LedgerHQ/ledger-live/commit/9b1069261b21b4875ea1966212e4d8bd5327ac88), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014), [`a774b49`](https://github.com/LedgerHQ/ledger-live/commit/a774b49cca0696426d20a51782e3f18640c47613), [`d5b273b`](https://github.com/LedgerHQ/ledger-live/commit/d5b273b41e768c3a656306070c16bc42b7790f79)]:
  - @ledgerhq/live-common@34.60.0
  - @ledgerhq/types-live@6.96.0
  - @ledgerhq/coin-evm@2.42.0
  - @ledgerhq/coin-framework@6.15.0
  - @ledgerhq/coin-tester@0.17.0
  - @ledgerhq/cryptoassets@13.38.1

## 1.16.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.60.0-next.1

## 1.16.0-next.0

### Minor Changes

- [#14117](https://github.com/LedgerHQ/ledger-live/pull/14117) [`396c930`](https://github.com/LedgerHQ/ledger-live/commit/396c930f6ca46c7c546dc305a9a0ab0fff1a1bb4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-tester-evm): block non local http requests

### Patch Changes

- Updated dependencies [[`ed6d076`](https://github.com/LedgerHQ/ledger-live/commit/ed6d07693d9cdd16c954127520da6fcb16273d93), [`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`196ac42`](https://github.com/LedgerHQ/ledger-live/commit/196ac4225b08b40fd04d137ee17cf9e75a502443), [`6dc7fa6`](https://github.com/LedgerHQ/ledger-live/commit/6dc7fa6de3ef8f2357a40c8243d6af004796c4d4), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`463df0d`](https://github.com/LedgerHQ/ledger-live/commit/463df0d85df9a223bde62ddb45d783920348c92f), [`59b4d7e`](https://github.com/LedgerHQ/ledger-live/commit/59b4d7e4052bf873644dfb817ee910ab1f046332), [`64a32d2`](https://github.com/LedgerHQ/ledger-live/commit/64a32d23aa176c904974bb6e3acd717d9c75729a), [`982a7e9`](https://github.com/LedgerHQ/ledger-live/commit/982a7e9c73867b7c7b90ccae6df575d59c06806c), [`c36a6b1`](https://github.com/LedgerHQ/ledger-live/commit/c36a6b1112bb87e53ae106f676069327726b90c7), [`65f0757`](https://github.com/LedgerHQ/ledger-live/commit/65f0757b1ea33a5971132d338e270ecf3242ba10), [`c9f56c4`](https://github.com/LedgerHQ/ledger-live/commit/c9f56c4af8a2825f52696c2ef241564e62c55111), [`c502474`](https://github.com/LedgerHQ/ledger-live/commit/c502474fb1cd531511eaa0188affe2f315ef0cdf), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`f9c121a`](https://github.com/LedgerHQ/ledger-live/commit/f9c121aaee36b33be60af7111f841dde038a95f2), [`9b10692`](https://github.com/LedgerHQ/ledger-live/commit/9b1069261b21b4875ea1966212e4d8bd5327ac88), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014), [`a774b49`](https://github.com/LedgerHQ/ledger-live/commit/a774b49cca0696426d20a51782e3f18640c47613), [`d5b273b`](https://github.com/LedgerHQ/ledger-live/commit/d5b273b41e768c3a656306070c16bc42b7790f79)]:
  - @ledgerhq/live-common@34.60.0-next.0
  - @ledgerhq/types-live@6.96.0-next.0
  - @ledgerhq/coin-evm@2.42.0-next.0
  - @ledgerhq/coin-framework@6.15.0-next.0
  - @ledgerhq/coin-tester@0.17.0
  - @ledgerhq/cryptoassets@13.38.1-next.0

## 1.15.0

### Minor Changes

- [#13874](https://github.com/LedgerHQ/ledger-live/pull/13874) [`f1e28ae`](https://github.com/LedgerHQ/ledger-live/commit/f1e28ae77c9d8b065b941240c884db1ba2b5ac3b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-bitcoin): add local signer

### Patch Changes

- Updated dependencies [[`fb7eafc`](https://github.com/LedgerHQ/ledger-live/commit/fb7eafc3f1f1fb408d96d4179b8c3bf352ece6cc), [`ed6c327`](https://github.com/LedgerHQ/ledger-live/commit/ed6c32745d607d339eee3159e7234e42bfdf20ce), [`a9e7653`](https://github.com/LedgerHQ/ledger-live/commit/a9e7653027ef350dc854051ee836a7d977f53092), [`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`7a3085a`](https://github.com/LedgerHQ/ledger-live/commit/7a3085a9e448079425a71372713240f8e65b1b61), [`52c5265`](https://github.com/LedgerHQ/ledger-live/commit/52c5265b2825bfa4ba27587e9306182c024c7126), [`f1e28ae`](https://github.com/LedgerHQ/ledger-live/commit/f1e28ae77c9d8b065b941240c884db1ba2b5ac3b), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`2b6d179`](https://github.com/LedgerHQ/ledger-live/commit/2b6d1797dcefa9f642c2a37efcd4f6ae8fe79557), [`5a3332f`](https://github.com/LedgerHQ/ledger-live/commit/5a3332f7f701ca31d6f0808575816891101450cb), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`99f92ce`](https://github.com/LedgerHQ/ledger-live/commit/99f92cee9bbfb433eda7c3d4f1a4752401f3aa44), [`21191ce`](https://github.com/LedgerHQ/ledger-live/commit/21191cefd8b3b10153c5532376d4a7eacb6fbbe6), [`1f3a159`](https://github.com/LedgerHQ/ledger-live/commit/1f3a159e950dcb81b8e23aaa9e411db816e657d4), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/live-common@34.59.0
  - @ledgerhq/coin-framework@6.14.0
  - @ledgerhq/coin-tester@0.17.0
  - @ledgerhq/cryptoassets@13.38.0
  - @ledgerhq/types-live@6.95.0
  - @ledgerhq/coin-evm@2.41.0

## 1.15.0-next.0

### Minor Changes

- [#13874](https://github.com/LedgerHQ/ledger-live/pull/13874) [`f1e28ae`](https://github.com/LedgerHQ/ledger-live/commit/f1e28ae77c9d8b065b941240c884db1ba2b5ac3b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-bitcoin): add local signer

### Patch Changes

- Updated dependencies [[`fb7eafc`](https://github.com/LedgerHQ/ledger-live/commit/fb7eafc3f1f1fb408d96d4179b8c3bf352ece6cc), [`ed6c327`](https://github.com/LedgerHQ/ledger-live/commit/ed6c32745d607d339eee3159e7234e42bfdf20ce), [`a9e7653`](https://github.com/LedgerHQ/ledger-live/commit/a9e7653027ef350dc854051ee836a7d977f53092), [`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`7a3085a`](https://github.com/LedgerHQ/ledger-live/commit/7a3085a9e448079425a71372713240f8e65b1b61), [`52c5265`](https://github.com/LedgerHQ/ledger-live/commit/52c5265b2825bfa4ba27587e9306182c024c7126), [`f1e28ae`](https://github.com/LedgerHQ/ledger-live/commit/f1e28ae77c9d8b065b941240c884db1ba2b5ac3b), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`2b6d179`](https://github.com/LedgerHQ/ledger-live/commit/2b6d1797dcefa9f642c2a37efcd4f6ae8fe79557), [`5a3332f`](https://github.com/LedgerHQ/ledger-live/commit/5a3332f7f701ca31d6f0808575816891101450cb), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`99f92ce`](https://github.com/LedgerHQ/ledger-live/commit/99f92cee9bbfb433eda7c3d4f1a4752401f3aa44), [`21191ce`](https://github.com/LedgerHQ/ledger-live/commit/21191cefd8b3b10153c5532376d4a7eacb6fbbe6), [`1f3a159`](https://github.com/LedgerHQ/ledger-live/commit/1f3a159e950dcb81b8e23aaa9e411db816e657d4), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/live-common@34.59.0-next.0
  - @ledgerhq/coin-framework@6.14.0-next.0
  - @ledgerhq/coin-tester@0.17.0-next.0
  - @ledgerhq/cryptoassets@13.38.0-next.0
  - @ledgerhq/types-live@6.95.0-next.0
  - @ledgerhq/coin-evm@2.41.0-next.0

## 1.14.1

### Patch Changes

- Updated dependencies [[`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d), [`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`d38431e`](https://github.com/LedgerHQ/ledger-live/commit/d38431ee5f91439794cc6c7bad793b89ade95155), [`d3a00b8`](https://github.com/LedgerHQ/ledger-live/commit/d3a00b897349d2109b2ddb6aba63d20fdedc149c), [`d8f4b10`](https://github.com/LedgerHQ/ledger-live/commit/d8f4b10b28b63880fdac40a58e1d4f06191070a9), [`85ed675`](https://github.com/LedgerHQ/ledger-live/commit/85ed67593945e396cfe995a13de7454850fa6436), [`97ac494`](https://github.com/LedgerHQ/ledger-live/commit/97ac4940399281450a67b5f533ff49d03a169403), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`7389999`](https://github.com/LedgerHQ/ledger-live/commit/7389999b0a5b52c42b565cbfe8e024c315c9dcf5), [`b8e22d3`](https://github.com/LedgerHQ/ledger-live/commit/b8e22d36b8bb44eda9dfd267227a22391519c08b), [`36aaf48`](https://github.com/LedgerHQ/ledger-live/commit/36aaf487c15da117a23332de376257ce8e6582a9), [`d469c61`](https://github.com/LedgerHQ/ledger-live/commit/d469c6160a9fdd7cd581836195d54bafd2a0419a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/live-common@34.58.0
  - @ledgerhq/types-live@6.94.0
  - @ledgerhq/coin-evm@2.40.0
  - @ledgerhq/coin-framework@6.13.1
  - @ledgerhq/coin-tester@0.16.1
  - @ledgerhq/cryptoassets@13.37.1

## 1.14.1-next.0

### Patch Changes

- Updated dependencies [[`c8edd4c`](https://github.com/LedgerHQ/ledger-live/commit/c8edd4cb0996c96548fa4d6166d78e8d1a50ef2d), [`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`d38431e`](https://github.com/LedgerHQ/ledger-live/commit/d38431ee5f91439794cc6c7bad793b89ade95155), [`d3a00b8`](https://github.com/LedgerHQ/ledger-live/commit/d3a00b897349d2109b2ddb6aba63d20fdedc149c), [`d8f4b10`](https://github.com/LedgerHQ/ledger-live/commit/d8f4b10b28b63880fdac40a58e1d4f06191070a9), [`85ed675`](https://github.com/LedgerHQ/ledger-live/commit/85ed67593945e396cfe995a13de7454850fa6436), [`97ac494`](https://github.com/LedgerHQ/ledger-live/commit/97ac4940399281450a67b5f533ff49d03a169403), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`7389999`](https://github.com/LedgerHQ/ledger-live/commit/7389999b0a5b52c42b565cbfe8e024c315c9dcf5), [`b8e22d3`](https://github.com/LedgerHQ/ledger-live/commit/b8e22d36b8bb44eda9dfd267227a22391519c08b), [`36aaf48`](https://github.com/LedgerHQ/ledger-live/commit/36aaf487c15da117a23332de376257ce8e6582a9), [`d469c61`](https://github.com/LedgerHQ/ledger-live/commit/d469c6160a9fdd7cd581836195d54bafd2a0419a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/live-common@34.58.0-next.0
  - @ledgerhq/types-live@6.94.0-next.0
  - @ledgerhq/coin-evm@2.40.0-next.0
  - @ledgerhq/coin-framework@6.13.1-next.0
  - @ledgerhq/coin-tester@0.16.1-next.0
  - @ledgerhq/cryptoassets@13.37.1-next.0

## 1.14.0

### Minor Changes

- [#13614](https://github.com/LedgerHQ/ledger-live/pull/13614) [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): only expose `refreshOperations` if no explorers is available

- [#13645](https://github.com/LedgerHQ/ledger-live/pull/13645) [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21) Thanks [@qperrot](https://github.com/qperrot)! - feat: add bsc coin tester and test send max in every coin-tester-evm

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`433a1dd`](https://github.com/LedgerHQ/ledger-live/commit/433a1dd0b55f0d4bdad03ce2deb65b801770832d), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`e3a83e0`](https://github.com/LedgerHQ/ledger-live/commit/e3a83e08278fd6bef3fd26d90df2823c78957d20), [`1f35ab1`](https://github.com/LedgerHQ/ledger-live/commit/1f35ab1efc396e1c4740607d6806284f906f1907), [`a526d94`](https://github.com/LedgerHQ/ledger-live/commit/a526d9465eb4887b3c65ab768b346bd91bf17e20), [`9cf9c5b`](https://github.com/LedgerHQ/ledger-live/commit/9cf9c5b0500d5b07e624b1c62ffa2d7a2b50f1c5), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`ebce0b9`](https://github.com/LedgerHQ/ledger-live/commit/ebce0b97b3d35921d7b6c256e106ddb400f2aaa5), [`8b0b2ff`](https://github.com/LedgerHQ/ledger-live/commit/8b0b2ffb5425743b56c44e7ec41443c77d839c1f), [`3f33516`](https://github.com/LedgerHQ/ledger-live/commit/3f33516315f5256ab1afcd03e075e1c38e42e475), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`8c79f3e`](https://github.com/LedgerHQ/ledger-live/commit/8c79f3e27ed34f91a25a63647e781561531e01fe), [`d790eee`](https://github.com/LedgerHQ/ledger-live/commit/d790eeef975a5d305bd9010e8f4b08cc3044125a), [`6630dfd`](https://github.com/LedgerHQ/ledger-live/commit/6630dfd86f5207d82d844f9aa246c03135a5d586), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`bc7f669`](https://github.com/LedgerHQ/ledger-live/commit/bc7f669754002d7fe74dde3f217200e4153a2a26), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b), [`4758d1a`](https://github.com/LedgerHQ/ledger-live/commit/4758d1a7028e6fc77248d9bf3aec4f20752518c2)]:
  - @ledgerhq/cryptoassets@13.37.0
  - @ledgerhq/live-common@34.57.0
  - @ledgerhq/coin-framework@6.13.0
  - @ledgerhq/coin-evm@2.39.0
  - @ledgerhq/types-live@6.93.0
  - @ledgerhq/types-cryptoassets@7.32.0
  - @ledgerhq/coin-tester@0.16.0
  - @ledgerhq/live-config@3.5.0

## 1.14.0-next.0

### Minor Changes

- [#13614](https://github.com/LedgerHQ/ledger-live/pull/13614) [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): only expose `refreshOperations` if no explorers is available

- [#13645](https://github.com/LedgerHQ/ledger-live/pull/13645) [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21) Thanks [@qperrot](https://github.com/qperrot)! - feat: add bsc coin tester and test send max in every coin-tester-evm

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`433a1dd`](https://github.com/LedgerHQ/ledger-live/commit/433a1dd0b55f0d4bdad03ce2deb65b801770832d), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`e3a83e0`](https://github.com/LedgerHQ/ledger-live/commit/e3a83e08278fd6bef3fd26d90df2823c78957d20), [`1f35ab1`](https://github.com/LedgerHQ/ledger-live/commit/1f35ab1efc396e1c4740607d6806284f906f1907), [`a526d94`](https://github.com/LedgerHQ/ledger-live/commit/a526d9465eb4887b3c65ab768b346bd91bf17e20), [`9cf9c5b`](https://github.com/LedgerHQ/ledger-live/commit/9cf9c5b0500d5b07e624b1c62ffa2d7a2b50f1c5), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`ebce0b9`](https://github.com/LedgerHQ/ledger-live/commit/ebce0b97b3d35921d7b6c256e106ddb400f2aaa5), [`8b0b2ff`](https://github.com/LedgerHQ/ledger-live/commit/8b0b2ffb5425743b56c44e7ec41443c77d839c1f), [`3f33516`](https://github.com/LedgerHQ/ledger-live/commit/3f33516315f5256ab1afcd03e075e1c38e42e475), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`8c79f3e`](https://github.com/LedgerHQ/ledger-live/commit/8c79f3e27ed34f91a25a63647e781561531e01fe), [`d790eee`](https://github.com/LedgerHQ/ledger-live/commit/d790eeef975a5d305bd9010e8f4b08cc3044125a), [`6630dfd`](https://github.com/LedgerHQ/ledger-live/commit/6630dfd86f5207d82d844f9aa246c03135a5d586), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`bc7f669`](https://github.com/LedgerHQ/ledger-live/commit/bc7f669754002d7fe74dde3f217200e4153a2a26), [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b), [`4758d1a`](https://github.com/LedgerHQ/ledger-live/commit/4758d1a7028e6fc77248d9bf3aec4f20752518c2)]:
  - @ledgerhq/cryptoassets@13.37.0-next.0
  - @ledgerhq/live-common@34.57.0-next.0
  - @ledgerhq/coin-framework@6.13.0-next.0
  - @ledgerhq/coin-evm@2.39.0-next.0
  - @ledgerhq/types-live@6.93.0-next.0
  - @ledgerhq/types-cryptoassets@7.32.0-next.0
  - @ledgerhq/coin-tester@0.16.0-next.0
  - @ledgerhq/live-config@3.5.0-next.0

## 1.13.0

### Minor Changes

- [#13355](https://github.com/LedgerHQ/ledger-live/pull/13355) [`66c6e29`](https://github.com/LedgerHQ/ledger-live/commit/66c6e29a50a2ed74a12bb641cd026ead65f85961) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use local signer instead of Speculos

- [#13468](https://github.com/LedgerHQ/ledger-live/pull/13468) [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Dedup MSW lib inside monorepo

- [#13450](https://github.com/LedgerHQ/ledger-live/pull/13450) [`74a7cc7`](https://github.com/LedgerHQ/ledger-live/commit/74a7cc75f35dc0961f2061a59fdd26bd56647e3f) Thanks [@dilaouid](https://github.com/dilaouid)! - chore: unskip scroll and blast scenarios

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b), [`7e12cd3`](https://github.com/LedgerHQ/ledger-live/commit/7e12cd30f47d42cd8dac35cfa475abdd9ad44e19), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`4455451`](https://github.com/LedgerHQ/ledger-live/commit/445545117cf0196d7c5a303df21041c23b91844c), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`54cd18e`](https://github.com/LedgerHQ/ledger-live/commit/54cd18e2d195dbc4779cf9046bc38c039a78122c), [`c5b6f4b`](https://github.com/LedgerHQ/ledger-live/commit/c5b6f4bee534213498f819f45c6fb7434f248943), [`3d30262`](https://github.com/LedgerHQ/ledger-live/commit/3d3026233072f4fab0dbcf6fee8153a75e295def), [`e57fa40`](https://github.com/LedgerHQ/ledger-live/commit/e57fa40a1bb480ebcc03120a1aab3b02e249bf8d), [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d), [`e844b3b`](https://github.com/LedgerHQ/ledger-live/commit/e844b3bd5f8a4b21cf94e0a598c22a2a42791490), [`1e5a7b0`](https://github.com/LedgerHQ/ledger-live/commit/1e5a7b0f1d9cb5769f0f481a90e6108834c6304e), [`67f89a7`](https://github.com/LedgerHQ/ledger-live/commit/67f89a710a0bdd9ae0df78708e1b297dd0100535), [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7), [`510d1be`](https://github.com/LedgerHQ/ledger-live/commit/510d1beba5c8ec0372eec5fabd1c02ab64693667), [`9e80ecc`](https://github.com/LedgerHQ/ledger-live/commit/9e80ecc5ef6da4f39a184d3c555c8d7c439754a8), [`e47e52a`](https://github.com/LedgerHQ/ledger-live/commit/e47e52a0c04a0a3ae7fa499da0962ec1c4fd4bb7), [`ffa9e7e`](https://github.com/LedgerHQ/ledger-live/commit/ffa9e7e58dd60d0f568362a95e14ba5d130c2d07), [`96a0821`](https://github.com/LedgerHQ/ledger-live/commit/96a08210ae9a40c9b4c39cdbb85acf742d43c3a4), [`4caf2ef`](https://github.com/LedgerHQ/ledger-live/commit/4caf2eff2aff2a6f1048ccf8e94295c954554ae1), [`b394f1d`](https://github.com/LedgerHQ/ledger-live/commit/b394f1ddca998a384d5e8032899d7f9a356cc4cc), [`a2aa565`](https://github.com/LedgerHQ/ledger-live/commit/a2aa565653bdddb86620b714c8e2e3066adb4975), [`c4045c7`](https://github.com/LedgerHQ/ledger-live/commit/c4045c714ee0fb1f02f6e75cae04e99cdea01ae4)]:
  - @ledgerhq/cryptoassets@13.36.0
  - @ledgerhq/coin-evm@2.38.0
  - @ledgerhq/live-common@34.56.0
  - @ledgerhq/coin-framework@6.12.0
  - @ledgerhq/types-live@6.92.0
  - @ledgerhq/live-config@3.4.0
  - @ledgerhq/coin-tester@0.15.0

## 1.13.0-next.3

### Patch Changes

- Updated dependencies [[`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b)]:
  - @ledgerhq/coin-evm@2.38.0-next.3
  - @ledgerhq/live-common@34.56.0-next.3
  - @ledgerhq/coin-framework@6.12.0-next.1

## 1.12.2

### Patch Changes

- Updated dependencies [[`48d299c`](https://github.com/LedgerHQ/ledger-live/commit/48d299c8ee3386f00b956b83a16df5c3fcfa908b), [`da30d1c`](https://github.com/LedgerHQ/ledger-live/commit/da30d1c86145b44d2e744b5aedd03a93fc75b067)]:
  - @ledgerhq/live-common@34.55.2

## 1.12.2-hotfix.1

### Patch Changes

- Updated dependencies [[`da30d1c`](https://github.com/LedgerHQ/ledger-live/commit/da30d1c86145b44d2e744b5aedd03a93fc75b067)]:
  - @ledgerhq/live-common@34.55.2-hotfix.1

## 1.12.2-hotfix.0

### Patch Changes

- Updated dependencies [[`48d299c`](https://github.com/LedgerHQ/ledger-live/commit/48d299c8ee3386f00b956b83a16df5c3fcfa908b)]:
  - @ledgerhq/live-common@34.55.2-hotfix.0

## 1.13.0-next.2

### Patch Changes

- Updated dependencies [[`a2aa565`](https://github.com/LedgerHQ/ledger-live/commit/a2aa565653bdddb86620b714c8e2e3066adb4975)]:
  - @ledgerhq/coin-evm@2.38.0-next.2
  - @ledgerhq/live-common@34.56.0-next.2

## 1.13.0-next.1

### Patch Changes

- Updated dependencies [[`3d30262`](https://github.com/LedgerHQ/ledger-live/commit/3d3026233072f4fab0dbcf6fee8153a75e295def)]:
  - @ledgerhq/coin-evm@2.38.0-next.1
  - @ledgerhq/live-common@34.56.0-next.1

## 1.13.0-next.0

### Minor Changes

- [#13355](https://github.com/LedgerHQ/ledger-live/pull/13355) [`66c6e29`](https://github.com/LedgerHQ/ledger-live/commit/66c6e29a50a2ed74a12bb641cd026ead65f85961) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use local signer instead of Speculos

- [#13468](https://github.com/LedgerHQ/ledger-live/pull/13468) [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Dedup MSW lib inside monorepo

- [#13450](https://github.com/LedgerHQ/ledger-live/pull/13450) [`74a7cc7`](https://github.com/LedgerHQ/ledger-live/commit/74a7cc75f35dc0961f2061a59fdd26bd56647e3f) Thanks [@dilaouid](https://github.com/dilaouid)! - chore: unskip scroll and blast scenarios

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`7e12cd3`](https://github.com/LedgerHQ/ledger-live/commit/7e12cd30f47d42cd8dac35cfa475abdd9ad44e19), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`4455451`](https://github.com/LedgerHQ/ledger-live/commit/445545117cf0196d7c5a303df21041c23b91844c), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`54cd18e`](https://github.com/LedgerHQ/ledger-live/commit/54cd18e2d195dbc4779cf9046bc38c039a78122c), [`c5b6f4b`](https://github.com/LedgerHQ/ledger-live/commit/c5b6f4bee534213498f819f45c6fb7434f248943), [`e57fa40`](https://github.com/LedgerHQ/ledger-live/commit/e57fa40a1bb480ebcc03120a1aab3b02e249bf8d), [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d), [`e844b3b`](https://github.com/LedgerHQ/ledger-live/commit/e844b3bd5f8a4b21cf94e0a598c22a2a42791490), [`1e5a7b0`](https://github.com/LedgerHQ/ledger-live/commit/1e5a7b0f1d9cb5769f0f481a90e6108834c6304e), [`67f89a7`](https://github.com/LedgerHQ/ledger-live/commit/67f89a710a0bdd9ae0df78708e1b297dd0100535), [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7), [`510d1be`](https://github.com/LedgerHQ/ledger-live/commit/510d1beba5c8ec0372eec5fabd1c02ab64693667), [`9e80ecc`](https://github.com/LedgerHQ/ledger-live/commit/9e80ecc5ef6da4f39a184d3c555c8d7c439754a8), [`e47e52a`](https://github.com/LedgerHQ/ledger-live/commit/e47e52a0c04a0a3ae7fa499da0962ec1c4fd4bb7), [`ffa9e7e`](https://github.com/LedgerHQ/ledger-live/commit/ffa9e7e58dd60d0f568362a95e14ba5d130c2d07), [`96a0821`](https://github.com/LedgerHQ/ledger-live/commit/96a08210ae9a40c9b4c39cdbb85acf742d43c3a4), [`4caf2ef`](https://github.com/LedgerHQ/ledger-live/commit/4caf2eff2aff2a6f1048ccf8e94295c954554ae1), [`b394f1d`](https://github.com/LedgerHQ/ledger-live/commit/b394f1ddca998a384d5e8032899d7f9a356cc4cc), [`c4045c7`](https://github.com/LedgerHQ/ledger-live/commit/c4045c714ee0fb1f02f6e75cae04e99cdea01ae4)]:
  - @ledgerhq/cryptoassets@13.36.0-next.0
  - @ledgerhq/types-live@6.92.0-next.0
  - @ledgerhq/live-common@34.56.0-next.0
  - @ledgerhq/live-config@3.4.0-next.0
  - @ledgerhq/coin-evm@2.38.0-next.0
  - @ledgerhq/coin-tester@0.15.0-next.0
  - @ledgerhq/coin-framework@6.11.2-next.0

## 1.12.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.55.1
  - @ledgerhq/types-live@6.91.1
  - @ledgerhq/coin-framework@6.11.1
  - @ledgerhq/coin-evm@2.37.1
  - @ledgerhq/coin-tester@0.14.0
  - @ledgerhq/cryptoassets@13.35.1

## 1.12.1-hotfix.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.55.1-hotfix.1
  - @ledgerhq/types-live@6.91.1-hotfix.0
  - @ledgerhq/coin-framework@6.11.1-hotfix.0
  - @ledgerhq/coin-evm@2.37.1-hotfix.0
  - @ledgerhq/coin-tester@0.14.0
  - @ledgerhq/cryptoassets@13.35.1-hotfix.0

## 1.12.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.55.1-hotfix.0

## 1.12.0

### Minor Changes

- [#12038](https://github.com/LedgerHQ/ledger-live/pull/12038) [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): remove EVM bridge

### Patch Changes

- Updated dependencies [[`3c69290`](https://github.com/LedgerHQ/ledger-live/commit/3c69290e4251c33c87e56a6e805812eabe0d1d05), [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`19a54fd`](https://github.com/LedgerHQ/ledger-live/commit/19a54fd89a2d3c7481aebc28817870875f9d44dc), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`2ec1cda`](https://github.com/LedgerHQ/ledger-live/commit/2ec1cda3dcb4d794a5298f46d57d33faf8630993), [`a52e230`](https://github.com/LedgerHQ/ledger-live/commit/a52e230ad1be2186ada6be4e07032a08008ebb42), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`ef276b7`](https://github.com/LedgerHQ/ledger-live/commit/ef276b7654ab32c7253ee812ceac3f89316ded4b), [`2971a26`](https://github.com/LedgerHQ/ledger-live/commit/2971a2678978b35fc3a242de330e8e3a3b3edbc0), [`37250b3`](https://github.com/LedgerHQ/ledger-live/commit/37250b3f2ba545a6a5ce9ca41f7de7919bf0e6aa), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`ae14fbe`](https://github.com/LedgerHQ/ledger-live/commit/ae14fbeb0125519fc3f579926c99c64d6ebfc212), [`95e6faa`](https://github.com/LedgerHQ/ledger-live/commit/95e6faaca185819ff05fe9e5f02f84722d123e17), [`e63ebdd`](https://github.com/LedgerHQ/ledger-live/commit/e63ebdd7a0463cebeb72541271342cef4eb3fb73), [`48175fa`](https://github.com/LedgerHQ/ledger-live/commit/48175fa38e438fe406595da1df33b82a37b8af61), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`57b711d`](https://github.com/LedgerHQ/ledger-live/commit/57b711db894454d06db02a8179a3b756943f5a90), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`1bfacd9`](https://github.com/LedgerHQ/ledger-live/commit/1bfacd92e01f3bea98518a91d6be4f190e9bdd17), [`6f58f8e`](https://github.com/LedgerHQ/ledger-live/commit/6f58f8e9dbd560538a873a22e94b5ba83c268d26), [`4d9f37b`](https://github.com/LedgerHQ/ledger-live/commit/4d9f37bfeaec1ca1659b497e8281da8f4cc5a418), [`e644806`](https://github.com/LedgerHQ/ledger-live/commit/e644806ff2ab6766bba055f6d46b60988c58a5f6), [`450f518`](https://github.com/LedgerHQ/ledger-live/commit/450f518d4cedb828c5fe1e7ccffaabd483f53226), [`adbabc7`](https://github.com/LedgerHQ/ledger-live/commit/adbabc7d3b7ed8915503120a027d19304adc1fc8), [`edb90d0`](https://github.com/LedgerHQ/ledger-live/commit/edb90d024a9cc58801c26e56ff1d0c52bb295b52), [`d63aa77`](https://github.com/LedgerHQ/ledger-live/commit/d63aa775f6c2b25a4194624ca7392f472d71c7d2), [`bbd86c2`](https://github.com/LedgerHQ/ledger-live/commit/bbd86c2698a1f9a698d01b4e91730c405d780617), [`30be235`](https://github.com/LedgerHQ/ledger-live/commit/30be2354822b3497c69322294ff1dab43375be50), [`ac82441`](https://github.com/LedgerHQ/ledger-live/commit/ac824414e167adc3b7fedaa397832e5b41d5f5c7), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`e5fcc06`](https://github.com/LedgerHQ/ledger-live/commit/e5fcc06ed709cca26842b7e3a49f99f355b5da83), [`378d22a`](https://github.com/LedgerHQ/ledger-live/commit/378d22a3f748e1c53fb1fda5ee1f87c259085ab6), [`0924eed`](https://github.com/LedgerHQ/ledger-live/commit/0924eed6a633793999e8657076140523e30ae40b), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`768718d`](https://github.com/LedgerHQ/ledger-live/commit/768718df029bc8799b88c0299925dc56302b0c53), [`3120048`](https://github.com/LedgerHQ/ledger-live/commit/3120048eb81a05a25aa94f92816a810e7f0088e4), [`a5ad7d4`](https://github.com/LedgerHQ/ledger-live/commit/a5ad7d4578c06db3e40f260451b644c27e20cb62), [`729296d`](https://github.com/LedgerHQ/ledger-live/commit/729296d4a351b46fd72891fb801ecbb1b21a36b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4), [`05fac00`](https://github.com/LedgerHQ/ledger-live/commit/05fac007cf1d32822b0ec68098cbc5e2e7f5a231), [`472a715`](https://github.com/LedgerHQ/ledger-live/commit/472a715b9889a9b93bfdc372a8e9ea76374adb22), [`5ebc859`](https://github.com/LedgerHQ/ledger-live/commit/5ebc85967bd07caa55b1b51bfe5c72e97d68b004), [`9f82b1e`](https://github.com/LedgerHQ/ledger-live/commit/9f82b1e6c807fe627ec2ae8103021b1054afd237), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`e714561`](https://github.com/LedgerHQ/ledger-live/commit/e7145618c4d00e00aa7b88521c3aa343fb8ccb80), [`07de7a8`](https://github.com/LedgerHQ/ledger-live/commit/07de7a87415ae4d1126e751d6a4d521ced3065e3), [`d37fa4b`](https://github.com/LedgerHQ/ledger-live/commit/d37fa4baf4534161bffe5033ce44fc7780c79d89), [`e3ea2a3`](https://github.com/LedgerHQ/ledger-live/commit/e3ea2a393c93e7baec4f450fa2c0de5b3caff138), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`4fda9b7`](https://github.com/LedgerHQ/ledger-live/commit/4fda9b727e83db9c3b940793d8c19060f32f921c), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b), [`2c2e0f5`](https://github.com/LedgerHQ/ledger-live/commit/2c2e0f5c1c5533eaf4737310aec9c890a2081fcb), [`2d9f320`](https://github.com/LedgerHQ/ledger-live/commit/2d9f32087eea12ae9d5ea2347b277b8bf4e60f55), [`c56ab86`](https://github.com/LedgerHQ/ledger-live/commit/c56ab86ab65597caf87a09b7596faa54f3104bd4), [`ac82441`](https://github.com/LedgerHQ/ledger-live/commit/ac824414e167adc3b7fedaa397832e5b41d5f5c7), [`3df28e8`](https://github.com/LedgerHQ/ledger-live/commit/3df28e86de7cd4a8677ea3206d000d1a19a2cc0b), [`de306ce`](https://github.com/LedgerHQ/ledger-live/commit/de306ce2dd2f59760db8f6b97363597d83e278b9), [`ad2913d`](https://github.com/LedgerHQ/ledger-live/commit/ad2913df3f3be5b674c3cc2604d50f8080c2d22f), [`fb3631e`](https://github.com/LedgerHQ/ledger-live/commit/fb3631ef74e9f10fea15fd7daf812306f6d2bc07), [`2681620`](https://github.com/LedgerHQ/ledger-live/commit/2681620460f09613f540da5e25cc8ccb5a785da8)]:
  - @ledgerhq/live-common@34.55.0
  - @ledgerhq/coin-evm@2.37.0
  - @ledgerhq/coin-framework@6.11.0
  - @ledgerhq/types-live@6.91.0
  - @ledgerhq/cryptoassets@13.35.0
  - @ledgerhq/live-config@3.3.0
  - @ledgerhq/coin-tester@0.14.0
  - @ledgerhq/types-cryptoassets@7.31.0

## 1.12.0-next.0

### Minor Changes

- [#12038](https://github.com/LedgerHQ/ledger-live/pull/12038) [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): remove EVM bridge

### Patch Changes

- Updated dependencies [[`3c69290`](https://github.com/LedgerHQ/ledger-live/commit/3c69290e4251c33c87e56a6e805812eabe0d1d05), [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`19a54fd`](https://github.com/LedgerHQ/ledger-live/commit/19a54fd89a2d3c7481aebc28817870875f9d44dc), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`2ec1cda`](https://github.com/LedgerHQ/ledger-live/commit/2ec1cda3dcb4d794a5298f46d57d33faf8630993), [`a52e230`](https://github.com/LedgerHQ/ledger-live/commit/a52e230ad1be2186ada6be4e07032a08008ebb42), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`ef276b7`](https://github.com/LedgerHQ/ledger-live/commit/ef276b7654ab32c7253ee812ceac3f89316ded4b), [`2971a26`](https://github.com/LedgerHQ/ledger-live/commit/2971a2678978b35fc3a242de330e8e3a3b3edbc0), [`37250b3`](https://github.com/LedgerHQ/ledger-live/commit/37250b3f2ba545a6a5ce9ca41f7de7919bf0e6aa), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`ae14fbe`](https://github.com/LedgerHQ/ledger-live/commit/ae14fbeb0125519fc3f579926c99c64d6ebfc212), [`95e6faa`](https://github.com/LedgerHQ/ledger-live/commit/95e6faaca185819ff05fe9e5f02f84722d123e17), [`e63ebdd`](https://github.com/LedgerHQ/ledger-live/commit/e63ebdd7a0463cebeb72541271342cef4eb3fb73), [`48175fa`](https://github.com/LedgerHQ/ledger-live/commit/48175fa38e438fe406595da1df33b82a37b8af61), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`57b711d`](https://github.com/LedgerHQ/ledger-live/commit/57b711db894454d06db02a8179a3b756943f5a90), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`1bfacd9`](https://github.com/LedgerHQ/ledger-live/commit/1bfacd92e01f3bea98518a91d6be4f190e9bdd17), [`6f58f8e`](https://github.com/LedgerHQ/ledger-live/commit/6f58f8e9dbd560538a873a22e94b5ba83c268d26), [`4d9f37b`](https://github.com/LedgerHQ/ledger-live/commit/4d9f37bfeaec1ca1659b497e8281da8f4cc5a418), [`e644806`](https://github.com/LedgerHQ/ledger-live/commit/e644806ff2ab6766bba055f6d46b60988c58a5f6), [`450f518`](https://github.com/LedgerHQ/ledger-live/commit/450f518d4cedb828c5fe1e7ccffaabd483f53226), [`adbabc7`](https://github.com/LedgerHQ/ledger-live/commit/adbabc7d3b7ed8915503120a027d19304adc1fc8), [`edb90d0`](https://github.com/LedgerHQ/ledger-live/commit/edb90d024a9cc58801c26e56ff1d0c52bb295b52), [`d63aa77`](https://github.com/LedgerHQ/ledger-live/commit/d63aa775f6c2b25a4194624ca7392f472d71c7d2), [`bbd86c2`](https://github.com/LedgerHQ/ledger-live/commit/bbd86c2698a1f9a698d01b4e91730c405d780617), [`30be235`](https://github.com/LedgerHQ/ledger-live/commit/30be2354822b3497c69322294ff1dab43375be50), [`ac82441`](https://github.com/LedgerHQ/ledger-live/commit/ac824414e167adc3b7fedaa397832e5b41d5f5c7), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`e5fcc06`](https://github.com/LedgerHQ/ledger-live/commit/e5fcc06ed709cca26842b7e3a49f99f355b5da83), [`378d22a`](https://github.com/LedgerHQ/ledger-live/commit/378d22a3f748e1c53fb1fda5ee1f87c259085ab6), [`0924eed`](https://github.com/LedgerHQ/ledger-live/commit/0924eed6a633793999e8657076140523e30ae40b), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`768718d`](https://github.com/LedgerHQ/ledger-live/commit/768718df029bc8799b88c0299925dc56302b0c53), [`3120048`](https://github.com/LedgerHQ/ledger-live/commit/3120048eb81a05a25aa94f92816a810e7f0088e4), [`a5ad7d4`](https://github.com/LedgerHQ/ledger-live/commit/a5ad7d4578c06db3e40f260451b644c27e20cb62), [`729296d`](https://github.com/LedgerHQ/ledger-live/commit/729296d4a351b46fd72891fb801ecbb1b21a36b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4), [`05fac00`](https://github.com/LedgerHQ/ledger-live/commit/05fac007cf1d32822b0ec68098cbc5e2e7f5a231), [`472a715`](https://github.com/LedgerHQ/ledger-live/commit/472a715b9889a9b93bfdc372a8e9ea76374adb22), [`5ebc859`](https://github.com/LedgerHQ/ledger-live/commit/5ebc85967bd07caa55b1b51bfe5c72e97d68b004), [`9f82b1e`](https://github.com/LedgerHQ/ledger-live/commit/9f82b1e6c807fe627ec2ae8103021b1054afd237), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`e714561`](https://github.com/LedgerHQ/ledger-live/commit/e7145618c4d00e00aa7b88521c3aa343fb8ccb80), [`07de7a8`](https://github.com/LedgerHQ/ledger-live/commit/07de7a87415ae4d1126e751d6a4d521ced3065e3), [`d37fa4b`](https://github.com/LedgerHQ/ledger-live/commit/d37fa4baf4534161bffe5033ce44fc7780c79d89), [`e3ea2a3`](https://github.com/LedgerHQ/ledger-live/commit/e3ea2a393c93e7baec4f450fa2c0de5b3caff138), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`4fda9b7`](https://github.com/LedgerHQ/ledger-live/commit/4fda9b727e83db9c3b940793d8c19060f32f921c), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b), [`2c2e0f5`](https://github.com/LedgerHQ/ledger-live/commit/2c2e0f5c1c5533eaf4737310aec9c890a2081fcb), [`2d9f320`](https://github.com/LedgerHQ/ledger-live/commit/2d9f32087eea12ae9d5ea2347b277b8bf4e60f55), [`c56ab86`](https://github.com/LedgerHQ/ledger-live/commit/c56ab86ab65597caf87a09b7596faa54f3104bd4), [`ac82441`](https://github.com/LedgerHQ/ledger-live/commit/ac824414e167adc3b7fedaa397832e5b41d5f5c7), [`3df28e8`](https://github.com/LedgerHQ/ledger-live/commit/3df28e86de7cd4a8677ea3206d000d1a19a2cc0b), [`de306ce`](https://github.com/LedgerHQ/ledger-live/commit/de306ce2dd2f59760db8f6b97363597d83e278b9), [`ad2913d`](https://github.com/LedgerHQ/ledger-live/commit/ad2913df3f3be5b674c3cc2604d50f8080c2d22f), [`fb3631e`](https://github.com/LedgerHQ/ledger-live/commit/fb3631ef74e9f10fea15fd7daf812306f6d2bc07), [`2681620`](https://github.com/LedgerHQ/ledger-live/commit/2681620460f09613f540da5e25cc8ccb5a785da8)]:
  - @ledgerhq/live-common@34.55.0-next.0
  - @ledgerhq/coin-evm@2.37.0-next.0
  - @ledgerhq/coin-framework@6.11.0-next.0
  - @ledgerhq/types-live@6.91.0-next.0
  - @ledgerhq/cryptoassets@13.35.0-next.0
  - @ledgerhq/live-config@3.3.0-next.0
  - @ledgerhq/coin-tester@0.14.0-next.0
  - @ledgerhq/types-cryptoassets@7.31.0-next.0

## 1.11.2

### Patch Changes

- Updated dependencies [[`91d1c29`](https://github.com/LedgerHQ/ledger-live/commit/91d1c2971981fd13406cb227c4dd237fe2ccadb0), [`001760d`](https://github.com/LedgerHQ/ledger-live/commit/001760d084c25e0f7460a1415ae057753486b858), [`b68b749`](https://github.com/LedgerHQ/ledger-live/commit/b68b749b53c9583dd983ab057faa89fced1e541e), [`6769a36`](https://github.com/LedgerHQ/ledger-live/commit/6769a36c18cb7453c93b2a5d8dec3e1e1725cd20), [`879bf34`](https://github.com/LedgerHQ/ledger-live/commit/879bf3445a67b3a1f31dac9fddf20f557d59786b)]:
  - @ledgerhq/live-common@34.54.1
  - @ledgerhq/coin-framework@6.10.1
  - @ledgerhq/coin-evm@2.36.1
  - @ledgerhq/cryptoassets@13.34.1
  - @ledgerhq/live-signer-evm@0.10.3
  - @ledgerhq/coin-tester@0.13.1

## 1.11.2-hotfix.1

### Patch Changes

- Updated dependencies [[`001760d`](https://github.com/LedgerHQ/ledger-live/commit/001760d084c25e0f7460a1415ae057753486b858), [`6769a36`](https://github.com/LedgerHQ/ledger-live/commit/6769a36c18cb7453c93b2a5d8dec3e1e1725cd20), [`879bf34`](https://github.com/LedgerHQ/ledger-live/commit/879bf3445a67b3a1f31dac9fddf20f557d59786b)]:
  - @ledgerhq/live-common@34.54.1-hotfix.1

## 1.11.2-hotfix.0

### Patch Changes

- Updated dependencies [[`91d1c29`](https://github.com/LedgerHQ/ledger-live/commit/91d1c2971981fd13406cb227c4dd237fe2ccadb0), [`b68b749`](https://github.com/LedgerHQ/ledger-live/commit/b68b749b53c9583dd983ab057faa89fced1e541e)]:
  - @ledgerhq/live-common@34.54.1-hotfix.0
  - @ledgerhq/coin-framework@6.10.1-hotfix.0
  - @ledgerhq/coin-evm@2.36.1-hotfix.0
  - @ledgerhq/cryptoassets@13.34.1-hotfix.0
  - @ledgerhq/live-signer-evm@0.10.3-hotfix.0
  - @ledgerhq/coin-tester@0.13.1-hotfix.0

## 1.11.1

### Patch Changes

- Updated dependencies [[`50aeea1`](https://github.com/LedgerHQ/ledger-live/commit/50aeea1233056e9abff9568eb928927f39e76cff), [`9be4b9f`](https://github.com/LedgerHQ/ledger-live/commit/9be4b9fcd7d01b600561302113654b17854856ab), [`fd031d7`](https://github.com/LedgerHQ/ledger-live/commit/fd031d77ca7ed011ec492700fd4d7bc86c518907), [`39b27b3`](https://github.com/LedgerHQ/ledger-live/commit/39b27b32b293c8c9f218fe82dfaa082273eb5210), [`1236aa4`](https://github.com/LedgerHQ/ledger-live/commit/1236aa439a5ea02450ea576b31960e2eea0b0489), [`2b8c44b`](https://github.com/LedgerHQ/ledger-live/commit/2b8c44b41fed4b1df1f9c99fdb45b87429493838), [`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`e6a0ea2`](https://github.com/LedgerHQ/ledger-live/commit/e6a0ea2cc2ef00d4b15596e1173598c013ef6bed), [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`67137eb`](https://github.com/LedgerHQ/ledger-live/commit/67137eb5d7f04dd5f3610fdaa4e463d292654105), [`21daeb0`](https://github.com/LedgerHQ/ledger-live/commit/21daeb0b42ef7bb6248ff3e6483a8b4e4a820f18), [`3e0c113`](https://github.com/LedgerHQ/ledger-live/commit/3e0c1137e8e2c34fab711aa76591c10ad491ce5a), [`49ef24c`](https://github.com/LedgerHQ/ledger-live/commit/49ef24cbd1948bfd146af0b20f2128951b2dc170), [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3), [`927ae64`](https://github.com/LedgerHQ/ledger-live/commit/927ae64db0bb04af54e25623655a001a68e0f2d3), [`613d7df`](https://github.com/LedgerHQ/ledger-live/commit/613d7dfba820cf4b1c262a73dc2e47da658b0240), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`9251b77`](https://github.com/LedgerHQ/ledger-live/commit/9251b77fcb01709723842f19220a2a41a6fc8f3b), [`02ef98f`](https://github.com/LedgerHQ/ledger-live/commit/02ef98faeb13c182ef255e06a43c39abeb55ecc7), [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009), [`3b96db0`](https://github.com/LedgerHQ/ledger-live/commit/3b96db07eb1f06f01d43d27426b4f4fe80eaefff), [`2a00837`](https://github.com/LedgerHQ/ledger-live/commit/2a00837e7e69ed840dc6342f558d812d2869bda1), [`364d4ed`](https://github.com/LedgerHQ/ledger-live/commit/364d4ed5099087eea580399b4e8e6a83aa761f16), [`38d5880`](https://github.com/LedgerHQ/ledger-live/commit/38d5880ca6c3cc8808182e9d0f046b204914d34a), [`0d33751`](https://github.com/LedgerHQ/ledger-live/commit/0d33751bb2ae599d0d26ce6a8efdbe01757f12fb), [`bf6f5d3`](https://github.com/LedgerHQ/ledger-live/commit/bf6f5d39cf752138741d16b246d1bc322426f9e5), [`aadcec6`](https://github.com/LedgerHQ/ledger-live/commit/aadcec66847b800f79452ba1df09149e0a1cb9e8), [`4821cb8`](https://github.com/LedgerHQ/ledger-live/commit/4821cb80c4582ca8ad6a613bf6673a6c9d307afa), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045), [`ed8532b`](https://github.com/LedgerHQ/ledger-live/commit/ed8532bad754ca2b5f1788c6e92f4646b775ec79), [`46dcbfa`](https://github.com/LedgerHQ/ledger-live/commit/46dcbfa758f929e583b5c5eb119a0c560073f01c), [`88a5018`](https://github.com/LedgerHQ/ledger-live/commit/88a501871d58c980f18495b5b32012a3eaa9ab2c), [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856), [`d02914b`](https://github.com/LedgerHQ/ledger-live/commit/d02914bd12cadcff4720dd77d05dc5b4665aae6f), [`aae83b9`](https://github.com/LedgerHQ/ledger-live/commit/aae83b968a6cc3a4bba17924091eebd2fdcfbb24), [`518f53b`](https://github.com/LedgerHQ/ledger-live/commit/518f53b9d5e09ed652f4089498244892f10f99c6), [`e37c057`](https://github.com/LedgerHQ/ledger-live/commit/e37c057e66b71d25fbcef48c07adfb08253bbf64), [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d)]:
  - @ledgerhq/cryptoassets@13.34.0
  - @ledgerhq/live-common@34.54.0
  - @ledgerhq/types-live@6.90.0
  - @ledgerhq/coin-framework@6.10.0
  - @ledgerhq/coin-evm@2.36.0
  - @ledgerhq/coin-tester@0.13.0
  - @ledgerhq/live-signer-evm@0.10.2

## 1.11.1-next.0

### Patch Changes

- Updated dependencies [[`50aeea1`](https://github.com/LedgerHQ/ledger-live/commit/50aeea1233056e9abff9568eb928927f39e76cff), [`9be4b9f`](https://github.com/LedgerHQ/ledger-live/commit/9be4b9fcd7d01b600561302113654b17854856ab), [`fd031d7`](https://github.com/LedgerHQ/ledger-live/commit/fd031d77ca7ed011ec492700fd4d7bc86c518907), [`39b27b3`](https://github.com/LedgerHQ/ledger-live/commit/39b27b32b293c8c9f218fe82dfaa082273eb5210), [`1236aa4`](https://github.com/LedgerHQ/ledger-live/commit/1236aa439a5ea02450ea576b31960e2eea0b0489), [`2b8c44b`](https://github.com/LedgerHQ/ledger-live/commit/2b8c44b41fed4b1df1f9c99fdb45b87429493838), [`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`e6a0ea2`](https://github.com/LedgerHQ/ledger-live/commit/e6a0ea2cc2ef00d4b15596e1173598c013ef6bed), [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`67137eb`](https://github.com/LedgerHQ/ledger-live/commit/67137eb5d7f04dd5f3610fdaa4e463d292654105), [`21daeb0`](https://github.com/LedgerHQ/ledger-live/commit/21daeb0b42ef7bb6248ff3e6483a8b4e4a820f18), [`3e0c113`](https://github.com/LedgerHQ/ledger-live/commit/3e0c1137e8e2c34fab711aa76591c10ad491ce5a), [`49ef24c`](https://github.com/LedgerHQ/ledger-live/commit/49ef24cbd1948bfd146af0b20f2128951b2dc170), [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3), [`927ae64`](https://github.com/LedgerHQ/ledger-live/commit/927ae64db0bb04af54e25623655a001a68e0f2d3), [`613d7df`](https://github.com/LedgerHQ/ledger-live/commit/613d7dfba820cf4b1c262a73dc2e47da658b0240), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`9251b77`](https://github.com/LedgerHQ/ledger-live/commit/9251b77fcb01709723842f19220a2a41a6fc8f3b), [`02ef98f`](https://github.com/LedgerHQ/ledger-live/commit/02ef98faeb13c182ef255e06a43c39abeb55ecc7), [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009), [`3b96db0`](https://github.com/LedgerHQ/ledger-live/commit/3b96db07eb1f06f01d43d27426b4f4fe80eaefff), [`2a00837`](https://github.com/LedgerHQ/ledger-live/commit/2a00837e7e69ed840dc6342f558d812d2869bda1), [`364d4ed`](https://github.com/LedgerHQ/ledger-live/commit/364d4ed5099087eea580399b4e8e6a83aa761f16), [`38d5880`](https://github.com/LedgerHQ/ledger-live/commit/38d5880ca6c3cc8808182e9d0f046b204914d34a), [`0d33751`](https://github.com/LedgerHQ/ledger-live/commit/0d33751bb2ae599d0d26ce6a8efdbe01757f12fb), [`bf6f5d3`](https://github.com/LedgerHQ/ledger-live/commit/bf6f5d39cf752138741d16b246d1bc322426f9e5), [`aadcec6`](https://github.com/LedgerHQ/ledger-live/commit/aadcec66847b800f79452ba1df09149e0a1cb9e8), [`4821cb8`](https://github.com/LedgerHQ/ledger-live/commit/4821cb80c4582ca8ad6a613bf6673a6c9d307afa), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045), [`ed8532b`](https://github.com/LedgerHQ/ledger-live/commit/ed8532bad754ca2b5f1788c6e92f4646b775ec79), [`46dcbfa`](https://github.com/LedgerHQ/ledger-live/commit/46dcbfa758f929e583b5c5eb119a0c560073f01c), [`88a5018`](https://github.com/LedgerHQ/ledger-live/commit/88a501871d58c980f18495b5b32012a3eaa9ab2c), [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856), [`d02914b`](https://github.com/LedgerHQ/ledger-live/commit/d02914bd12cadcff4720dd77d05dc5b4665aae6f), [`aae83b9`](https://github.com/LedgerHQ/ledger-live/commit/aae83b968a6cc3a4bba17924091eebd2fdcfbb24), [`518f53b`](https://github.com/LedgerHQ/ledger-live/commit/518f53b9d5e09ed652f4089498244892f10f99c6), [`e37c057`](https://github.com/LedgerHQ/ledger-live/commit/e37c057e66b71d25fbcef48c07adfb08253bbf64), [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d)]:
  - @ledgerhq/cryptoassets@13.34.0-next.0
  - @ledgerhq/live-common@34.54.0-next.0
  - @ledgerhq/types-live@6.90.0-next.0
  - @ledgerhq/coin-framework@6.10.0-next.0
  - @ledgerhq/coin-evm@2.36.0-next.0
  - @ledgerhq/coin-tester@0.13.0-next.0
  - @ledgerhq/live-signer-evm@0.10.2-next.0

## 1.11.0

### Minor Changes

- [#12248](https://github.com/LedgerHQ/ledger-live/pull/12248) [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): dynamically adjust transaction type

- [#12884](https://github.com/LedgerHQ/ledger-live/pull/12884) [`20b83c7`](https://github.com/LedgerHQ/ledger-live/commit/20b83c71a0a73c506a85ce4c93483ae6878e2bde) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Yoot token ID

### Patch Changes

- Updated dependencies [[`bba0818`](https://github.com/LedgerHQ/ledger-live/commit/bba0818d91913ac8b45b9638792a28b36e02f48d), [`8c5966e`](https://github.com/LedgerHQ/ledger-live/commit/8c5966ebbf04e9e4ce48b8fcba5de391252eb921), [`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c), [`b2780c4`](https://github.com/LedgerHQ/ledger-live/commit/b2780c42aa9dbc38709b4254a14c792913464637), [`8422b37`](https://github.com/LedgerHQ/ledger-live/commit/8422b376ac66bd43e3f70578b441fb7d3e95e9ff), [`a6bc24e`](https://github.com/LedgerHQ/ledger-live/commit/a6bc24ee988b98bf82f807ac5ce731ba79813901), [`ddffd48`](https://github.com/LedgerHQ/ledger-live/commit/ddffd4836cc916018e96dd7373543dcdb20334e0), [`cccee0b`](https://github.com/LedgerHQ/ledger-live/commit/cccee0b8d76851abadbf8d2aa97c72454b749a1d), [`b69c97d`](https://github.com/LedgerHQ/ledger-live/commit/b69c97d979ba97154c9abfda6abfc2a36becee4f), [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9), [`b80ae2a`](https://github.com/LedgerHQ/ledger-live/commit/b80ae2a43a0b6831afbca248e95142ced7e4dc01), [`5cd6964`](https://github.com/LedgerHQ/ledger-live/commit/5cd69649120a86328ce7943f4b54d84ce6426238), [`9a8d4ba`](https://github.com/LedgerHQ/ledger-live/commit/9a8d4ba540372a2b901186f711dbfd005d17ca42), [`1c6f5f5`](https://github.com/LedgerHQ/ledger-live/commit/1c6f5f5843349b1955f7ca466f98cbe4ffcdaddf), [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044), [`d5d838a`](https://github.com/LedgerHQ/ledger-live/commit/d5d838a23e00edd53293843781c559c41db4e854), [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515), [`479abcc`](https://github.com/LedgerHQ/ledger-live/commit/479abcc77310297226726271d3bdad7668a084ee), [`1b12223`](https://github.com/LedgerHQ/ledger-live/commit/1b1222391d351698710d23e3245a1a7b61566d90), [`938b970`](https://github.com/LedgerHQ/ledger-live/commit/938b970e15118dc706c759a3bec27dc01c3dd268), [`c40e9da`](https://github.com/LedgerHQ/ledger-live/commit/c40e9da68452fe9827b9435ff2d162291186be73), [`7acca7b`](https://github.com/LedgerHQ/ledger-live/commit/7acca7b3f8db4f0c1d2bdbeb0722c88923b0e5ea), [`c0b5b9f`](https://github.com/LedgerHQ/ledger-live/commit/c0b5b9f4cdcb2ea3e15419cbf3d1a14f725c3e6a), [`f78d6ff`](https://github.com/LedgerHQ/ledger-live/commit/f78d6ff46551a8d45b42d8d878b3dcbc96596b2f), [`48ad785`](https://github.com/LedgerHQ/ledger-live/commit/48ad785ce6f7f8fef27157b611e8c8e6e91bfe7e), [`3e54d84`](https://github.com/LedgerHQ/ledger-live/commit/3e54d8442ecd95fd9cbaf140f80c4173b82cc152), [`70049be`](https://github.com/LedgerHQ/ledger-live/commit/70049bed0cd0a8c7a9e4947a63af82061dad46c0), [`ded9965`](https://github.com/LedgerHQ/ledger-live/commit/ded99658228c6ee46c70d6f32563c2c92f4f0565), [`4232a4c`](https://github.com/LedgerHQ/ledger-live/commit/4232a4cbef7e77082ff8ecbd3f2da9c22559c2de), [`5b41dd5`](https://github.com/LedgerHQ/ledger-live/commit/5b41dd56e024a5d03ba0e49084113c04887395db), [`e686e2e`](https://github.com/LedgerHQ/ledger-live/commit/e686e2e54eb7b6cc166e36883c1de722108285ef), [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec), [`af47f52`](https://github.com/LedgerHQ/ledger-live/commit/af47f52290f0a140744cea4cb99649e0a47ef54e), [`c70f6a8`](https://github.com/LedgerHQ/ledger-live/commit/c70f6a8370056b6fd8f236205471359d6f9b846f)]:
  - @ledgerhq/live-common@34.53.0
  - @ledgerhq/types-live@6.89.0
  - @ledgerhq/cryptoassets@13.33.0
  - @ledgerhq/coin-framework@6.9.0
  - @ledgerhq/coin-evm@2.35.0
  - @ledgerhq/coin-tester@0.12.0
  - @ledgerhq/live-signer-evm@0.10.1

## 1.11.0-next.1

### Minor Changes

- [#12884](https://github.com/LedgerHQ/ledger-live/pull/12884) [`20b83c7`](https://github.com/LedgerHQ/ledger-live/commit/20b83c71a0a73c506a85ce4c93483ae6878e2bde) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Yoot token ID

## 1.11.0-next.0

### Minor Changes

- [#12248](https://github.com/LedgerHQ/ledger-live/pull/12248) [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): dynamically adjust transaction type

### Patch Changes

- Updated dependencies [[`bba0818`](https://github.com/LedgerHQ/ledger-live/commit/bba0818d91913ac8b45b9638792a28b36e02f48d), [`8c5966e`](https://github.com/LedgerHQ/ledger-live/commit/8c5966ebbf04e9e4ce48b8fcba5de391252eb921), [`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c), [`b2780c4`](https://github.com/LedgerHQ/ledger-live/commit/b2780c42aa9dbc38709b4254a14c792913464637), [`8422b37`](https://github.com/LedgerHQ/ledger-live/commit/8422b376ac66bd43e3f70578b441fb7d3e95e9ff), [`a6bc24e`](https://github.com/LedgerHQ/ledger-live/commit/a6bc24ee988b98bf82f807ac5ce731ba79813901), [`ddffd48`](https://github.com/LedgerHQ/ledger-live/commit/ddffd4836cc916018e96dd7373543dcdb20334e0), [`cccee0b`](https://github.com/LedgerHQ/ledger-live/commit/cccee0b8d76851abadbf8d2aa97c72454b749a1d), [`b69c97d`](https://github.com/LedgerHQ/ledger-live/commit/b69c97d979ba97154c9abfda6abfc2a36becee4f), [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9), [`b80ae2a`](https://github.com/LedgerHQ/ledger-live/commit/b80ae2a43a0b6831afbca248e95142ced7e4dc01), [`5cd6964`](https://github.com/LedgerHQ/ledger-live/commit/5cd69649120a86328ce7943f4b54d84ce6426238), [`9a8d4ba`](https://github.com/LedgerHQ/ledger-live/commit/9a8d4ba540372a2b901186f711dbfd005d17ca42), [`1c6f5f5`](https://github.com/LedgerHQ/ledger-live/commit/1c6f5f5843349b1955f7ca466f98cbe4ffcdaddf), [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044), [`d5d838a`](https://github.com/LedgerHQ/ledger-live/commit/d5d838a23e00edd53293843781c559c41db4e854), [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515), [`479abcc`](https://github.com/LedgerHQ/ledger-live/commit/479abcc77310297226726271d3bdad7668a084ee), [`1b12223`](https://github.com/LedgerHQ/ledger-live/commit/1b1222391d351698710d23e3245a1a7b61566d90), [`938b970`](https://github.com/LedgerHQ/ledger-live/commit/938b970e15118dc706c759a3bec27dc01c3dd268), [`c40e9da`](https://github.com/LedgerHQ/ledger-live/commit/c40e9da68452fe9827b9435ff2d162291186be73), [`7acca7b`](https://github.com/LedgerHQ/ledger-live/commit/7acca7b3f8db4f0c1d2bdbeb0722c88923b0e5ea), [`c0b5b9f`](https://github.com/LedgerHQ/ledger-live/commit/c0b5b9f4cdcb2ea3e15419cbf3d1a14f725c3e6a), [`f78d6ff`](https://github.com/LedgerHQ/ledger-live/commit/f78d6ff46551a8d45b42d8d878b3dcbc96596b2f), [`48ad785`](https://github.com/LedgerHQ/ledger-live/commit/48ad785ce6f7f8fef27157b611e8c8e6e91bfe7e), [`3e54d84`](https://github.com/LedgerHQ/ledger-live/commit/3e54d8442ecd95fd9cbaf140f80c4173b82cc152), [`70049be`](https://github.com/LedgerHQ/ledger-live/commit/70049bed0cd0a8c7a9e4947a63af82061dad46c0), [`ded9965`](https://github.com/LedgerHQ/ledger-live/commit/ded99658228c6ee46c70d6f32563c2c92f4f0565), [`4232a4c`](https://github.com/LedgerHQ/ledger-live/commit/4232a4cbef7e77082ff8ecbd3f2da9c22559c2de), [`5b41dd5`](https://github.com/LedgerHQ/ledger-live/commit/5b41dd56e024a5d03ba0e49084113c04887395db), [`e686e2e`](https://github.com/LedgerHQ/ledger-live/commit/e686e2e54eb7b6cc166e36883c1de722108285ef), [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec), [`af47f52`](https://github.com/LedgerHQ/ledger-live/commit/af47f52290f0a140744cea4cb99649e0a47ef54e), [`c70f6a8`](https://github.com/LedgerHQ/ledger-live/commit/c70f6a8370056b6fd8f236205471359d6f9b846f)]:
  - @ledgerhq/live-common@34.53.0-next.0
  - @ledgerhq/types-live@6.89.0-next.0
  - @ledgerhq/cryptoassets@13.33.0-next.0
  - @ledgerhq/coin-framework@6.9.0-next.0
  - @ledgerhq/coin-evm@2.35.0-next.0
  - @ledgerhq/coin-tester@0.12.0-next.0
  - @ledgerhq/live-signer-evm@0.10.1-next.0

## 1.10.1

### Patch Changes

- Updated dependencies [[`51bfea9`](https://github.com/LedgerHQ/ledger-live/commit/51bfea93d2b52ab552bb7f4932bfd225134f3238)]:
  - @ledgerhq/live-common@34.52.1

## 1.10.1-hotfix.0

### Patch Changes

- Updated dependencies [[`51bfea9`](https://github.com/LedgerHQ/ledger-live/commit/51bfea93d2b52ab552bb7f4932bfd225134f3238)]:
  - @ledgerhq/live-common@34.52.1-hotfix.0

## 1.10.0

### Minor Changes

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

### Patch Changes

- Updated dependencies [[`a4bf9fb`](https://github.com/LedgerHQ/ledger-live/commit/a4bf9fbd766023028cb059ff033a21dbdc862115), [`49b5b77`](https://github.com/LedgerHQ/ledger-live/commit/49b5b7765718b13283d324bb77ad6f7403dd96ed), [`d576a0c`](https://github.com/LedgerHQ/ledger-live/commit/d576a0c5354fd3aaf2900432c0c847b7c205ae63), [`08ff5f2`](https://github.com/LedgerHQ/ledger-live/commit/08ff5f2ea791b3ffaeb715d40b7ade782e195a65), [`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`5b8a62e`](https://github.com/LedgerHQ/ledger-live/commit/5b8a62e244a13a384ae3e1c76bb5a5947eac614f), [`56ba896`](https://github.com/LedgerHQ/ledger-live/commit/56ba8964e2c4c35791073a9370944658387515bb), [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f), [`919967c`](https://github.com/LedgerHQ/ledger-live/commit/919967c78195b7cd0ea43183c019b0b73e8d9a1f), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`11eeb30`](https://github.com/LedgerHQ/ledger-live/commit/11eeb30e4279cdd6cf73d11b1a637804bf2dbb49), [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554), [`19da1c2`](https://github.com/LedgerHQ/ledger-live/commit/19da1c2756211d76373ab59cb6302bd8e7f1d4f8), [`ec733ba`](https://github.com/LedgerHQ/ledger-live/commit/ec733bab33c12b12d306f0704475685b80070905), [`8b39aa7`](https://github.com/LedgerHQ/ledger-live/commit/8b39aa7ca9e58ed3b028b133495fd729a1843332), [`b10973c`](https://github.com/LedgerHQ/ledger-live/commit/b10973cdbcaf810f5dcde2ef7a9737437d79ee26), [`85b0d42`](https://github.com/LedgerHQ/ledger-live/commit/85b0d421cec63eab83a0e15fae0228cb96e95fed), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b), [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152), [`6d86fd9`](https://github.com/LedgerHQ/ledger-live/commit/6d86fd922576160235343776846dd03eabddbd72), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24), [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf), [`9ab92be`](https://github.com/LedgerHQ/ledger-live/commit/9ab92be96e675b5223c2977958521fbd6d170fe7), [`3dfd7ff`](https://github.com/LedgerHQ/ledger-live/commit/3dfd7ff812cdc9c16af980d9729960f37397c37d), [`19e59ef`](https://github.com/LedgerHQ/ledger-live/commit/19e59ef4496ae4271031692e536408727b42f570), [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea), [`77566c5`](https://github.com/LedgerHQ/ledger-live/commit/77566c5a3b5795f5938bd5daaa5f8d65934c56b8), [`a511849`](https://github.com/LedgerHQ/ledger-live/commit/a511849d299daaea57c3decb95d842cb7fa68673), [`6baa302`](https://github.com/LedgerHQ/ledger-live/commit/6baa302930df15d535c0f683897bf87bcf41df82), [`2e6d6a7`](https://github.com/LedgerHQ/ledger-live/commit/2e6d6a7d65edd18f90b8e6499128157ef9ea37a6), [`8a4658b`](https://github.com/LedgerHQ/ledger-live/commit/8a4658b2140ad4d91de7a1ae79a53f5b9e9b076d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`b386019`](https://github.com/LedgerHQ/ledger-live/commit/b3860190aedc7691250e0abacf07ee7dd2962c91), [`2527f6b`](https://github.com/LedgerHQ/ledger-live/commit/2527f6b4d7147aab4809f26993e78b194f0044c6), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`70a3dcb`](https://github.com/LedgerHQ/ledger-live/commit/70a3dcb535db2a44aa2b609567dc4c9d359ad710), [`f392f69`](https://github.com/LedgerHQ/ledger-live/commit/f392f6912f445cc2f7cf4dfcfd030fa3da76f736), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`94719b8`](https://github.com/LedgerHQ/ledger-live/commit/94719b88092b7ebb1c24f7bf983e2476c1428153), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc), [`2c6a198`](https://github.com/LedgerHQ/ledger-live/commit/2c6a198ba28391695202a0787ce168c53768ff37)]:
  - @ledgerhq/live-common@34.52.0
  - @ledgerhq/cryptoassets@13.32.0
  - @ledgerhq/coin-evm@2.34.0
  - @ledgerhq/types-cryptoassets@7.30.0
  - @ledgerhq/coin-framework@6.8.0
  - @ledgerhq/coin-tester@0.11.0
  - @ledgerhq/types-live@6.88.0
  - @ledgerhq/live-signer-evm@0.10.0

## 1.10.0-next.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.52.0-next.3

## 1.10.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.52.0-next.2

## 1.10.0-next.1

### Patch Changes

- Updated dependencies [[`5b8a62e`](https://github.com/LedgerHQ/ledger-live/commit/5b8a62e244a13a384ae3e1c76bb5a5947eac614f)]:
  - @ledgerhq/live-common@34.52.0-next.1

## 1.10.0-next.0

### Minor Changes

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

### Patch Changes

- Updated dependencies [[`a4bf9fb`](https://github.com/LedgerHQ/ledger-live/commit/a4bf9fbd766023028cb059ff033a21dbdc862115), [`49b5b77`](https://github.com/LedgerHQ/ledger-live/commit/49b5b7765718b13283d324bb77ad6f7403dd96ed), [`d576a0c`](https://github.com/LedgerHQ/ledger-live/commit/d576a0c5354fd3aaf2900432c0c847b7c205ae63), [`08ff5f2`](https://github.com/LedgerHQ/ledger-live/commit/08ff5f2ea791b3ffaeb715d40b7ade782e195a65), [`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`56ba896`](https://github.com/LedgerHQ/ledger-live/commit/56ba8964e2c4c35791073a9370944658387515bb), [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f), [`919967c`](https://github.com/LedgerHQ/ledger-live/commit/919967c78195b7cd0ea43183c019b0b73e8d9a1f), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`11eeb30`](https://github.com/LedgerHQ/ledger-live/commit/11eeb30e4279cdd6cf73d11b1a637804bf2dbb49), [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554), [`19da1c2`](https://github.com/LedgerHQ/ledger-live/commit/19da1c2756211d76373ab59cb6302bd8e7f1d4f8), [`ec733ba`](https://github.com/LedgerHQ/ledger-live/commit/ec733bab33c12b12d306f0704475685b80070905), [`8b39aa7`](https://github.com/LedgerHQ/ledger-live/commit/8b39aa7ca9e58ed3b028b133495fd729a1843332), [`b10973c`](https://github.com/LedgerHQ/ledger-live/commit/b10973cdbcaf810f5dcde2ef7a9737437d79ee26), [`85b0d42`](https://github.com/LedgerHQ/ledger-live/commit/85b0d421cec63eab83a0e15fae0228cb96e95fed), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b), [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152), [`6d86fd9`](https://github.com/LedgerHQ/ledger-live/commit/6d86fd922576160235343776846dd03eabddbd72), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24), [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf), [`9ab92be`](https://github.com/LedgerHQ/ledger-live/commit/9ab92be96e675b5223c2977958521fbd6d170fe7), [`3dfd7ff`](https://github.com/LedgerHQ/ledger-live/commit/3dfd7ff812cdc9c16af980d9729960f37397c37d), [`19e59ef`](https://github.com/LedgerHQ/ledger-live/commit/19e59ef4496ae4271031692e536408727b42f570), [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea), [`77566c5`](https://github.com/LedgerHQ/ledger-live/commit/77566c5a3b5795f5938bd5daaa5f8d65934c56b8), [`a511849`](https://github.com/LedgerHQ/ledger-live/commit/a511849d299daaea57c3decb95d842cb7fa68673), [`6baa302`](https://github.com/LedgerHQ/ledger-live/commit/6baa302930df15d535c0f683897bf87bcf41df82), [`2e6d6a7`](https://github.com/LedgerHQ/ledger-live/commit/2e6d6a7d65edd18f90b8e6499128157ef9ea37a6), [`8a4658b`](https://github.com/LedgerHQ/ledger-live/commit/8a4658b2140ad4d91de7a1ae79a53f5b9e9b076d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`b386019`](https://github.com/LedgerHQ/ledger-live/commit/b3860190aedc7691250e0abacf07ee7dd2962c91), [`2527f6b`](https://github.com/LedgerHQ/ledger-live/commit/2527f6b4d7147aab4809f26993e78b194f0044c6), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`70a3dcb`](https://github.com/LedgerHQ/ledger-live/commit/70a3dcb535db2a44aa2b609567dc4c9d359ad710), [`f392f69`](https://github.com/LedgerHQ/ledger-live/commit/f392f6912f445cc2f7cf4dfcfd030fa3da76f736), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`94719b8`](https://github.com/LedgerHQ/ledger-live/commit/94719b88092b7ebb1c24f7bf983e2476c1428153), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc), [`2c6a198`](https://github.com/LedgerHQ/ledger-live/commit/2c6a198ba28391695202a0787ce168c53768ff37)]:
  - @ledgerhq/live-common@34.52.0-next.0
  - @ledgerhq/cryptoassets@13.32.0-next.0
  - @ledgerhq/coin-evm@2.34.0-next.0
  - @ledgerhq/types-cryptoassets@7.30.0-next.0
  - @ledgerhq/coin-framework@6.8.0-next.0
  - @ledgerhq/coin-tester@0.11.0-next.0
  - @ledgerhq/types-live@6.88.0-next.0
  - @ledgerhq/live-signer-evm@0.10.0-next.0

## 1.9.0

### Minor Changes

- [#12186](https://github.com/LedgerHQ/ledger-live/pull/12186) [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

- [#12269](https://github.com/LedgerHQ/ledger-live/pull/12269) [`7593ade`](https://github.com/LedgerHQ/ledger-live/commit/7593ade7fcaa06779673b5f563d96174ecdf6e78) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc(coin-tester-evm): add missing dependency in README

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`3691bed`](https://github.com/LedgerHQ/ledger-live/commit/3691bed5f5706f010037f54e2396ad71e48cf208), [`764d835`](https://github.com/LedgerHQ/ledger-live/commit/764d835ea88eb6cdb76a6bfb9c8764653e76f690), [`b88faa1`](https://github.com/LedgerHQ/ledger-live/commit/b88faa18e2f5cd309b54fc3157a44db606846cc5), [`731e501`](https://github.com/LedgerHQ/ledger-live/commit/731e501919d3f5110e53cc51112b506a15dbffe9), [`5098fd4`](https://github.com/LedgerHQ/ledger-live/commit/5098fd44f8c8aa883cabefe691c090f83ca936d5), [`949d5be`](https://github.com/LedgerHQ/ledger-live/commit/949d5be90316148f38701a96dbc75d6a4bc020cc), [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`0c7d867`](https://github.com/LedgerHQ/ledger-live/commit/0c7d8673ac49a90d0a491e7236731a74dcb4d7e1), [`e50f35a`](https://github.com/LedgerHQ/ledger-live/commit/e50f35a0c3b23c7176e465c1fafc0e3340f5527c), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`f83881e`](https://github.com/LedgerHQ/ledger-live/commit/f83881ea7b2da6ee04df3535b779d014fd5d9227), [`04fc7da`](https://github.com/LedgerHQ/ledger-live/commit/04fc7daed03fde65ac8c1ec4c0e28d784e16337a), [`9b7f62c`](https://github.com/LedgerHQ/ledger-live/commit/9b7f62c93fc74250f21c7102cf1c42a91f0f3644), [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`7556e73`](https://github.com/LedgerHQ/ledger-live/commit/7556e73e2ddc110d2c888fb25203689ee187e6af), [`b0454f6`](https://github.com/LedgerHQ/ledger-live/commit/b0454f6f94948530c169641b5a5845dd33886c96), [`7e0dfed`](https://github.com/LedgerHQ/ledger-live/commit/7e0dfedc7c06af31763bb7216cd89b94a395c304), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`39866a1`](https://github.com/LedgerHQ/ledger-live/commit/39866a175244519013894ce816013fff1fc4d100), [`cc743a7`](https://github.com/LedgerHQ/ledger-live/commit/cc743a7c36c2a19c13497dd0e5e55f985448d053), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`8645f01`](https://github.com/LedgerHQ/ledger-live/commit/8645f016191d29a55f6b0ca6e4b1d1909fd35445), [`1d325fa`](https://github.com/LedgerHQ/ledger-live/commit/1d325fa224e341a44593e0a8424f8346dd2ec4c0), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`73d673c`](https://github.com/LedgerHQ/ledger-live/commit/73d673cfd588a07a360df74553a879ba630c2250), [`73d3fbd`](https://github.com/LedgerHQ/ledger-live/commit/73d3fbdc4cc74fa1905efedff9709467d337021c), [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a), [`8998d5f`](https://github.com/LedgerHQ/ledger-live/commit/8998d5f164092c17c409e65d0cf54f40728717ed), [`475296a`](https://github.com/LedgerHQ/ledger-live/commit/475296a4b0cc13a2c375f282e9d9b4b263fa8533), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`db25e21`](https://github.com/LedgerHQ/ledger-live/commit/db25e212b87dea426b153c6f1d988cead63c8c46), [`1587cf4`](https://github.com/LedgerHQ/ledger-live/commit/1587cf47cd9722b00cb3b51c898634e26f752487), [`f077f72`](https://github.com/LedgerHQ/ledger-live/commit/f077f7205667f4f7b82ae7584e80964c5ac7601a), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202), [`86166a6`](https://github.com/LedgerHQ/ledger-live/commit/86166a6fe096d10f5e25fc323349348c2a243ae1), [`246b070`](https://github.com/LedgerHQ/ledger-live/commit/246b0701c1f375f3cdd847c5d2a8fe3c2060ef28)]:
  - @ledgerhq/live-common@34.51.0
  - @ledgerhq/cryptoassets@13.31.0
  - @ledgerhq/types-live@6.87.0
  - @ledgerhq/coin-evm@2.33.0
  - @ledgerhq/coin-framework@6.7.0
  - @ledgerhq/live-signer-evm@0.9.0
  - @ledgerhq/types-cryptoassets@7.29.0
  - @ledgerhq/coin-tester@0.10.1

## 1.9.0-next.4

### Patch Changes

- Updated dependencies [[`5098fd4`](https://github.com/LedgerHQ/ledger-live/commit/5098fd44f8c8aa883cabefe691c090f83ca936d5)]:
  - @ledgerhq/live-common@34.51.0-next.3

## 1.9.0-next.3

### Patch Changes

- Updated dependencies [[`73d3fbd`](https://github.com/LedgerHQ/ledger-live/commit/73d3fbdc4cc74fa1905efedff9709467d337021c)]:
  - @ledgerhq/live-common@34.51.0-next.2

## 1.9.0-next.2

### Minor Changes

- [#12269](https://github.com/LedgerHQ/ledger-live/pull/12269) [`7593ade`](https://github.com/LedgerHQ/ledger-live/commit/7593ade7fcaa06779673b5f563d96174ecdf6e78) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc(coin-tester-evm): add missing dependency in README

## 1.9.0-next.1

### Patch Changes

- Updated dependencies [[`b88faa1`](https://github.com/LedgerHQ/ledger-live/commit/b88faa18e2f5cd309b54fc3157a44db606846cc5)]:
  - @ledgerhq/types-live@6.87.0-next.1
  - @ledgerhq/live-common@34.51.0-next.1
  - @ledgerhq/coin-framework@6.7.0-next.1
  - @ledgerhq/coin-evm@2.33.0-next.1
  - @ledgerhq/coin-tester@0.10.1
  - @ledgerhq/cryptoassets@13.31.0-next.1
  - @ledgerhq/live-signer-evm@0.9.0-next.1

## 1.9.0-next.0

### Minor Changes

- [#12186](https://github.com/LedgerHQ/ledger-live/pull/12186) [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`3691bed`](https://github.com/LedgerHQ/ledger-live/commit/3691bed5f5706f010037f54e2396ad71e48cf208), [`764d835`](https://github.com/LedgerHQ/ledger-live/commit/764d835ea88eb6cdb76a6bfb9c8764653e76f690), [`731e501`](https://github.com/LedgerHQ/ledger-live/commit/731e501919d3f5110e53cc51112b506a15dbffe9), [`949d5be`](https://github.com/LedgerHQ/ledger-live/commit/949d5be90316148f38701a96dbc75d6a4bc020cc), [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`0c7d867`](https://github.com/LedgerHQ/ledger-live/commit/0c7d8673ac49a90d0a491e7236731a74dcb4d7e1), [`e50f35a`](https://github.com/LedgerHQ/ledger-live/commit/e50f35a0c3b23c7176e465c1fafc0e3340f5527c), [`7c444b5`](https://github.com/LedgerHQ/ledger-live/commit/7c444b51db86ef6611931ce05a7613c4cb714b77), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`f83881e`](https://github.com/LedgerHQ/ledger-live/commit/f83881ea7b2da6ee04df3535b779d014fd5d9227), [`04fc7da`](https://github.com/LedgerHQ/ledger-live/commit/04fc7daed03fde65ac8c1ec4c0e28d784e16337a), [`9b7f62c`](https://github.com/LedgerHQ/ledger-live/commit/9b7f62c93fc74250f21c7102cf1c42a91f0f3644), [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`7556e73`](https://github.com/LedgerHQ/ledger-live/commit/7556e73e2ddc110d2c888fb25203689ee187e6af), [`b0454f6`](https://github.com/LedgerHQ/ledger-live/commit/b0454f6f94948530c169641b5a5845dd33886c96), [`7e0dfed`](https://github.com/LedgerHQ/ledger-live/commit/7e0dfedc7c06af31763bb7216cd89b94a395c304), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`39866a1`](https://github.com/LedgerHQ/ledger-live/commit/39866a175244519013894ce816013fff1fc4d100), [`cc743a7`](https://github.com/LedgerHQ/ledger-live/commit/cc743a7c36c2a19c13497dd0e5e55f985448d053), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`8645f01`](https://github.com/LedgerHQ/ledger-live/commit/8645f016191d29a55f6b0ca6e4b1d1909fd35445), [`1d325fa`](https://github.com/LedgerHQ/ledger-live/commit/1d325fa224e341a44593e0a8424f8346dd2ec4c0), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`73d673c`](https://github.com/LedgerHQ/ledger-live/commit/73d673cfd588a07a360df74553a879ba630c2250), [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a), [`8998d5f`](https://github.com/LedgerHQ/ledger-live/commit/8998d5f164092c17c409e65d0cf54f40728717ed), [`475296a`](https://github.com/LedgerHQ/ledger-live/commit/475296a4b0cc13a2c375f282e9d9b4b263fa8533), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`db25e21`](https://github.com/LedgerHQ/ledger-live/commit/db25e212b87dea426b153c6f1d988cead63c8c46), [`1587cf4`](https://github.com/LedgerHQ/ledger-live/commit/1587cf47cd9722b00cb3b51c898634e26f752487), [`f077f72`](https://github.com/LedgerHQ/ledger-live/commit/f077f7205667f4f7b82ae7584e80964c5ac7601a), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202), [`86166a6`](https://github.com/LedgerHQ/ledger-live/commit/86166a6fe096d10f5e25fc323349348c2a243ae1), [`246b070`](https://github.com/LedgerHQ/ledger-live/commit/246b0701c1f375f3cdd847c5d2a8fe3c2060ef28)]:
  - @ledgerhq/live-common@34.51.0-next.0
  - @ledgerhq/cryptoassets@13.31.0-next.0
  - @ledgerhq/coin-evm@2.33.0-next.0
  - @ledgerhq/types-live@6.87.0-next.0
  - @ledgerhq/coin-framework@6.7.0-next.0
  - @ledgerhq/live-signer-evm@0.9.0-next.0
  - @ledgerhq/types-cryptoassets@7.29.0-next.0
  - @ledgerhq/coin-tester@0.10.1

## 1.8.1

### Patch Changes

- Updated dependencies [[`5d3b6c0`](https://github.com/LedgerHQ/ledger-live/commit/5d3b6c01904d50e700e480150b64e9c6d8bcbc98), [`1efc340`](https://github.com/LedgerHQ/ledger-live/commit/1efc340299242edd73512d1931976458fc6b8201), [`e04d493`](https://github.com/LedgerHQ/ledger-live/commit/e04d49340c65c8b4608a37bb726d21350fdd32f1), [`a37c06f`](https://github.com/LedgerHQ/ledger-live/commit/a37c06f97b061a5db0dad3632bb5c3e8f293677c), [`777bf68`](https://github.com/LedgerHQ/ledger-live/commit/777bf6884e89bcbec9523fe17a7bc94ec0e5e624), [`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5), [`980450f`](https://github.com/LedgerHQ/ledger-live/commit/980450ff9e57e1a150e137c7dea39ce5bcb36549), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`f015ef3`](https://github.com/LedgerHQ/ledger-live/commit/f015ef32660905d00f55a45f451f38bc12aec9ba), [`72e4a96`](https://github.com/LedgerHQ/ledger-live/commit/72e4a96f7d5b6ce224bd369508e2b5686c126e30), [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e), [`321e514`](https://github.com/LedgerHQ/ledger-live/commit/321e5145e94a34c4a348855deb1acce14cb90b18), [`c1c2539`](https://github.com/LedgerHQ/ledger-live/commit/c1c25396cfc4dbcd742cd9872f7b837becb1dfef), [`e3bcefb`](https://github.com/LedgerHQ/ledger-live/commit/e3bcefbf8a46c91388d6f936fd31d6ffcdc24756), [`49a8534`](https://github.com/LedgerHQ/ledger-live/commit/49a85340a9c4e5dd8dd07db87028fe48f307d1f6), [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18), [`42f2449`](https://github.com/LedgerHQ/ledger-live/commit/42f244956720dfe13cf16334ef79064f651c67d0)]:
  - @ledgerhq/live-common@34.50.0
  - @ledgerhq/types-live@6.86.0
  - @ledgerhq/cryptoassets@13.30.0
  - @ledgerhq/types-cryptoassets@7.28.0
  - @ledgerhq/coin-evm@2.32.0
  - @ledgerhq/coin-framework@6.6.0
  - @ledgerhq/coin-tester@0.10.1
  - @ledgerhq/live-signer-evm@0.8.1

## 1.8.1-next.0

### Patch Changes

- Updated dependencies [[`5d3b6c0`](https://github.com/LedgerHQ/ledger-live/commit/5d3b6c01904d50e700e480150b64e9c6d8bcbc98), [`1efc340`](https://github.com/LedgerHQ/ledger-live/commit/1efc340299242edd73512d1931976458fc6b8201), [`e04d493`](https://github.com/LedgerHQ/ledger-live/commit/e04d49340c65c8b4608a37bb726d21350fdd32f1), [`a37c06f`](https://github.com/LedgerHQ/ledger-live/commit/a37c06f97b061a5db0dad3632bb5c3e8f293677c), [`777bf68`](https://github.com/LedgerHQ/ledger-live/commit/777bf6884e89bcbec9523fe17a7bc94ec0e5e624), [`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5), [`980450f`](https://github.com/LedgerHQ/ledger-live/commit/980450ff9e57e1a150e137c7dea39ce5bcb36549), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`f015ef3`](https://github.com/LedgerHQ/ledger-live/commit/f015ef32660905d00f55a45f451f38bc12aec9ba), [`72e4a96`](https://github.com/LedgerHQ/ledger-live/commit/72e4a96f7d5b6ce224bd369508e2b5686c126e30), [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e), [`321e514`](https://github.com/LedgerHQ/ledger-live/commit/321e5145e94a34c4a348855deb1acce14cb90b18), [`c1c2539`](https://github.com/LedgerHQ/ledger-live/commit/c1c25396cfc4dbcd742cd9872f7b837becb1dfef), [`e3bcefb`](https://github.com/LedgerHQ/ledger-live/commit/e3bcefbf8a46c91388d6f936fd31d6ffcdc24756), [`49a8534`](https://github.com/LedgerHQ/ledger-live/commit/49a85340a9c4e5dd8dd07db87028fe48f307d1f6), [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18), [`42f2449`](https://github.com/LedgerHQ/ledger-live/commit/42f244956720dfe13cf16334ef79064f651c67d0), [`77ffab2`](https://github.com/LedgerHQ/ledger-live/commit/77ffab2f5d08fb45449b6b8316b0947dd46286b1)]:
  - @ledgerhq/live-common@34.50.0-next.0
  - @ledgerhq/types-live@6.86.0-next.0
  - @ledgerhq/cryptoassets@13.30.0-next.0
  - @ledgerhq/types-cryptoassets@7.28.0-next.0
  - @ledgerhq/coin-evm@2.32.0-next.0
  - @ledgerhq/coin-framework@6.6.0-next.0
  - @ledgerhq/coin-tester@0.10.1-next.0
  - @ledgerhq/live-signer-evm@0.8.1-next.0

## 1.8.0

### Minor Changes

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

### Patch Changes

- Updated dependencies [[`d93c0aa`](https://github.com/LedgerHQ/ledger-live/commit/d93c0aab902bfba5b36ebdf707e88b5d3453dacb), [`289f623`](https://github.com/LedgerHQ/ledger-live/commit/289f623c2b9055a596647676499cd3c8b34117fa), [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a), [`aee931f`](https://github.com/LedgerHQ/ledger-live/commit/aee931fdc9d6028ddfcaea014b033822e178d7a0), [`e70a351`](https://github.com/LedgerHQ/ledger-live/commit/e70a351dc3298c59301cfff1939c7e3d16efa880), [`1d06127`](https://github.com/LedgerHQ/ledger-live/commit/1d06127d433c5e61482c1b49cca3c15aa6662499), [`9b8689a`](https://github.com/LedgerHQ/ledger-live/commit/9b8689ae2c44bdeccae26378e05cbf6899b83aec), [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`2d747cf`](https://github.com/LedgerHQ/ledger-live/commit/2d747cf63f120a6634c2e2adbe60c4e94d37fc71), [`c8fe586`](https://github.com/LedgerHQ/ledger-live/commit/c8fe586f1427d4d7a9fad092b51221ec8221399d), [`3840b29`](https://github.com/LedgerHQ/ledger-live/commit/3840b295fe6bef518b506c3d1d68f62d0137df22), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`3c19e0d`](https://github.com/LedgerHQ/ledger-live/commit/3c19e0d23812b99ec709603493691c10170d1b42), [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7), [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce), [`f671769`](https://github.com/LedgerHQ/ledger-live/commit/f6717696fcb2ad672a48fdd7f8654dedf11b4a65), [`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769), [`2a3a861`](https://github.com/LedgerHQ/ledger-live/commit/2a3a861cbd6530f863824d0bab8ba8a170211e34), [`13ac4d7`](https://github.com/LedgerHQ/ledger-live/commit/13ac4d7ed05f0fc448cc0a013688c917cb73e0f5), [`1c4bcb9`](https://github.com/LedgerHQ/ledger-live/commit/1c4bcb9e9082dedb37598b2b0a35be0665e80d20), [`6847918`](https://github.com/LedgerHQ/ledger-live/commit/6847918323d59e7ec089b8c70bef7f2d768a41c9), [`ed4c073`](https://github.com/LedgerHQ/ledger-live/commit/ed4c073b304d85355cf510551bcb225de4a3391c), [`f55291b`](https://github.com/LedgerHQ/ledger-live/commit/f55291b02f6a603e37eae2aee0c569e434982c21)]:
  - @ledgerhq/live-common@34.49.0
  - @ledgerhq/live-signer-evm@0.8.0
  - @ledgerhq/coin-evm@2.31.0
  - @ledgerhq/types-live@6.85.0
  - @ledgerhq/types-cryptoassets@7.27.0
  - @ledgerhq/cryptoassets@13.29.0
  - @ledgerhq/coin-framework@6.5.0
  - @ledgerhq/coin-tester@0.10.0

## 1.8.0-next.2

### Patch Changes

- Updated dependencies [[`1c4bcb9`](https://github.com/LedgerHQ/ledger-live/commit/1c4bcb9e9082dedb37598b2b0a35be0665e80d20)]:
  - @ledgerhq/live-common@34.49.0-next.2

## 1.8.0-next.1

### Patch Changes

- Updated dependencies [[`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769)]:
  - @ledgerhq/coin-evm@2.31.0-next.1
  - @ledgerhq/live-common@34.49.0-next.1
  - @ledgerhq/live-signer-evm@0.8.0-next.1

## 1.8.0-next.0

### Minor Changes

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

### Patch Changes

- Updated dependencies [[`d93c0aa`](https://github.com/LedgerHQ/ledger-live/commit/d93c0aab902bfba5b36ebdf707e88b5d3453dacb), [`289f623`](https://github.com/LedgerHQ/ledger-live/commit/289f623c2b9055a596647676499cd3c8b34117fa), [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a), [`aee931f`](https://github.com/LedgerHQ/ledger-live/commit/aee931fdc9d6028ddfcaea014b033822e178d7a0), [`e70a351`](https://github.com/LedgerHQ/ledger-live/commit/e70a351dc3298c59301cfff1939c7e3d16efa880), [`1d06127`](https://github.com/LedgerHQ/ledger-live/commit/1d06127d433c5e61482c1b49cca3c15aa6662499), [`9b8689a`](https://github.com/LedgerHQ/ledger-live/commit/9b8689ae2c44bdeccae26378e05cbf6899b83aec), [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`2d747cf`](https://github.com/LedgerHQ/ledger-live/commit/2d747cf63f120a6634c2e2adbe60c4e94d37fc71), [`c8fe586`](https://github.com/LedgerHQ/ledger-live/commit/c8fe586f1427d4d7a9fad092b51221ec8221399d), [`3840b29`](https://github.com/LedgerHQ/ledger-live/commit/3840b295fe6bef518b506c3d1d68f62d0137df22), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`3c19e0d`](https://github.com/LedgerHQ/ledger-live/commit/3c19e0d23812b99ec709603493691c10170d1b42), [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7), [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce), [`f671769`](https://github.com/LedgerHQ/ledger-live/commit/f6717696fcb2ad672a48fdd7f8654dedf11b4a65), [`2a3a861`](https://github.com/LedgerHQ/ledger-live/commit/2a3a861cbd6530f863824d0bab8ba8a170211e34), [`13ac4d7`](https://github.com/LedgerHQ/ledger-live/commit/13ac4d7ed05f0fc448cc0a013688c917cb73e0f5), [`6847918`](https://github.com/LedgerHQ/ledger-live/commit/6847918323d59e7ec089b8c70bef7f2d768a41c9), [`ed4c073`](https://github.com/LedgerHQ/ledger-live/commit/ed4c073b304d85355cf510551bcb225de4a3391c), [`f55291b`](https://github.com/LedgerHQ/ledger-live/commit/f55291b02f6a603e37eae2aee0c569e434982c21)]:
  - @ledgerhq/live-common@34.49.0-next.0
  - @ledgerhq/live-signer-evm@0.8.0-next.0
  - @ledgerhq/coin-evm@2.31.0-next.0
  - @ledgerhq/types-live@6.85.0-next.0
  - @ledgerhq/types-cryptoassets@7.27.0-next.0
  - @ledgerhq/cryptoassets@13.29.0-next.0
  - @ledgerhq/coin-framework@6.5.0-next.0
  - @ledgerhq/coin-tester@0.10.0-next.0

## 1.7.1

### Patch Changes

- Updated dependencies [[`ef18dc8`](https://github.com/LedgerHQ/ledger-live/commit/ef18dc8dff93b13ab7879fbe9666f68ee66a8466)]:
  - @ledgerhq/live-common@34.48.1

## 1.7.1-hotfix.0

### Patch Changes

- Updated dependencies [[`ef18dc8`](https://github.com/LedgerHQ/ledger-live/commit/ef18dc8dff93b13ab7879fbe9666f68ee66a8466)]:
  - @ledgerhq/live-common@34.48.1-hotfix.0

## 1.7.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

### Patch Changes

- Updated dependencies [[`284a2c7`](https://github.com/LedgerHQ/ledger-live/commit/284a2c7f571c8d8e622ba60bef24d186ce42605d), [`9d3eef6`](https://github.com/LedgerHQ/ledger-live/commit/9d3eef600242c6be51c4dd844dffe06150e9f0c4), [`c1209a7`](https://github.com/LedgerHQ/ledger-live/commit/c1209a70f6362fe8a52139ad5ad0b4705aac00fb), [`64b059c`](https://github.com/LedgerHQ/ledger-live/commit/64b059cc514e199320b0e668dfed647ac2b658a9), [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14), [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`2b6fe2f`](https://github.com/LedgerHQ/ledger-live/commit/2b6fe2f1d068940aab624da7c8454b98bffbca3b), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`58ef394`](https://github.com/LedgerHQ/ledger-live/commit/58ef39468870e56745a3a4bc95a1292a1e1f64ca), [`e3464bb`](https://github.com/LedgerHQ/ledger-live/commit/e3464bbaa0868537d8bd817152d4aaea4d99e4b2), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`228ed30`](https://github.com/LedgerHQ/ledger-live/commit/228ed3030601644e807e85a1693276b788b5cd2a), [`0051b62`](https://github.com/LedgerHQ/ledger-live/commit/0051b62ca8f7ddddc0bdc316a8734362aacfbb58), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`6a1e8fe`](https://github.com/LedgerHQ/ledger-live/commit/6a1e8febd56e291559308eaad3d6562efe4b3ff1), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`6ebe1f9`](https://github.com/LedgerHQ/ledger-live/commit/6ebe1f9e8e565e91afbb7c9db943c98425aaa311), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`0432d2a`](https://github.com/LedgerHQ/ledger-live/commit/0432d2aca30d74eb00abdc8427c4c34725f34b13), [`5e43b9f`](https://github.com/LedgerHQ/ledger-live/commit/5e43b9fab2c895e145bdddbf180fbf985e429f7b), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`b34a43c`](https://github.com/LedgerHQ/ledger-live/commit/b34a43c290929ccab9380c2c2853bd320d4630b9), [`25d8fdd`](https://github.com/LedgerHQ/ledger-live/commit/25d8fdde989e1a1c0cc6f16052c322d4e9d46d1f), [`c852de4`](https://github.com/LedgerHQ/ledger-live/commit/c852de40f63948ded6fb0abe6fc8104408391c5b), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620), [`80a109a`](https://github.com/LedgerHQ/ledger-live/commit/80a109a5f8ecdbb22cf6fb3ec084398a7e54dcfb), [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb), [`d21e94b`](https://github.com/LedgerHQ/ledger-live/commit/d21e94b26c6084cd8dec614c7059673784d8faad), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9)]:
  - @ledgerhq/live-common@34.48.0
  - @ledgerhq/coin-evm@2.30.0
  - @ledgerhq/coin-framework@6.4.0
  - @ledgerhq/cryptoassets@13.28.0
  - @ledgerhq/types-live@6.84.0
  - @ledgerhq/coin-tester@0.9.3
  - @ledgerhq/live-signer-evm@0.7.5

## 1.7.0-next.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

### Patch Changes

- Updated dependencies [[`284a2c7`](https://github.com/LedgerHQ/ledger-live/commit/284a2c7f571c8d8e622ba60bef24d186ce42605d), [`9d3eef6`](https://github.com/LedgerHQ/ledger-live/commit/9d3eef600242c6be51c4dd844dffe06150e9f0c4), [`c1209a7`](https://github.com/LedgerHQ/ledger-live/commit/c1209a70f6362fe8a52139ad5ad0b4705aac00fb), [`64b059c`](https://github.com/LedgerHQ/ledger-live/commit/64b059cc514e199320b0e668dfed647ac2b658a9), [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14), [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`2b6fe2f`](https://github.com/LedgerHQ/ledger-live/commit/2b6fe2f1d068940aab624da7c8454b98bffbca3b), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`58ef394`](https://github.com/LedgerHQ/ledger-live/commit/58ef39468870e56745a3a4bc95a1292a1e1f64ca), [`e3464bb`](https://github.com/LedgerHQ/ledger-live/commit/e3464bbaa0868537d8bd817152d4aaea4d99e4b2), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`228ed30`](https://github.com/LedgerHQ/ledger-live/commit/228ed3030601644e807e85a1693276b788b5cd2a), [`0051b62`](https://github.com/LedgerHQ/ledger-live/commit/0051b62ca8f7ddddc0bdc316a8734362aacfbb58), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`6a1e8fe`](https://github.com/LedgerHQ/ledger-live/commit/6a1e8febd56e291559308eaad3d6562efe4b3ff1), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`6ebe1f9`](https://github.com/LedgerHQ/ledger-live/commit/6ebe1f9e8e565e91afbb7c9db943c98425aaa311), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`0432d2a`](https://github.com/LedgerHQ/ledger-live/commit/0432d2aca30d74eb00abdc8427c4c34725f34b13), [`5e43b9f`](https://github.com/LedgerHQ/ledger-live/commit/5e43b9fab2c895e145bdddbf180fbf985e429f7b), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`b34a43c`](https://github.com/LedgerHQ/ledger-live/commit/b34a43c290929ccab9380c2c2853bd320d4630b9), [`25d8fdd`](https://github.com/LedgerHQ/ledger-live/commit/25d8fdde989e1a1c0cc6f16052c322d4e9d46d1f), [`c852de4`](https://github.com/LedgerHQ/ledger-live/commit/c852de40f63948ded6fb0abe6fc8104408391c5b), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620), [`80a109a`](https://github.com/LedgerHQ/ledger-live/commit/80a109a5f8ecdbb22cf6fb3ec084398a7e54dcfb), [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb), [`d21e94b`](https://github.com/LedgerHQ/ledger-live/commit/d21e94b26c6084cd8dec614c7059673784d8faad), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9)]:
  - @ledgerhq/live-common@34.48.0-next.0
  - @ledgerhq/coin-evm@2.30.0-next.0
  - @ledgerhq/coin-framework@6.4.0-next.0
  - @ledgerhq/cryptoassets@13.28.0-next.0
  - @ledgerhq/types-live@6.84.0-next.0
  - @ledgerhq/coin-tester@0.9.3-next.0
  - @ledgerhq/live-signer-evm@0.7.5-next.0

## 1.6.0

### Minor Changes

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a), [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`a6a97f1`](https://github.com/LedgerHQ/ledger-live/commit/a6a97f1daeaf3d90e69fe12d23d59cf4d4c7d78b), [`e9fa7aa`](https://github.com/LedgerHQ/ledger-live/commit/e9fa7aa8c8d0414416ec7c12acf30b7623b2eda3), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`b6af1d7`](https://github.com/LedgerHQ/ledger-live/commit/b6af1d7d4bc8aba35497242f6863620c7080162c), [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b), [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006), [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266), [`bc8932d`](https://github.com/LedgerHQ/ledger-live/commit/bc8932d4c906f2aca99eacc5af89016d4784e6b8), [`c5bb247`](https://github.com/LedgerHQ/ledger-live/commit/c5bb24705c4463eeb519adc79b3b3dfb03ed4487)]:
  - @ledgerhq/types-cryptoassets@7.26.0
  - @ledgerhq/cryptoassets@13.27.0
  - @ledgerhq/live-common@34.47.0
  - @ledgerhq/coin-evm@2.29.0
  - @ledgerhq/coin-framework@6.3.0
  - @ledgerhq/types-live@6.83.0
  - @ledgerhq/live-config@3.2.0
  - @ledgerhq/coin-tester@0.9.2
  - @ledgerhq/live-signer-evm@0.7.4

## 1.6.0-next.0

### Minor Changes

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a), [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`a6a97f1`](https://github.com/LedgerHQ/ledger-live/commit/a6a97f1daeaf3d90e69fe12d23d59cf4d4c7d78b), [`e9fa7aa`](https://github.com/LedgerHQ/ledger-live/commit/e9fa7aa8c8d0414416ec7c12acf30b7623b2eda3), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`b6af1d7`](https://github.com/LedgerHQ/ledger-live/commit/b6af1d7d4bc8aba35497242f6863620c7080162c), [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b), [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006), [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266), [`bc8932d`](https://github.com/LedgerHQ/ledger-live/commit/bc8932d4c906f2aca99eacc5af89016d4784e6b8), [`c5bb247`](https://github.com/LedgerHQ/ledger-live/commit/c5bb24705c4463eeb519adc79b3b3dfb03ed4487)]:
  - @ledgerhq/types-cryptoassets@7.26.0-next.0
  - @ledgerhq/cryptoassets@13.27.0-next.0
  - @ledgerhq/live-common@34.47.0-next.0
  - @ledgerhq/coin-evm@2.29.0-next.0
  - @ledgerhq/coin-framework@6.3.0-next.0
  - @ledgerhq/types-live@6.83.0-next.0
  - @ledgerhq/live-config@3.2.0-next.0
  - @ledgerhq/coin-tester@0.9.2-next.0
  - @ledgerhq/live-signer-evm@0.7.2-next.0

## 1.5.3

### Patch Changes

- Updated dependencies [[`458f80d`](https://github.com/LedgerHQ/ledger-live/commit/458f80d2d8cf202bde2feb35239a35299e48fa7c)]:
  - @ledgerhq/live-common@34.46.2
  - @ledgerhq/live-signer-evm@0.7.3

## 1.5.3-hotfix.0

### Patch Changes

- Updated dependencies [[`458f80d`](https://github.com/LedgerHQ/ledger-live/commit/458f80d2d8cf202bde2feb35239a35299e48fa7c)]:
  - @ledgerhq/live-common@34.46.2-hotfix.0
  - @ledgerhq/live-signer-evm@0.7.3-hotfix.0

## 1.5.2

### Patch Changes

- Updated dependencies [[`9f9c22a`](https://github.com/LedgerHQ/ledger-live/commit/9f9c22a72e3cbdbcb641f9a2fd771a4e9ad3f87b)]:
  - @ledgerhq/live-signer-evm@0.7.2
  - @ledgerhq/live-common@34.46.1

## 1.5.2-hotfix.0

### Patch Changes

- Updated dependencies [[`9f9c22a`](https://github.com/LedgerHQ/ledger-live/commit/9f9c22a72e3cbdbcb641f9a2fd771a4e9ad3f87b)]:
  - @ledgerhq/live-signer-evm@0.7.2-hotfix.0
  - @ledgerhq/live-common@34.46.1-hotfix.0

## 1.5.1

### Patch Changes

- Updated dependencies [[`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1), [`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`fabdc2d`](https://github.com/LedgerHQ/ledger-live/commit/fabdc2d34fc43302fc31514073fcc74e83d0ee93), [`2fb3986`](https://github.com/LedgerHQ/ledger-live/commit/2fb3986b56c80c331fef5ddf3e1b5988a3245b07), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef), [`15c776d`](https://github.com/LedgerHQ/ledger-live/commit/15c776d5d12b275abf09c04d532f350959ef4856), [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`31dceca`](https://github.com/LedgerHQ/ledger-live/commit/31dcecad24abdaa8a77208e82532c47728c11180)]:
  - @ledgerhq/coin-evm@2.28.0
  - @ledgerhq/cryptoassets@13.26.0
  - @ledgerhq/live-common@34.46.0
  - @ledgerhq/coin-framework@6.2.0
  - @ledgerhq/types-live@6.82.0
  - @ledgerhq/live-signer-evm@0.7.1
  - @ledgerhq/coin-tester@0.9.1

## 1.5.1-next.0

### Patch Changes

- Updated dependencies [[`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1), [`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`fabdc2d`](https://github.com/LedgerHQ/ledger-live/commit/fabdc2d34fc43302fc31514073fcc74e83d0ee93), [`2fb3986`](https://github.com/LedgerHQ/ledger-live/commit/2fb3986b56c80c331fef5ddf3e1b5988a3245b07), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef), [`15c776d`](https://github.com/LedgerHQ/ledger-live/commit/15c776d5d12b275abf09c04d532f350959ef4856), [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`31dceca`](https://github.com/LedgerHQ/ledger-live/commit/31dcecad24abdaa8a77208e82532c47728c11180)]:
  - @ledgerhq/coin-evm@2.28.0-next.0
  - @ledgerhq/cryptoassets@13.26.0-next.0
  - @ledgerhq/live-common@34.46.0-next.0
  - @ledgerhq/coin-framework@6.2.0-next.0
  - @ledgerhq/types-live@6.82.0-next.0
  - @ledgerhq/live-signer-evm@0.7.1-next.0
  - @ledgerhq/coin-tester@0.9.1-next.0

## 1.5.0

### Minor Changes

- [#11223](https://github.com/LedgerHQ/ledger-live/pull/11223) [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-tester-evm): adapt for generic adapter

### Patch Changes

- Updated dependencies [[`f5f652e`](https://github.com/LedgerHQ/ledger-live/commit/f5f652e308477ff38176e5782eaf0e1bb96956ba), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa), [`f8c5aaf`](https://github.com/LedgerHQ/ledger-live/commit/f8c5aafb44f3e9ad7c00f808778a66cfa853e7b8), [`f6ca949`](https://github.com/LedgerHQ/ledger-live/commit/f6ca949d03801ac1a0815f89906b17e5f4625821), [`4ba9d04`](https://github.com/LedgerHQ/ledger-live/commit/4ba9d04975b17d9d25f2c60dca87bdd71638d7d1), [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6), [`5e8bfda`](https://github.com/LedgerHQ/ledger-live/commit/5e8bfda844f0c53f0340d2ca7017e6314a657bc8), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d), [`dd2110a`](https://github.com/LedgerHQ/ledger-live/commit/dd2110a4259614eb39c62991d3cf92cae745d710)]:
  - @ledgerhq/live-common@34.45.0
  - @ledgerhq/cryptoassets@13.25.0
  - @ledgerhq/coin-evm@2.27.0
  - @ledgerhq/coin-tester@0.9.0
  - @ledgerhq/coin-framework@6.1.0
  - @ledgerhq/types-live@6.81.0
  - @ledgerhq/live-signer-evm@0.7.0

## 1.5.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.45.0-next.2

## 1.5.0-next.1

### Patch Changes

- Updated dependencies [[`dd2110a`](https://github.com/LedgerHQ/ledger-live/commit/dd2110a4259614eb39c62991d3cf92cae745d710)]:
  - @ledgerhq/live-common@34.45.0-next.1

## 1.5.0-next.0

### Minor Changes

- [#11223](https://github.com/LedgerHQ/ledger-live/pull/11223) [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-tester-evm): adapt for generic adapter

### Patch Changes

- Updated dependencies [[`f5f652e`](https://github.com/LedgerHQ/ledger-live/commit/f5f652e308477ff38176e5782eaf0e1bb96956ba), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa), [`f8c5aaf`](https://github.com/LedgerHQ/ledger-live/commit/f8c5aafb44f3e9ad7c00f808778a66cfa853e7b8), [`f6ca949`](https://github.com/LedgerHQ/ledger-live/commit/f6ca949d03801ac1a0815f89906b17e5f4625821), [`4ba9d04`](https://github.com/LedgerHQ/ledger-live/commit/4ba9d04975b17d9d25f2c60dca87bdd71638d7d1), [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6), [`5e8bfda`](https://github.com/LedgerHQ/ledger-live/commit/5e8bfda844f0c53f0340d2ca7017e6314a657bc8), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-common@34.45.0-next.0
  - @ledgerhq/cryptoassets@13.25.0-next.0
  - @ledgerhq/coin-evm@2.27.0-next.0
  - @ledgerhq/coin-tester@0.9.0-next.0
  - @ledgerhq/coin-framework@6.1.0-next.0
  - @ledgerhq/types-live@6.81.0-next.0
  - @ledgerhq/live-signer-evm@0.7.0-next.0

## 1.4.0

### Minor Changes

- [#11073](https://github.com/LedgerHQ/ledger-live/pull/11073) [`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636) Thanks [@Canestin](https://github.com/Canestin)! - update sonic manager app name

- [#11109](https://github.com/LedgerHQ/ledger-live/pull/11109) [`20321d1`](https://github.com/LedgerHQ/ledger-live/commit/20321d178231b09811df1da758f07f6516a91448) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-evm): unskip Polygon scenarii

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0
  - @ledgerhq/coin-tester@0.8.0
  - @ledgerhq/types-cryptoassets@7.25.0
  - @ledgerhq/types-live@6.80.0
  - @ledgerhq/coin-evm@2.26.0
  - @ledgerhq/coin-framework@6.0.0
  - @ledgerhq/live-signer-evm@0.6.3

## 1.4.0-next.0

### Minor Changes

- [#11073](https://github.com/LedgerHQ/ledger-live/pull/11073) [`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636) Thanks [@Canestin](https://github.com/Canestin)! - update sonic manager app name

- [#11109](https://github.com/LedgerHQ/ledger-live/pull/11109) [`20321d1`](https://github.com/LedgerHQ/ledger-live/commit/20321d178231b09811df1da758f07f6516a91448) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-evm): unskip Polygon scenarii

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0-next.0
  - @ledgerhq/coin-tester@0.8.0-next.0
  - @ledgerhq/types-cryptoassets@7.25.0-next.0
  - @ledgerhq/types-live@6.80.0-next.0
  - @ledgerhq/coin-evm@2.26.0-next.0
  - @ledgerhq/coin-framework@6.0.0-next.0
  - @ledgerhq/live-signer-evm@0.6.3-next.0

## 1.3.3

### Patch Changes

- Updated dependencies [[`4eee376`](https://github.com/LedgerHQ/ledger-live/commit/4eee3767b513dfb58a156cf2ce8086e31a7d55bf), [`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6312f3a`](https://github.com/LedgerHQ/ledger-live/commit/6312f3a039e3018dfd78d231fa91ecf8fc82a118), [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff), [`8423a9f`](https://github.com/LedgerHQ/ledger-live/commit/8423a9fbba0d54d18ff35c0519a82829fc8042e0), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/types-live@6.79.0
  - @ledgerhq/cryptoassets@13.23.0
  - @ledgerhq/coin-evm@2.25.0
  - @ledgerhq/types-cryptoassets@7.24.0
  - @ledgerhq/coin-framework@5.8.0
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2

## 1.3.3-next.1

### Patch Changes

- Updated dependencies [[`8423a9f`](https://github.com/LedgerHQ/ledger-live/commit/8423a9fbba0d54d18ff35c0519a82829fc8042e0)]:
  - @ledgerhq/types-live@6.79.0-next.1
  - @ledgerhq/coin-framework@5.8.0-next.1
  - @ledgerhq/coin-evm@2.25.0-next.1
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2-next.1

## 1.3.3-next.0

### Patch Changes

- Updated dependencies [[`4eee376`](https://github.com/LedgerHQ/ledger-live/commit/4eee3767b513dfb58a156cf2ce8086e31a7d55bf), [`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6312f3a`](https://github.com/LedgerHQ/ledger-live/commit/6312f3a039e3018dfd78d231fa91ecf8fc82a118), [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/types-live@6.79.0-next.0
  - @ledgerhq/cryptoassets@13.23.0-next.0
  - @ledgerhq/coin-evm@2.25.0-next.0
  - @ledgerhq/types-cryptoassets@7.24.0-next.0
  - @ledgerhq/coin-framework@5.8.0-next.0
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2-next.0

## 1.3.2

### Patch Changes

- Updated dependencies [[`f4e4632`](https://github.com/LedgerHQ/ledger-live/commit/f4e4632119cc0c33e327df9faa9d4951128818c0)]:
  - @ledgerhq/live-signer-evm@0.6.1

## 1.3.2-hotfix.0

### Patch Changes

- Updated dependencies [[`f4e4632`](https://github.com/LedgerHQ/ledger-live/commit/f4e4632119cc0c33e327df9faa9d4951128818c0)]:
  - @ledgerhq/live-signer-evm@0.6.1-hotfix.0

## 1.3.1

### Patch Changes

- Updated dependencies [[`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e), [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b), [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`0e32a4e`](https://github.com/LedgerHQ/ledger-live/commit/0e32a4e5482ad2d3002483632770a2d7981b7a5a), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`769b0ed`](https://github.com/LedgerHQ/ledger-live/commit/769b0ed64b3a4c0388546ec00966d1185f3aea68), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604), [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713), [`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e)]:
  - @ledgerhq/live-signer-evm@0.6.0
  - @ledgerhq/coin-evm@2.24.0
  - @ledgerhq/cryptoassets@13.22.0
  - @ledgerhq/coin-framework@5.7.0
  - @ledgerhq/types-live@6.78.0
  - @ledgerhq/coin-tester@0.7.1

## 1.3.1-next.0

### Patch Changes

- Updated dependencies [[`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e), [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b), [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`0e32a4e`](https://github.com/LedgerHQ/ledger-live/commit/0e32a4e5482ad2d3002483632770a2d7981b7a5a), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`769b0ed`](https://github.com/LedgerHQ/ledger-live/commit/769b0ed64b3a4c0388546ec00966d1185f3aea68), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604), [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713), [`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e)]:
  - @ledgerhq/live-signer-evm@0.6.0-next.0
  - @ledgerhq/coin-evm@2.24.0-next.0
  - @ledgerhq/cryptoassets@13.22.0-next.0
  - @ledgerhq/coin-framework@5.7.0-next.0
  - @ledgerhq/types-live@6.78.0-next.0
  - @ledgerhq/coin-tester@0.7.1-next.0

## 1.3.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

### Patch Changes

- Updated dependencies [[`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791), [`d053a79`](https://github.com/LedgerHQ/ledger-live/commit/d053a7969ac7976ea6d10955c3cfa47621be1b32), [`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542), [`0232f73`](https://github.com/LedgerHQ/ledger-live/commit/0232f73efa73eb3a16c306f25dd110e12b9c1fb7), [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba)]:
  - @ledgerhq/coin-evm@2.23.0
  - @ledgerhq/types-live@6.77.0
  - @ledgerhq/coin-framework@5.6.0
  - @ledgerhq/live-signer-evm@0.5.6
  - @ledgerhq/coin-tester@0.7.0

## 1.3.0-next.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

### Patch Changes

- Updated dependencies [[`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791), [`d053a79`](https://github.com/LedgerHQ/ledger-live/commit/d053a7969ac7976ea6d10955c3cfa47621be1b32), [`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542), [`0232f73`](https://github.com/LedgerHQ/ledger-live/commit/0232f73efa73eb3a16c306f25dd110e12b9c1fb7), [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba)]:
  - @ledgerhq/coin-evm@2.23.0-next.0
  - @ledgerhq/types-live@6.77.0-next.0
  - @ledgerhq/coin-framework@5.6.0-next.0
  - @ledgerhq/live-signer-evm@0.5.6-next.0
  - @ledgerhq/coin-tester@0.7.0

## 1.2.0

### Minor Changes

- [#10743](https://github.com/LedgerHQ/ledger-live/pull/10743) [`539ac89`](https://github.com/LedgerHQ/ledger-live/commit/539ac893ff233a7d90dfcd205c39e1403680a837) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Sonic url in coin tester

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`c3c2069`](https://github.com/LedgerHQ/ledger-live/commit/c3c2069976c43ebca2bce7896036efd071a22814), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0
  - @ledgerhq/types-live@6.76.0
  - @ledgerhq/coin-framework@5.5.0
  - @ledgerhq/coin-evm@2.22.6
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.5

## 1.2.0-next.0

### Minor Changes

- [#10743](https://github.com/LedgerHQ/ledger-live/pull/10743) [`539ac89`](https://github.com/LedgerHQ/ledger-live/commit/539ac893ff233a7d90dfcd205c39e1403680a837) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Sonic url in coin tester

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`c3c2069`](https://github.com/LedgerHQ/ledger-live/commit/c3c2069976c43ebca2bce7896036efd071a22814), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0-next.0
  - @ledgerhq/types-live@6.76.0-next.0
  - @ledgerhq/coin-framework@5.5.0-next.0
  - @ledgerhq/coin-evm@2.22.6-next.0
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.5-next.0

## 1.1.11

### Patch Changes

- Updated dependencies [[`2274597`](https://github.com/LedgerHQ/ledger-live/commit/227459709ec157b7e49db4e75c52525e15acd8d2), [`7a1b8c8`](https://github.com/LedgerHQ/ledger-live/commit/7a1b8c8e59383efb02676cfe647c5889a31372bc), [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/types-live@6.75.0
  - @ledgerhq/cryptoassets@13.20.0
  - @ledgerhq/coin-framework@5.4.1
  - @ledgerhq/coin-evm@2.22.5
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.4

## 1.1.11-next.0

### Patch Changes

- Updated dependencies [[`2274597`](https://github.com/LedgerHQ/ledger-live/commit/227459709ec157b7e49db4e75c52525e15acd8d2), [`7a1b8c8`](https://github.com/LedgerHQ/ledger-live/commit/7a1b8c8e59383efb02676cfe647c5889a31372bc), [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/types-live@6.75.0-next.0
  - @ledgerhq/cryptoassets@13.20.0-next.0
  - @ledgerhq/coin-framework@5.4.1-next.0
  - @ledgerhq/coin-evm@2.22.5-next.0
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.4-next.0

## 1.1.10

### Patch Changes

- Updated dependencies [[`e65c386`](https://github.com/LedgerHQ/ledger-live/commit/e65c386cfb3e53e3ee9f501dc08971a93eb5cf81), [`9ceee03`](https://github.com/LedgerHQ/ledger-live/commit/9ceee03c33c41bb035fe64f9303acd36872536b6), [`98eb2eb`](https://github.com/LedgerHQ/ledger-live/commit/98eb2ebce8e12742a68b8f54ba625d63c4958087), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e), [`e9739d1`](https://github.com/LedgerHQ/ledger-live/commit/e9739d19946376dd7a8a5f10471594f267f3a95f)]:
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/types-live@6.74.0
  - @ledgerhq/coin-framework@5.4.0
  - @ledgerhq/cryptoassets@13.19.0
  - @ledgerhq/coin-evm@2.22.4
  - @ledgerhq/live-signer-evm@0.5.3

## 1.1.10-next.0

### Patch Changes

- Updated dependencies [[`e65c386`](https://github.com/LedgerHQ/ledger-live/commit/e65c386cfb3e53e3ee9f501dc08971a93eb5cf81), [`9ceee03`](https://github.com/LedgerHQ/ledger-live/commit/9ceee03c33c41bb035fe64f9303acd36872536b6), [`98eb2eb`](https://github.com/LedgerHQ/ledger-live/commit/98eb2ebce8e12742a68b8f54ba625d63c4958087), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e), [`e9739d1`](https://github.com/LedgerHQ/ledger-live/commit/e9739d19946376dd7a8a5f10471594f267f3a95f)]:
  - @ledgerhq/coin-tester@0.7.0-next.0
  - @ledgerhq/types-live@6.74.0-next.0
  - @ledgerhq/coin-framework@5.4.0-next.0
  - @ledgerhq/cryptoassets@13.19.0-next.0
  - @ledgerhq/coin-evm@2.22.4-next.0
  - @ledgerhq/live-signer-evm@0.5.3-next.0

## 1.1.9

### Patch Changes

- Updated dependencies [[`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431), [`b7d3d59`](https://github.com/LedgerHQ/ledger-live/commit/b7d3d59d299c3d3541d598536651b9047fda4526), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/coin-framework@5.3.0
  - @ledgerhq/types-live@6.73.0
  - @ledgerhq/coin-evm@2.22.3
  - @ledgerhq/cryptoassets@13.18.1
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/live-signer-evm@0.5.2

## 1.1.9-next.1

### Patch Changes

- Updated dependencies [[`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431)]:
  - @ledgerhq/coin-framework@5.3.0-next.1
  - @ledgerhq/coin-evm@2.22.3-next.1
  - @ledgerhq/live-signer-evm@0.5.2-next.1

## 1.1.9-next.0

### Patch Changes

- Updated dependencies [[`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`b7d3d59`](https://github.com/LedgerHQ/ledger-live/commit/b7d3d59d299c3d3541d598536651b9047fda4526), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/coin-framework@5.3.0-next.0
  - @ledgerhq/types-live@6.73.0-next.0
  - @ledgerhq/coin-evm@2.22.3-next.0
  - @ledgerhq/cryptoassets@13.18.1-next.0
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/live-signer-evm@0.5.2-next.0

## 1.1.8

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0
  - @ledgerhq/coin-framework@5.2.0
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/coin-evm@2.22.2
  - @ledgerhq/live-signer-evm@0.5.1

## 1.1.8-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.2.0-next.2
  - @ledgerhq/coin-evm@2.22.2-next.2
  - @ledgerhq/live-signer-evm@0.5.1-next.2
  - @ledgerhq/coin-tester@0.6.0-next.2

## 1.1.8-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.2.0-next.1
  - @ledgerhq/coin-evm@2.22.2-next.1
  - @ledgerhq/live-signer-evm@0.5.1-next.1
  - @ledgerhq/coin-tester@0.6.0-next.1

## 1.1.8-next.0

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0-next.0
  - @ledgerhq/coin-framework@5.2.0-next.0
  - @ledgerhq/coin-tester@0.6.0-next.0
  - @ledgerhq/coin-evm@2.22.2-next.0
  - @ledgerhq/live-signer-evm@0.5.1-next.0

## 1.1.7

### Patch Changes

- Updated dependencies [[`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/live-signer-evm@0.5.0
  - @ledgerhq/cryptoassets@13.18.0
  - @ledgerhq/coin-framework@5.1.0
  - @ledgerhq/types-live@6.71.0
  - @ledgerhq/coin-evm@2.22.1
  - @ledgerhq/coin-tester@0.5.1

## 1.1.7-next.0

### Patch Changes

- Updated dependencies [[`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/live-signer-evm@0.5.0-next.0
  - @ledgerhq/cryptoassets@13.18.0-next.0
  - @ledgerhq/coin-framework@5.1.0-next.0
  - @ledgerhq/types-live@6.71.0-next.0
  - @ledgerhq/coin-evm@2.22.1-next.0
  - @ledgerhq/coin-tester@0.5.1-next.0

## 1.1.6

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162), [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4)]:
  - @ledgerhq/cryptoassets@13.17.0
  - @ledgerhq/coin-evm@2.22.0
  - @ledgerhq/coin-framework@5.0.2
  - @ledgerhq/live-signer-evm@0.4.2

## 1.1.6-next.0

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162), [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4)]:
  - @ledgerhq/cryptoassets@13.17.0-next.0
  - @ledgerhq/coin-evm@2.22.0-next.0
  - @ledgerhq/coin-framework@5.0.2-next.0
  - @ledgerhq/live-signer-evm@0.4.1-next.0

## 1.1.5

### Patch Changes

- Updated dependencies [[`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`612a274`](https://github.com/LedgerHQ/ledger-live/commit/612a274abd1692aa9fab450854ab12ff90f6e41e)]:
  - @ledgerhq/live-signer-evm@0.4.1

## 1.1.5-hotfix.0

### Patch Changes

- Updated dependencies [[`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`612a274`](https://github.com/LedgerHQ/ledger-live/commit/612a274abd1692aa9fab450854ab12ff90f6e41e)]:
  - @ledgerhq/live-signer-evm@0.4.1-hotfix.0

## 1.1.4

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0
  - @ledgerhq/coin-evm@2.21.0
  - @ledgerhq/live-signer-evm@0.4.0
  - @ledgerhq/coin-framework@5.0.1
  - @ledgerhq/coin-tester@0.5.0

## 1.1.4-next.0

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0-next.0
  - @ledgerhq/coin-evm@2.21.0-next.0
  - @ledgerhq/live-signer-evm@0.4.0-next.0
  - @ledgerhq/coin-framework@5.0.1-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.3

### Patch Changes

- Updated dependencies [[`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63), [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/coin-evm@2.20.0
  - @ledgerhq/types-cryptoassets@7.23.0
  - @ledgerhq/cryptoassets@13.16.0
  - @ledgerhq/types-live@6.69.0
  - @ledgerhq/coin-framework@5.0.0
  - @ledgerhq/live-signer-evm@0.3.2
  - @ledgerhq/coin-tester@0.5.0

## 1.1.3-next.0

### Patch Changes

- Updated dependencies [[`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63), [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/coin-evm@2.20.0-next.0
  - @ledgerhq/types-cryptoassets@7.23.0-next.0
  - @ledgerhq/cryptoassets@13.16.0-next.0
  - @ledgerhq/types-live@6.69.0-next.0
  - @ledgerhq/coin-framework@5.0.0-next.0
  - @ledgerhq/live-signer-evm@0.3.2-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0
  - @ledgerhq/coin-evm@2.19.1
  - @ledgerhq/live-signer-evm@0.3.1

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0-next.0
  - @ledgerhq/coin-evm@2.19.1-next.0
  - @ledgerhq/live-signer-evm@0.3.1-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0
  - @ledgerhq/coin-evm@2.19.0
  - @ledgerhq/live-signer-evm@0.3.0
  - @ledgerhq/coin-framework@3.0.1
  - @ledgerhq/coin-tester@0.5.0

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0-next.0
  - @ledgerhq/coin-evm@2.19.0-next.0
  - @ledgerhq/live-signer-evm@0.3.0-next.0
  - @ledgerhq/coin-framework@3.0.1-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.0

### Minor Changes

- [#9919](https://github.com/LedgerHQ/ledger-live/pull/9919) [`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65) Thanks [@qperrot](https://github.com/qperrot)! - Move all coin tester into its own coin tester modules

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65), [`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-tester@0.5.0
  - @ledgerhq/types-live@6.67.0
  - @ledgerhq/coin-evm@2.18.0
  - @ledgerhq/coin-framework@3.0.0
  - @ledgerhq/cryptoassets@13.15.0
  - @ledgerhq/types-cryptoassets@7.22.0
  - @ledgerhq/live-signer-evm@0.2.5

## 1.1.0-next.0

### Minor Changes

- [#9919](https://github.com/LedgerHQ/ledger-live/pull/9919) [`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65) Thanks [@qperrot](https://github.com/qperrot)! - Move all coin tester into its own coin tester modules

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65), [`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-tester@0.5.0-next.0
  - @ledgerhq/types-live@6.67.0-next.0
  - @ledgerhq/coin-evm@2.18.0-next.0
  - @ledgerhq/coin-framework@3.0.0-next.0
  - @ledgerhq/cryptoassets@13.15.0-next.0
  - @ledgerhq/types-cryptoassets@7.22.0-next.0
  - @ledgerhq/live-signer-evm@0.2.5-next.0
