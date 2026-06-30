# ledger-live CLI

> Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.

`@ledgerhq/live-cli` is now **only an e2e/CI tool**. It exists solely as internal plumbing that the monorepo's e2e suites and CI use to drive a few `@ledgerhq/live-common` flows. It is **Speculos-only**: it does not ship USB/HID or HTTP-proxy transports, and it is no longer intended for human/manual use.

For real-device, human-facing hardware-wallet flows, use the Ledger Live **desktop** or **mobile** app directly, or [`@ledgerhq/wallet-cli`](../wallet-cli) if a CLI-based interaction is preferred.

# Usage

## Install the CLI

```bash
npm i --global @ledgerhq/live-cli
```

## Run commands

Jump to the [documentation](#documentation) for more information about the available commands.

```bash
ledger-live <commands>
```

# Development

## Setup

### Requirements

- Toolchain installed from the repository root with `mise install`
- Dependencies installed with `pnpm i`

The pinned Node and pnpm versions live in the root [`mise.toml`](../../mise.toml).
See [repo commands](../../docs/repo-commands.md) for maintained setup,
build, and test commands.

## Install

> Reminder: all commands should be run from the repository root.

```bash
# install dependencies
pnpm i
```

## Dev

```bash
# launch a watch mode on the source files and recompiles on the fly
pnpm dev:cli
```

## Run

```bash
# run a command of the cli (against Speculos)
SPECULOS_API_PORT=<port> pnpm run:cli <command>
```

## Build

```bash
# build the cli for publishing
pnpm build:cli
```

# Documentation

The CLI exposes a small, fixed set of commands consumed by e2e and CI. Run
`ledger-live --help` for the up-to-date list and options.

| Command | Used by |
| --- | --- |
| `getAddress` | e2e — reads an on-device address / public key |
| `liveData` | e2e — generates/adds accounts into the app dataset |
| `send` | generic send flow (recipient/amount) |
| `tokenApproval` | e2e — sets/revokes an ERC-20 allowance |
| `tokenAllowance` | e2e — reads an ERC-20 allowance |
| `generateAddresses` | e2e (`generate-e2e-userdata.yml`) — generates the address cache for account-based coins |
| `generateUtxoAddresses` | e2e (`generate-e2e-userdata.yml`) — generates the address cache for UTXO-based coins |
| `generateAppJson` | e2e (`generate-e2e-userdata.yml`) — generates the app dataset (userdata) for the desktop/mobile e2e suites |
| `botTransfer` | CI (`bot-transfer.yml`) — transfers funds between Speculos seeds |
| `version` | the package's own smoke test |

All of these run against a Speculos device (`SPECULOS_API_PORT` or `SPECULOS_APDU_PORT`).
Passing a non-Speculos device id fails with an explicit error pointing to the desktop/mobile
app or `@ledgerhq/wallet-cli`.
