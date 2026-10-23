# @ledgerhq/coin-tester-solana

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for `@ledgerhq/coin-solana`. Asks coin-sandbox for an Agave
validator and runs one scenario through the generic coin framework.

## Features

- Deterministic testing scenarios for Solana
- Local signer written in Typescript
- Agave 4.3.0 (the version and the features of production), started by coin-sandbox, with the four SPL tokens of the scenario preloaded and airdropped by it

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "@ledgerhq/coin-tester-solana";

// Run a test scenario
await executeScenario(scenarioSolana);
```

## Development

Run the tests with `pnpm coin:tester:solana start`. They need coin-sandbox's server running (`deno task server`
in its repository, port 8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker daemon. A full run takes ~35 s.

On Apple Silicon, coin-sandbox builds Agave from source the first time a version is used (about 7 minutes).
Anza ships no Linux arm64 release, and amd64 emulation lacks the io_uring Agave requires. Next runs use the Docker cache.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-solana
