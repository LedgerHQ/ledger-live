# @ledgerhq/coin-tester-evm

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for EVM-based coins in Ledger Live.

## Features

- Deterministic testing scenarios for EVM-based coins
- Support for multiple EVM chains (Ethereum, Polygon, Scroll, Blast, Sonic)
- Local signer written in Typescript
- The Ethereum, Polygon, BNB and Base scenarios ask coin-sandbox for a real node (geth 1.17.9 on Ethereum, bsc 1.8.1 (BNB Chain's geth fork) on BNB, bor 2.10.2,
  reth 2.5.2 (Base's build, 1.5.0) on Base: the versions of production) and its indexer: Atlas, and Blockscout 12.0.3 on Base. USDC (USDT on BNB) is
  preloaded by coin-sandbox at its mainnet address, and the account is funded by airdrop. No mock: the indexer is the explorer (and the gas tracker
  but on Base, which asks its node), and any request that leaves the machine fails
- The other scenarios still use Anvil, a mainnet fork, and a mocked explorer

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioEthereum } from "@ledgerhq/coin-tester-evm";

// Run a test scenario
await executeScenario(scenarioEthereum);
```

## Development

Run the tests with `pnpm coin:tester:evm start`. The Ethereum, Polygon, BNB and Base scenarios need coin-sandbox's server running (`deno task
server` in its repository, port 8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker daemon, and `docker login
jfrog.ledgerlabs.net` for the Atlas images (amd64 only, so emulated on Apple Silicon; Base has none). It takes about a minute. The
others need Docker for Anvil and network access to their fork RPC. To run one scenario:
`pnpm coin:tester:evm start -t "scenario BNB"`.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-evm
- @ledgerhq/live-common
