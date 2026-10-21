# @ledgerhq/coin-tester-bitcoin

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for `@ledgerhq/coin-bitcoin`. Asks coin-sandbox for a regtest
Bitcoin Core and Atlas, Ledger's explorer, and runs the scenarios through the legacy bridge and the
generic adapter.

## Features

- Deterministic testing scenarios for Bitcoin
- Local signer written in Typescript
- Bitcoin Core 28.0 on regtest and Atlas 2.30.22, started by coin-sandbox, which also funds the
  accounts (airdrop)

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "@ledgerhq/coin-tester-bitcoin";

// Run a test scenario
await executeScenario(scenarioBitcoin);
```

## Development

Run the tests with `pnpm coin:tester:bitcoin start`. They need coin-sandbox's server running
(`deno task server` in its repository, port 8000; `COIN_SANDBOX_URL` points elsewhere) and a Docker
daemon logged in to `jfrog.ledgerlabs.net/bbs-oci-prod-green` (an OCI client token from
https://jfrog.ledgerlabs.net), where the node and Atlas images are.

The sandbox node mines a block every 10 seconds on its own, on top of the blocks the scenarios mine.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-bitcoin
