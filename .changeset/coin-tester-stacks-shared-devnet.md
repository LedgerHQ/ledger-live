---
"@ledgerhq/coin-tester-stacks": patch
---

perf: run every scenario on one shared devnet, each with its own sender account

The legacy send, generic-adapter send and pox-5 staking runs each booted a Clarinet devnet from
genesis and waited again for the contract deployment batches, about 27 minutes of 10s blocks per
CI run. The devnet is now started once in the test file's `beforeAll` and torn down in
`afterAll`. Runs share the chain but not accounts: each signs with its own Clarinet default
account (`wallet_4`, `wallet_5`, `wallet_6`), and the deployer only funds the send runs' senders
with test-token, so no run starts on another's history or drained balance.
