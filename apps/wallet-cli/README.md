# wallet-cli (`@ledgerhq/wallet-cli`)

Command-line tool for Ledger Wallet flows over **USB**, built on the **Device Management Kit (DMK)** and [Bunli](https://www.npmjs.com/package/bunli). Version **1.0.1**.

## Status (v1)

wallet-cli is the stable v1 CLI for USB-based Ledger Wallet flows. Its scope is intentionally focused: it does not aim for full Ledger Live desktop or mobile feature parity.

**Supported networks** today: **bitcoin**, **ethereum**, and **solana** (aligned with `live-common-setup.ts`). Token flows are supported for tokens on those networks.

### Commands

| Command | Role |
| -------- | ---- |
| `account discover` | Discover accounts for a network on the **connected Ledger** (USB). Each discovered account is saved to the session under a **label** (e.g. `ethereum-1`). |
| `session view` / `session reset` | List or wipe accounts stored in the session. |
| `balances` | Fetch **native and token balances** for an account (by session label). **No device** required. |
| `operations` | **List operations** for an account (by session label). **No device** required. Optional pagination via `--limit` and `--cursor`. |
| `send` | Sign and broadcast a transaction. Requires `--amount` with ticker (e.g. `0.001 BTC`, `0.01 ETH`). Use `--dry-run` to validate without signing. |
| `receive` | Get the receive address for an account (optionally verify on device). |
| `swap quote` | Fetch swap quotes for supported currencies and tokens. |
| `swap execute` | Execute the full swap flow with `--from`, `--to`, `--provider`, and `--amount`: prepare the swap, interact with the connected device as needed, complete the exchange, then sign and broadcast the transaction. |
| `swap status` | Read the current swap status from the partner API. |
| `assets token` / `assets token-by-id` | Resolve token metadata by contract address or token id. |
| `genuine-check` | Check whether the connected Ledger device is genuine. |

Typical flow: run `account discover` with a currency id (e.g. `bitcoin`, `ethereum`), then pass the assigned **session label** (e.g. `--account ethereum-1`) to `balances`, `operations`, `send`, or `receive`. Use `session view` to see what's saved.

For exact flags and defaults (from repo root):

```bash
pnpm wallet-cli start -- --help
pnpm wallet-cli start -- account discover --help
pnpm wallet-cli start -- balances --help
pnpm wallet-cli start -- operations --help
pnpm wallet-cli start -- send --help
pnpm wallet-cli start -- receive --help
pnpm wallet-cli start -- assets token --help
pnpm wallet-cli start -- genuine-check --help
pnpm wallet-cli start -- swap quote --help
pnpm wallet-cli start -- swap execute --help
pnpm wallet-cli start -- swap status --help
```

From `apps/wallet-cli`, use `pnpm start` in place of `pnpm wallet-cli start` (same args after `--`).

Most commands support `--output human` (default) or `--output json`.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.1.0 (`engines` in `package.json`)
- **pnpm** and this monorepo checked out; install dependencies per [common commands](../../docs/common-commands.md) (e.g. `mise install`, `pnpm i`)
- A **Ledger** on USB when using `account discover`, `send`, `swap execute`, or `receive --verify`
- **Linux:** USB/HID build deps, for example:

  ```bash
  sudo apt-get update && sudo apt-get install libudev-dev libusb-1.0-0-dev
  ```

## Setup and run

From an installed package:

```bash
wallet-cli <command> [args]
```

From the **repository root** (after `pnpm i`):

```bash
pnpm wallet-cli start -- <command> [args]
```

From **this package** (`apps/wallet-cli`):

```bash
pnpm start -- <command> [args]
```

`pnpm start` runs `bun run ./src/cli.ts`. Standalone builds under `dist/` rely on `init-cwd.ts` so Bunli config and native bindings resolve correctly; prefer the package scripts when developing from source.

## Build (optional)

- In `apps/wallet-cli`: `pnpm build` (Bunli native bundle → `dist/`)
- From repo root: `pnpm build:wallet-cli`

## Environment

If `USER_ID` is unset, it defaults to `wallet-cli` so DMK firmware distribution salt stays stable for this CLI (`env-setup.ts`).

## Relation to `ledger-live` CLI

This package is DMK-focused and is separate from `@ledgerhq/live-cli` ([`apps/cli`](../cli)); that tool has a different scope and distribution model.

## Agent guidance

AI agents should read the [ledger-wallet-cli agent skill](../../.claude/skills/ledger-wallet-cli/SKILL.md) before running wallet-cli commands. It maps informal user requests to commands and documents hardware-wallet safety rules, session labels, USB sandbox requirements, and device-contention constraints.
