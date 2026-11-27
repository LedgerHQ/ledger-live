# @features/platform-device-onboarding-analytics

## 0.2.0-next.0

### Minor Changes

- [#25648](https://github.com/LedgerHQ/ledger-live/pull/25648) [`1e94445`](https://github.com/LedgerHQ/ledger-live/commit/1e9444520d0b561f5ecafd9d053c8de2b166d12b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send onboarding_done at the end of the unseeded device onboarding

- [#25405](https://github.com/LedgerHQ/ledger-live/pull/25405) [`e1effae`](https://github.com/LedgerHQ/ledger-live/commit/e1effae27267fcbb14150d17fe2086459d34f8f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Track the unseeded device onboarding funnel. Seeded and unseeded events share the same props

- [#25503](https://github.com/LedgerHQ/ledger-live/pull/25503) [`31cc80c`](https://github.com/LedgerHQ/ledger-live/commit/31cc80c18f3eeed000ce3ee3d97e8e1bdcd1bb37) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Add a recover param to the deviceOnboarding feature flag, on by default. Turning it off hides the Ledger Recover steps of the unseeded device flow

- [#23582](https://github.com/LedgerHQ/ledger-live/pull/23582) [`70c8b31`](https://github.com/LedgerHQ/ledger-live/commit/70c8b31c99c3a3dbabc09b0a24c9627ad8427b80) Thanks [@sarneijim](https://github.com/sarneijim)! - Track the seeded device onboarding funnel

### Patch Changes

- Updated dependencies [[`faeace9`](https://github.com/LedgerHQ/ledger-live/commit/faeace97ae3de8c6e403e66732bdc16d57d78296), [`5befcc7`](https://github.com/LedgerHQ/ledger-live/commit/5befcc7d3a56005bd5aedda561005541d723e956), [`fd07a09`](https://github.com/LedgerHQ/ledger-live/commit/fd07a09d0173d98646695b640080212a94bc9a5a), [`9e67809`](https://github.com/LedgerHQ/ledger-live/commit/9e678098ea38d509fc4f19ffe05a2f06003a41c5), [`0568a9d`](https://github.com/LedgerHQ/ledger-live/commit/0568a9d51bcc7244bad8ae415c7775697fc93811), [`7627a66`](https://github.com/LedgerHQ/ledger-live/commit/7627a66e667eb4b00ca417603c39d0adf5e2a094), [`5ea4203`](https://github.com/LedgerHQ/ledger-live/commit/5ea4203bdc7b89f7ef0ffe12ae9036b679320a97), [`089284b`](https://github.com/LedgerHQ/ledger-live/commit/089284b16bfee3dd5f6255799c58f5c8dbe108c8), [`35e9ca8`](https://github.com/LedgerHQ/ledger-live/commit/35e9ca85552282ddc37c47bc4212c81b06a2ee2c), [`4779bbd`](https://github.com/LedgerHQ/ledger-live/commit/4779bbd567b2f36cf01751c022a978b2d93cf288), [`e1effae`](https://github.com/LedgerHQ/ledger-live/commit/e1effae27267fcbb14150d17fe2086459d34f8f5), [`31cc80c`](https://github.com/LedgerHQ/ledger-live/commit/31cc80c18f3eeed000ce3ee3d97e8e1bdcd1bb37), [`513bdba`](https://github.com/LedgerHQ/ledger-live/commit/513bdba4eee8332446903bb853ec5bc608cb46b9), [`62493e1`](https://github.com/LedgerHQ/ledger-live/commit/62493e1d65a96ef1998f1ff8fd0e1880ae6190b9), [`78d27e7`](https://github.com/LedgerHQ/ledger-live/commit/78d27e7045c452d503ad88e1ffb4e2621ef00074)]:
  - @shared/feature-flags@0.33.0-next.0
  - @features/platform-device-onboarding@0.8.0-next.0
