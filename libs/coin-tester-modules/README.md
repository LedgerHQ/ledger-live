# coin-tester-modules

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

A workspace directory of coin-specific end-to-end test packages for Ledger Live. Each sub-package implements the test scenarios, fixtures, and hardware-wallet signer integration needed to run the coin tester against a real (or simulated) Ledger device for a specific blockchain.

## What it does

- Provides per-coin test scenario implementations for the `@ledgerhq/coin-tester` runner
- Encapsulates coin-specific fixtures (accounts, transactions, expected outcomes)
- Wires up the hardware-wallet signer for each coin family
- Can run against Speculos (emulator) or a physical device

## Packages

| Package | Blockchain |
|---|---|
| `@ledgerhq/coin-tester-bitcoin` | Bitcoin |
| `@ledgerhq/coin-tester-cardano` | Cardano |
| `@ledgerhq/coin-tester-cosmos` | Cosmos |
| `@ledgerhq/coin-tester-evm` | EVM chains (Ethereum, etc.) |
| `@ledgerhq/coin-tester-polkadot` | Polkadot |
| `@ledgerhq/coin-tester-solana` | Solana |
| `@ledgerhq/coin-tester-stellar` | Stellar |
| `@ledgerhq/coin-tester-tezos` | Tezos |
| `@ledgerhq/coin-tester-tron` | Tron |
| `@ledgerhq/coin-tester-xrp` | XRP |

## Usage context

Run via `libs/coin-tester` (the test runner/framework). Typically executed in CI against Speculos containers to validate coin implementations end-to-end.
