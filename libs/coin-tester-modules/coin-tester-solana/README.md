# @ledgerhq/coin-tester-solana

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for Solana in Ledger Live.

## Features

- Deterministic testing scenarios for Solana
- Local signer written in Typescript
- Integration with Agave for local blockchain simulation, on two validators: `mainnet` (Agave version and features of production) and `devnet` (upcoming ones). Versions are pinned in `docker-compose.yml`.

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "@ledgerhq/coin-tester-solana";

// Run a test scenario
await executeScenario(scenarioSolana("devnet"), "generic-adapter");
```

## Development

Run the tests with `pnpm start`. It builds the Agave images before running the tests.

On Apple Silicon, Agave is built from source the first time each version is used (about 7 minutes per version). Anza ships no Linux arm64 release, and amd64 emulation lacks the io_uring Agave requires. Next runs use the Docker cache.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-solana
