# @ledgerhq/coin-tester-bitcoin

This package contains the deterministic testing infrastructure for Bitcoin in Ledger Live.

## Features

- Deterministic testing scenarios for Bitcoin
- Local signer written in Typescript
- Integration with Atlas for local blockchain simulation

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "@ledgerhq/coin-tester-bitcoin";

// Run a test scenario
await executeScenario(scenarioBitcoin);
```

## Development

1. Set Up an OCI client token for `bbs-oci-prod-green` repository on https://jfrog.ledgerlabs.net
2. Run the tests with `pnpm start`

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-bitcoin
