# @ledgerhq/coin-tester-evm

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for EVM-based coins in Ledger Live.

## Features

- Deterministic testing scenarios for EVM-based coins
- Support for multiple EVM chains (Ethereum, Polygon, Scroll, Optimism, Sonic, Robinhood, Arc, Core, Alpen Testnet)
- Local signer written in Typescript
- The Base and Sonic scenarios ask coin-sandbox for reth 2.5.2 (Base's build, 1.5.0) and sonic 2.2.5 (the versions of production) and their `etherscan-stub` indexer: the Etherscan API of
  the chain, served from the node, which Live reads as an `etherscan` explorer (as in production) and which needs no wait for indexing. USDC (USDC.e on Sonic) is preloaded
  at its mainnet address and the account is funded by airdrop. No mock, and any request that leaves the machine fails
- The Ethereum, Polygon, BNB, Optimism and Scroll scenarios ask coin-sandbox for a real node (geth 1.17.9 on Ethereum, bsc 1.8.2 (BNB Chain's geth fork) on BNB, bor 2.10.2,
  op-reth 2.6.1 on Optimism, l2geth 5.10.2 on Scroll: the versions of production) and its indexer: Atlas, and Blockscout 12.0.3 (built for the
  optimism chain type on Optimism, and for the scroll chain type on Scroll) on Optimism and Scroll. USDC (USDT on BNB) is
  preloaded by coin-sandbox at its mainnet address, and the account is funded by airdrop. No mock: the indexer is the explorer (and the gas tracker
  but on Optimism and Scroll, which ask their node), and any request that leaves the machine fails
- The Robinhood scenario asks coin-sandbox for nitro 3.12.2 (the version of production) and Blockscout 12.0.3, which Live reads as a `blockscout` explorer. USDG
  is preloaded at its mainnet address and the account is funded by airdrop (ETH and USDG): the scenario sends 1 ETH, 1 USDG, all its USDG and all its ETH. No mock, and any request that leaves the machine fails
- The Arc scenario asks coin-sandbox for arc-node 0.8.1 (Arc's execution client, alone) and Blockscout 12.0.3 built for the `arc` chain type, which Live reads as a `blockscout` explorer. USDC is the native coin of the chain
  (the explorer also reports each native transfer as a transfer of the USDC token `0x36…`, which `nativeContracts` makes Live drop, and the scenario checks both); the account is funded by airdrop. No mock, and any request that leaves the machine fails
- The Core scenario asks coin-sandbox for Core's own client, geth 1.0.27 (a fork of geth, the version of production), alone: Live has no explorer for Core
  (`explorer: none`), so the node is the only source, and a sync waits for the block of each transaction. No token is preloaded and the account is funded by
  airdrop: the scenario sends 1 CORE and all its CORE. No mock, and any request that leaves the machine fails
- The Alpen Testnet scenario asks coin-sandbox for alpen-client 0.4.0 (Alpen's execution client, a reth, the version of production) and Blockscout 12.0.3, which Live
  reads as a `blockscout` explorer. The sequencer runs in its test mode (no orchestration layer, a private regtest bitcoind for its batches). WABTC (tWABTC in the CAL) is preloaded
  at its testnet address and the account is funded by airdrop (BTC and tWABTC): the scenario sends 1 BTC, 1 tWABTC, all its tWABTC and all its BTC, and checks that Live
  sends them as legacy transactions priced at the `minGasPrice` floor or above, as its configuration asks. No mock, and any request that leaves the machine fails

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioEthereum } from "@ledgerhq/coin-tester-evm";

// Run a test scenario
await executeScenario(scenarioEthereum);
```

## Development

Run the tests with `pnpm coin:tester:evm start`. The Ethereum, Polygon, BNB, Optimism, Scroll, Base, Sonic, Robinhood, Arc, Core and Alpen Testnet scenarios need coin-sandbox's server running (`deno task
server` in its repository, port 8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker daemon, and `docker login
jfrog.ledgerlabs.net` for the Atlas images (amd64 only, so emulated on Apple Silicon; Optimism and Scroll have none, and the node images of Scroll and Core are amd64 only too). It takes about a minute. To run one scenario:
`pnpm coin:tester:evm start -t "scenario BNB"`.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-evm
- @ledgerhq/live-common
