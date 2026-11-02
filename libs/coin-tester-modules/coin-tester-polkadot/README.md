# @ledgerhq/coin-tester-polkadot

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the deterministic testing infrastructure for Polkadot in Ledger Live.

## Features

- Deterministic testing scenarios for Polkadot
- Support for Relay Chain and Asset Hub
- Local signer written in Typescript
- Runs against [coin-sandbox](https://github.com/LedgerHQ/coin-sandbox): a real relay chain and Asset Hub node, the rest-api
  and the Atlas indexers production runs, with eras of about a minute

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { PolkadotScenario } from "@ledgerhq/coin-tester-polkadot";

// Run a test scenario
await executeScenario(PolkadotScenario);
```

## Development

Run the tests with `pnpm start`, with coin-sandbox's server running (`deno task server` in its checkout, `COIN_SANDBOX_URL`
if it is not on `http://localhost:8000`). Each scenario starts its own instance and removes it at the end. The first start
builds the node image, which compiles the runtimes (about 15 minutes) unless the sandbox pulls it from a registry.

Both scenarios use one network of the sandbox, `polkadot`: the `AssetHub` one runs on Asset Hub, with the staking calls
(its eras advance because the sandbox ends the sessions as the relay chain would) and the `Polkadot` one on the relay chain.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-polkadot
