# @ledgerhq/coin-tester-cardano

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for Cardano in Ledger Live.

## Features

- Deterministic testing scenarios for Cardano
- Local signer written in Typescript
- Integration with Yaci DevKit for local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioCardano } from "@ledgerhq/coin-tester-cardano";

// Run a test scenario
await executeScenario(scenarioCardano);
```

## Networks

| Scenarios | Currency | Backend |
| --- | --- | --- |
| `cardano`, `cardanoToken` | `cardano` (mainnet addresses) | In-memory MSW mock of the Strica API (`src/indexer.ts`). No node runs. |
| `cardanoYaci`, `cardanoTokenYaci`, and the `devnet`, `mintToken`, `negativeCases` suites | `cardano_testnet` | Local Yaci DevKit devnet, not preprod or preview. |

The devnet runs `bloxbean/yaci-cli:0.12.0` (cardano-node 11.0.1, yaci-store 2.0.7), pinned by digest in `docker-compose.yml`:

- Protocol version 11.0, yaci-cli's default and the version mainnet, preprod and preview ran when it was pinned ([LIVE-38485](https://ledgerhq.atlassian.net/browse/LIVE-38485)).
- Network magic 42 and network id 0, so addresses are `addr_test1…`.
- `src/devnet.test.ts` fails when the protocol version or the network magic changes.

To move to a newer protocol version, change the image tag and its digest in `docker-compose.yml`, then update the expected version in `src/devnet.test.ts`.

Staking (delegate, undelegate) runs on the mock only.

## Development

Run the tests with `pnpm start`. It needs a running Docker daemon: the Yaci DevKit devnet runs from `docker-compose.yml` (store on `:8080`, admin API on `:10000`). The image is multi-arch, so Apple Silicon runs it natively.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cardano
