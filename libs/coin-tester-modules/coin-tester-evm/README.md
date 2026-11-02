# @ledgerhq/coin-tester-evm

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for EVM-based coins in Ledger Live.

## Features

- Deterministic testing scenarios for EVM-based coins
- Support for multiple EVM chains (Ethereum, Polygon, Scroll, Optimism, Sonic)
- Local signer written in Typescript
- The Base scenario asks coin-sandbox for reth 2.5.2 (Base's build, 1.5.0, the version of production) and its `etherscan-stub` indexer: the Etherscan API of
  the chain, served from the node, which Live reads as an `etherscan` explorer (as in production) and which needs no wait for indexing. USDC is preloaded
  at its mainnet address and the account is funded by airdrop. No Anvil, no mock, and any request that leaves the machine fails
- The Ethereum, Polygon, BNB, Optimism and Scroll scenarios ask coin-sandbox for a real node (geth 1.17.9 on Ethereum, bsc 1.8.1 (BNB Chain's geth fork) on BNB, bor 2.10.2,
  op-reth 2.6.1 on Optimism, l2geth 5.10.2 on Scroll: the versions of production) and its indexer: Atlas, and Blockscout 12.0.3 (built for the
  optimism chain type on Optimism, and for the scroll chain type on Scroll) on Optimism and Scroll. USDC (USDT on BNB) is
  preloaded by coin-sandbox at its mainnet address, and the account is funded by airdrop. No mock: the indexer is the explorer (and the gas tracker
  but on Optimism and Scroll, which ask their node), and any request that leaves the machine fails
- The other scenarios still use Anvil, a mainnet fork, and a mocked explorer

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioEthereum } from "@ledgerhq/coin-tester-evm";

// Run a test scenario
await executeScenario(scenarioEthereum);
```

## Development

Run the tests with `pnpm coin:tester:evm start`. The Ethereum, Polygon, BNB, Optimism, Scroll and Base scenarios need coin-sandbox's server running (`deno task
server` in its repository, port 8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker daemon, and `docker login
jfrog.ledgerlabs.net` for the Atlas images (amd64 only, so emulated on Apple Silicon; Optimism and Scroll have none, and Scroll's node image is amd64 only too). It takes about a minute. The
others need Docker for Anvil and network access to their fork RPC. To run one scenario:
`pnpm coin:tester:evm start -t "scenario BNB"`.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-evm
- @ledgerhq/live-common
