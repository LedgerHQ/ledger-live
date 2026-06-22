# @ledgerhq/coin-tester-cardano

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

Run the tests with `pnpm start`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-cardano
