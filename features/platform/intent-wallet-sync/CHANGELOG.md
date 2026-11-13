# @features/platform-intent-wallet-sync

## 0.3.0-next.0

### Minor Changes

- [#24592](https://github.com/LedgerHQ/ledger-live/pull/24592) [`b04379b`](https://github.com/LedgerHQ/ledger-live/commit/b04379bbbb8fcbebcfd7fe49e2ad8226ffa6d806) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync intents DevTool, which runs the add member and remove member intents on the Device Intent Executor of each app and logs every job state, with the app renderers, executor wrappers and session SDK it needs

- [#24665](https://github.com/LedgerHQ/ledger-live/pull/24665) [`99d2480`](https://github.com/LedgerHQ/ledger-live/commit/99d2480ce988754fb2595a0fa0d7612ddfe77193) Thanks [@ysitbon](https://github.com/ysitbon)! - Build every Ledger Sync session SDK with the setup of the app's cached SDK, the one the wallet sync loop uses, through a shared `sessionWithDevice` adapter, so a member added on the device is known to the sync loop even when the flag environment arrives after the app started; the intents DevTool lists members with the app SDK again

- [#24690](https://github.com/LedgerHQ/ledger-live/pull/24690) [`44fc466`](https://github.com/LedgerHQ/ledger-live/commit/44fc466224cb5f03d68cda98d3cc23e652b38251) Thanks [@ysitbon](https://github.com/ysitbon)! - Run the Ledger Sync activation and instance removal device steps on the Device Intent Executor behind the `lwmLedgerSyncDie` flag, with an optional `onInitialResponse` input on the add member intent

### Patch Changes

- Updated dependencies [[`91056c1`](https://github.com/LedgerHQ/ledger-live/commit/91056c17c325bf042f6449c3ed74412adcb84899)]:
  - @features/platform-device-intent@5.5.0-next.0

## 0.2.0

### Minor Changes

- [#24527](https://github.com/LedgerHQ/ledger-live/pull/24527) [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync add member and remove member Device Intents, which run the Ledger Sync SDK on the Device Intent Executor session, a `ledger_sync` source flow, and the `lwmLedgerSyncDie` and `lwdLedgerSyncDie` flags, off by default

### Patch Changes

- Updated dependencies [[`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372)]:
  - @features/platform-device-intent@5.4.0

## 0.2.0-next.0

### Minor Changes

- [#24527](https://github.com/LedgerHQ/ledger-live/pull/24527) [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync add member and remove member Device Intents, which run the Ledger Sync SDK on the Device Intent Executor session, a `ledger_sync` source flow, and the `lwmLedgerSyncDie` and `lwdLedgerSyncDie` flags, off by default

### Patch Changes

- Updated dependencies [[`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372)]:
  - @features/platform-device-intent@5.4.0-next.0
