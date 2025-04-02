# @ledgerhq/coin-tester-evm

This package contains the deterministic testing infrastructure for EVM-based coins in Ledger Live.

## Features

- Deterministic testing scenarios for EVM-based coins
- Support for multiple EVM chains (Ethereum, Polygon, Scroll, Blast, Sonic)
- Integration with Speculos for hardware wallet simulation
- Integration with Anvil for local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioEthereum } from "@ledgerhq/coin-tester-evm";

// Run a test scenario
await executeScenario(scenarioEthereum);
```

## Development

1. Set up your environment variables in `.env` (see `.env.example`)
2. Run the tests with `pnpm test`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-evm
- @ledgerhq/evm-tools
- @ledgerhq/env
- @ledgerhq/live-network
- @ledgerhq/ledger-live-common
