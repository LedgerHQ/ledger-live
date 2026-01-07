# @ledgerhq/coin-tester-bitcoin

This package contains the deterministic testing infrastructure for Bitcoin in Ledger Live.

## Features

- Deterministic testing scenarios for Bitcoin
- Integration with Speculos for hardware wallet simulation
- Integration with Atlas for local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "@ledgerhq/coin-tester-bitcoin";

// Run a test scenario
await executeScenario(scenarioBitcoin);
```

## Development

1. Set up your environment variables in `.env` (see `.env.example`)
2. Set Up an OCI client token for `bbs-oci-prod-green` repository on https://jfrog.ledgerlabs.net
3. Run the tests with `pnpm start`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-bitcoin
