---
"@ledgerhq/live-common": patch
---

chore(llc): isolate flaky network-dependent integration tests into a weekly CI run

Several integration tests depend on flaky third-party/external nodes and explorers that
are intermittently unreachable (cosmos public RPC nodes, the Mina ledger explorer),
causing spurious failures on PRs and the daily integration run.
They are now excluded from those runs (via a `weeklyIntegrationTests` list in
`jest.config.ts`) and executed by a new weekly workflow through the
`ci-test-integration-weekly` script. The isolated suites are the cosmos `lastBlock` +
`datasets/{persistence,stargaze,quicksilver,xion}` and `mina/bridge` integration tests.
