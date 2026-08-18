# @ledgerhq/coin-tester-polkadot

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for Polkadot in Ledger Live.

## Features

- Deterministic testing scenarios for Polkadot
- Support for Relay Chain and Asset Hub
- Local signer written in Typescript
- Integration with Sidecar and Chopstick sfor local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { PolkadotScenario } from "@ledgerhq/coin-tester-polkadot";

// Run a test scenario
await executeScenario(PolkadotScenario);
```

## Development

Run the tests with `pnpm start`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-polkadot
