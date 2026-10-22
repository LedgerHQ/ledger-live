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

## Development

Run the tests with `pnpm start`. It needs a running Docker daemon: the Yaci DevKit devnet runs from `docker-compose.yml` (store on `:8080`, admin API on `:10000`).

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cardano
