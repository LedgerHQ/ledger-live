# @features/flow-receive

## 0.3.0

### Minor Changes

- [#25127](https://github.com/LedgerHQ/ledger-live/pull/25127) [`aff97a0`](https://github.com/LedgerHQ/ledger-live/commit/aff97a0a8888e85a66b8d121f41adfa2ea884673) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Verify the receive address on the device with the Device Intent Executor, and show whether it matches once the user confirms on the device

- [#24775](https://github.com/LedgerHQ/ledger-live/pull/24775) [`99b84d2`](https://github.com/LedgerHQ/ledger-live/commit/99b84d26e7fe249a2d322d54472790afffaa4807) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add toReceiveTarget to find the account and asset to receive on in the account model

- [#25176](https://github.com/LedgerHQ/ledger-live/pull/25176) [`e53d295`](https://github.com/LedgerHQ/ledger-live/commit/e53d295fcb840a2e8a8433daac282a6f22098707) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the asset, its network and a close button in the header of the new receive address dialog

- [#25181](https://github.com/LedgerHQ/ledger-live/pull/25181) [`6157b78`](https://github.com/LedgerHQ/ledger-live/commit/6157b78b2e7055b1389f7ed64a2fcccf26200c39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a close button, the asset and its network with its icon at the top of the new receive address screen

- [#25173](https://github.com/LedgerHQ/ledger-live/pull/25173) [`a8363ee`](https://github.com/LedgerHQ/ledger-live/commit/a8363eeb2cd97ce1942bfe0938ec317536e630c6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the asset received and its network on the new receive address screen

- [#25133](https://github.com/LedgerHQ/ledger-live/pull/25133) [`ac052f5`](https://github.com/LedgerHQ/ledger-live/commit/ac052f5c42e9151f445e3ff4b20e811fbcfa84b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Lay out the zones of the new receive address screen

- [#25225](https://github.com/LedgerHQ/ledger-live/pull/25225) [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Animate the receive QR code on desktop too: a shimmer while the address loads, and a ripple when it is copied from the code or the Copy button

- [#25061](https://github.com/LedgerHQ/ledger-live/pull/25061) [`3c9c36d`](https://github.com/LedgerHQ/ledger-live/commit/3c9c36d4b6aba6232f04e124157bd8df08cf89da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route the receive entry points through one rule that opens the new receive screen behind the newReceiveFlow flag; onboarding keeps the legacy receive screen

- [#25047](https://github.com/LedgerHQ/ledger-live/pull/25047) [`b15271c`](https://github.com/LedgerHQ/ledger-live/commit/b15271ca307f00e929474a1560e64fd2af49b75e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every receive entry point through one rule that opens the new receive dialog behind the newReceiveFlow flag

- [#25192](https://github.com/LedgerHQ/ledger-live/pull/25192) [`85a7d14`](https://github.com/LedgerHQ/ledger-live/commit/85a7d14d54b4f7f411a3789e310e6f1b8d2d79bb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the address shown on the new receive address screen, with the Zcash choice between its public and private addresses

- [#25196](https://github.com/LedgerHQ/ledger-live/pull/25196) [`c4792da`](https://github.com/LedgerHQ/ledger-live/commit/c4792da62785d15ebbb543c81f444aeb6a62bafc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the QR card and the address on the new receive address dialog, and the Zcash choice between public and private addresses

- [#25209](https://github.com/LedgerHQ/ledger-live/pull/25209) [`4ff1d9a`](https://github.com/LedgerHQ/ledger-live/commit/4ff1d9a587abb474300d0e1c188eeb62b0de66ea) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the animated QR card and the address on the new receive address screen, and the Zcash choice between public and private addresses

- [#25160](https://github.com/LedgerHQ/ledger-live/pull/25160) [`f7f5295`](https://github.com/LedgerHQ/ledger-live/commit/f7f529560de8f7ee9d2ddf98f048610b9335d550) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the new receive screen data from the account model, and tell Tron's inactive account from its account status

- [#25222](https://github.com/LedgerHQ/ledger-live/pull/25222) [`c5ad33d`](https://github.com/LedgerHQ/ledger-live/commit/c5ad33db466f7a5eaf24a70f571afdbf2496979a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a skeleton on the new receive address screen while the address loads, and an error with Retry when it cannot be read

### Patch Changes

- Updated dependencies [[`e1db61a`](https://github.com/LedgerHQ/ledger-live/commit/e1db61afaa383e6c5f0f5608ac0c7cf83436fff6), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`27f3e4e`](https://github.com/LedgerHQ/ledger-live/commit/27f3e4eb74ac31f0f53aa55803ad7f082f669fe3), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`fe1f525`](https://github.com/LedgerHQ/ledger-live/commit/fe1f5257edcee5b92db6153e9f7d619104446294), [`6ad80e8`](https://github.com/LedgerHQ/ledger-live/commit/6ad80e84789de8da5726d52fc27335655a62c2aa), [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7), [`36284d6`](https://github.com/LedgerHQ/ledger-live/commit/36284d633c1961face1500f58fa2fc271cfb8ab5), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9), [`de9c09c`](https://github.com/LedgerHQ/ledger-live/commit/de9c09c26ebca7c2dbceb9494de70a2c16c75a70)]:
  - @features/platform-intent-verify-address@0.5.0
  - @domain/entity-account-status@0.1.0
  - @shared/feature-flags@0.32.0
  - @domain/entity-account-descriptor@0.7.0
  - @shared/ui-animated-qr-code@0.2.0
  - @features/platform-device-intent@5.6.0
  - @shared/analytics@0.5.0
  - @domain/entity-currency@0.5.1
  - @features/platform-currencies@0.14.1
  - @domain/entity-account@0.4.1
  - @domain/entity-account-data@0.6.1
  - @domain/entity-account-receive@0.1.1
  - @features/platform-account-data@0.4.2

## 0.3.0-next.0

### Minor Changes

- [#25127](https://github.com/LedgerHQ/ledger-live/pull/25127) [`aff97a0`](https://github.com/LedgerHQ/ledger-live/commit/aff97a0a8888e85a66b8d121f41adfa2ea884673) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Verify the receive address on the device with the Device Intent Executor, and show whether it matches once the user confirms on the device

- [#24775](https://github.com/LedgerHQ/ledger-live/pull/24775) [`99b84d2`](https://github.com/LedgerHQ/ledger-live/commit/99b84d26e7fe249a2d322d54472790afffaa4807) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add toReceiveTarget to find the account and asset to receive on in the account model

- [#25176](https://github.com/LedgerHQ/ledger-live/pull/25176) [`e53d295`](https://github.com/LedgerHQ/ledger-live/commit/e53d295fcb840a2e8a8433daac282a6f22098707) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the asset, its network and a close button in the header of the new receive address dialog

- [#25181](https://github.com/LedgerHQ/ledger-live/pull/25181) [`6157b78`](https://github.com/LedgerHQ/ledger-live/commit/6157b78b2e7055b1389f7ed64a2fcccf26200c39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a close button, the asset and its network with its icon at the top of the new receive address screen

- [#25173](https://github.com/LedgerHQ/ledger-live/pull/25173) [`a8363ee`](https://github.com/LedgerHQ/ledger-live/commit/a8363eeb2cd97ce1942bfe0938ec317536e630c6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the asset received and its network on the new receive address screen

- [#25133](https://github.com/LedgerHQ/ledger-live/pull/25133) [`ac052f5`](https://github.com/LedgerHQ/ledger-live/commit/ac052f5c42e9151f445e3ff4b20e811fbcfa84b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Lay out the zones of the new receive address screen

- [#25225](https://github.com/LedgerHQ/ledger-live/pull/25225) [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Animate the receive QR code on desktop too: a shimmer while the address loads, and a ripple when it is copied from the code or the Copy button

- [#25061](https://github.com/LedgerHQ/ledger-live/pull/25061) [`3c9c36d`](https://github.com/LedgerHQ/ledger-live/commit/3c9c36d4b6aba6232f04e124157bd8df08cf89da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route the receive entry points through one rule that opens the new receive screen behind the newReceiveFlow flag; onboarding keeps the legacy receive screen

- [#25047](https://github.com/LedgerHQ/ledger-live/pull/25047) [`b15271c`](https://github.com/LedgerHQ/ledger-live/commit/b15271ca307f00e929474a1560e64fd2af49b75e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every receive entry point through one rule that opens the new receive dialog behind the newReceiveFlow flag

- [#25192](https://github.com/LedgerHQ/ledger-live/pull/25192) [`85a7d14`](https://github.com/LedgerHQ/ledger-live/commit/85a7d14d54b4f7f411a3789e310e6f1b8d2d79bb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the address shown on the new receive address screen, with the Zcash choice between its public and private addresses

- [#25196](https://github.com/LedgerHQ/ledger-live/pull/25196) [`c4792da`](https://github.com/LedgerHQ/ledger-live/commit/c4792da62785d15ebbb543c81f444aeb6a62bafc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the QR card and the address on the new receive address dialog, and the Zcash choice between public and private addresses

- [#25209](https://github.com/LedgerHQ/ledger-live/pull/25209) [`4ff1d9a`](https://github.com/LedgerHQ/ledger-live/commit/4ff1d9a587abb474300d0e1c188eeb62b0de66ea) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the animated QR card and the address on the new receive address screen, and the Zcash choice between public and private addresses

- [#25160](https://github.com/LedgerHQ/ledger-live/pull/25160) [`f7f5295`](https://github.com/LedgerHQ/ledger-live/commit/f7f529560de8f7ee9d2ddf98f048610b9335d550) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the new receive screen data from the account model, and tell Tron's inactive account from its account status

- [#25222](https://github.com/LedgerHQ/ledger-live/pull/25222) [`c5ad33d`](https://github.com/LedgerHQ/ledger-live/commit/c5ad33db466f7a5eaf24a70f571afdbf2496979a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a skeleton on the new receive address screen while the address loads, and an error with Retry when it cannot be read

### Patch Changes

- Updated dependencies [[`e1db61a`](https://github.com/LedgerHQ/ledger-live/commit/e1db61afaa383e6c5f0f5608ac0c7cf83436fff6), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`27f3e4e`](https://github.com/LedgerHQ/ledger-live/commit/27f3e4eb74ac31f0f53aa55803ad7f082f669fe3), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`fe1f525`](https://github.com/LedgerHQ/ledger-live/commit/fe1f5257edcee5b92db6153e9f7d619104446294), [`6ad80e8`](https://github.com/LedgerHQ/ledger-live/commit/6ad80e84789de8da5726d52fc27335655a62c2aa), [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7), [`36284d6`](https://github.com/LedgerHQ/ledger-live/commit/36284d633c1961face1500f58fa2fc271cfb8ab5), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9), [`de9c09c`](https://github.com/LedgerHQ/ledger-live/commit/de9c09c26ebca7c2dbceb9494de70a2c16c75a70)]:
  - @features/platform-intent-verify-address@0.5.0-next.0
  - @domain/entity-account-status@0.1.0-next.0
  - @shared/feature-flags@0.32.0-next.0
  - @domain/entity-account-descriptor@0.7.0-next.0
  - @shared/ui-animated-qr-code@0.2.0-next.0
  - @features/platform-device-intent@5.6.0-next.0
  - @shared/analytics@0.5.0-next.0
  - @domain/entity-currency@0.5.1-next.0
  - @features/platform-currencies@0.14.1-next.0
  - @domain/entity-account@0.4.1-next.0
  - @domain/entity-account-data@0.6.1-next.0
  - @domain/entity-account-receive@0.1.1-next.0
  - @features/platform-account-data@0.4.2-next.0

## 0.2.0

### Minor Changes

- [#24798](https://github.com/LedgerHQ/ledger-live/pull/24798) [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the receive verify hint state from `@features/flow-pay-request/state` to `@features/flow-receive/state`

- [#24859](https://github.com/LedgerHQ/ledger-live/pull/24859) [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the receive family contract: notices, support and unsupported device models of the new receive address screen per coin family

- [#24849](https://github.com/LedgerHQ/ledger-live/pull/24849) [`4ce1aca`](https://github.com/LedgerHQ/ledger-live/commit/4ce1acad62b9bb4b186a6fba14fce381b699d2c2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Address securely displayed screen of the receive flow

- [#24765](https://github.com/LedgerHQ/ledger-live/pull/24765) [`4a749db`](https://github.com/LedgerHQ/ledger-live/commit/4a749db93ffbb57b2296315869df761a6a2ed6ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the @features/flow-receive package

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab)]:
  - @shared/feature-flags@0.31.0
  - @domain/entity-account-descriptor@0.6.0
  - @domain/entity-account-receive@0.1.0
  - @shared/ui-info-state@0.8.0

## 0.2.0-next.0

### Minor Changes

- [#24798](https://github.com/LedgerHQ/ledger-live/pull/24798) [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the receive verify hint state from `@features/flow-pay-request/state` to `@features/flow-receive/state`

- [#24859](https://github.com/LedgerHQ/ledger-live/pull/24859) [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the receive family contract: notices, support and unsupported device models of the new receive address screen per coin family

- [#24849](https://github.com/LedgerHQ/ledger-live/pull/24849) [`4ce1aca`](https://github.com/LedgerHQ/ledger-live/commit/4ce1acad62b9bb4b186a6fba14fce381b699d2c2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Address securely displayed screen of the receive flow

- [#24765](https://github.com/LedgerHQ/ledger-live/pull/24765) [`4a749db`](https://github.com/LedgerHQ/ledger-live/commit/4a749db93ffbb57b2296315869df761a6a2ed6ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the @features/flow-receive package

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab)]:
  - @shared/feature-flags@0.31.0-next.0
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-receive@0.1.0-next.0
  - @shared/ui-info-state@0.8.0-next.0
