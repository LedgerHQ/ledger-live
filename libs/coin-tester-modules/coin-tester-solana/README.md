# @ledgerhq/coin-tester-solana

This package contains the deterministic testing infrastructure for Solana in Ledger Live.

## Features

- Deterministic testing scenarios for Solana
- Local signer written in Typescript
- Integration with Agave for local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "@ledgerhq/coin-tester-solana";

// Run a test scenario
await executeScenario(scenarioSolana);
```

## Development

Run the tests with `pnpm start`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-solana
