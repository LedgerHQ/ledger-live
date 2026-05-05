# wallet-cli (`@ledgerhq/wallet-cli`)

Experimental command-line tool for Ledger Wallet flows over **USB**, built on the **Device Management Kit (DMK)** and [Bunli](https://www.npmjs.com/package/bunli). Version **0.1.0** (see `bunli.config.ts`).

> This software is experimental. It is provided “as is,” without obligation to develop, support, or repair features. Ledger shall not be liable for damages arising from its use.

## Status (v0)

wallet-cli is **not production-ready**. Behavior and flags may change without notice.

**Supported currencies** today: **bitcoin**, **ethereum**, and **solana** (aligned with `live-common-setup.ts`). This is not full Ledger Live coverage and not multi-chain parity with the desktop or mobile apps.

### Commands

| Command | Role |
| -------- | ---- |
| `account discover` | Discover accounts for a currency on the **connected Ledger** (USB). Outputs short **account descriptors** (human table or `--output json`). |
| `balances` | Given an account descriptor from discovery, fetch **native and token balances**. **No device** required. |
| `operations` | Given an account descriptor, **list operations**. **No device** required. For Alpaca-backed families, optional pagination via `--limit` and `--cursor`. |
| `send` | Sign and broadcast a transaction. Requires `--amount` with ticker (e.g. `0.001 BTC`, `0.01 ETH`). Use `--dry-run` to validate without signing. |
| `receive` | Get the receive address for an account (optionally verify on device). |

Typical flow: run `account discover` with a currency id (e.g. `bitcoin`, `ethereum`), then pass the printed descriptor to `balances`, `operations`, or `send`.

For exact flags and defaults (from repo root):

```bash
pnpm wallet-cli start -- --help
pnpm wallet-cli start -- account discover --help
pnpm wallet-cli start -- balances --help
pnpm wallet-cli start -- operations --help
pnpm wallet-cli start -- send --help
```

From `apps/wallet-cli`, use `pnpm start` in place of `pnpm wallet-cli start` (same args after `--`).

Most commands support `--output human` (default) or `--output json`.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.1.0 (`engines` in `package.json`)
- **pnpm** and this monorepo checked out; install dependencies per [common commands](../../docs/common-commands.md) (e.g. `proto use`, `pnpm i`)
- A **Ledger** on USB when using `account discover`, `send`, or `receive --verify`
- **Linux:** USB/HID build deps, for example:

  ```bash
  sudo apt-get update && sudo apt-get install libudev-dev libusb-1.0-0-dev
  ```

## Setup and run (development)

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

## Publish to npm (maintainers)

The installable package is assembled under `npm-dist/`: a small **Node** launcher (`bin/wallet-cli.cjs`) plus the **Bunli-built** standalone binaries copied from `dist/`. End users need **Node.js** (see `engines` in the generated `npm-dist/package.json`) and do **not** need Bun or bunli.

1. Run a full native build so every target exists (same artifacts as CI: `dist/darwin-arm64/cli`, `dist/linux-arm64/cli`, `dist/linux-x64/cli`, `dist/windows-x64/cli.exe`).
2. Smoke-test a tarball: from `apps/wallet-cli`, run `pnpm pack:npm` (runs `build`, then `prepare-npm-publish`, then `pnpm pack`).
3. To publish: set `"private": false` in this directory’s `package.json` when your registry policy allows it, then `pnpm publish` from `apps/wallet-cli`. `prepublishOnly` refreshes `npm-dist/`; `publishConfig.directory` points npm at that folder so the published manifest has no `workspace:` or `catalog:` entries.

## Environment

If `USER_ID` is unset, it defaults to `wallet-cli` so DMK firmware distribution salt stays stable for this CLI (`env-setup.ts`).

## Relation to `ledger-live` CLI

This package is DMK-focused and is **not** `@ledgerhq/live-cli` ([`apps/cli`](../cli)), which has a different scope and distribution model. It can be published to npm as `@ledgerhq/wallet-cli` using the flow in [Publish to npm (maintainers)](#publish-to-npm-maintainers) while remaining `"private": true` in the repo until you intentionally release.
