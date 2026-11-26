# @ledgerhq/coin-tester-cardano

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for Cardano in Ledger Live.

## Features

- Deterministic testing scenarios for Cardano: ADA and native-token sends, token minting, refused sends
- Local signer written in Typescript
- Yaci DevKit devnet (cardano-node 11.0.1) at protocol version 11.0, the version mainnet, preprod and preview ran when it was pinned ([LIVE-38485](https://ledgerhq.atlassian.net/browse/LIVE-38485))

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioCardano } from "@ledgerhq/coin-tester-cardano";

// Run a test scenario
await executeScenario(scenarioCardano);
```

## Coverage

| Scenarios | Currency | Backend |
| --- | --- | --- |
| `cardano`, `cardanoToken` | `cardano` (mainnet addresses) | In-memory MSW mock of the Strica API (`src/indexer.ts`). No node runs. |
| `cardanoYaci`, `cardanoTokenYaci`, and the `devnet`, `mintToken`, `negativeCases` suites | `cardano_testnet` | Local Yaci DevKit devnet, not preprod or preview. |

Staking (delegate, undelegate) runs on the mock only.

## Verified contract of the pinned image

Measured on 2026-11-23 on `bloxbean/yaci-cli:0.12.0`, pinned by digest in `docker-compose.yml`. `src/devnet.test.ts` checks the protocol version, the network magic and the node mode on every run. Re-measure on every image bump.

| Property | Value |
| --- | --- |
| Node and store | cardano-node 11.0.1, yaci-store 2.0.7; amd64 and arm64 |
| Protocol version | 11.0, yaci-cli's default |
| Network | magic 42, network id 0, so addresses are `addr_test1…` |
| Node mode | `companion`. In the image's default `haskell-only` mode every faucet top-up answers 500 on protocol 11 ([yaci-devkit#184](https://github.com/bloxbean/yaci-devkit/issues/184)) |
| Boot | healthy in 20 to 29 s |
| Reset | 22 to 24 s; a stalled store adds yaci-devkit's 60 s wait for it |

To move to a newer protocol version, change the image tag and its digest in `docker-compose.yml`, then update the expected version in `src/devnet.test.ts`. Drop `nodeMode: companion` once the new image fixes yaci-devkit#184.

## Development

Run the tests with `pnpm coin:tester:cardano start`. They need a Docker daemon: the devnet runs from `docker-compose.yml` (store on `:8080`, admin API on `:10000`). A full run takes 2 to 3 minutes. The image is multi-arch, so Apple Silicon runs it natively.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cardano
