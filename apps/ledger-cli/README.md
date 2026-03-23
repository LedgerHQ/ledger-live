# ledger-cli

Modern power-user CLI for Ledger hardware wallets — for developers, agents, and scripts.

## Features

- Clean subcommand UX (Commander.js), colored output (chalk), progress spinners (ora)
- Uses the Device Management Kit (DMK) for all hardware interactions
- Graceful device prompts: connect, unlock, open app
- `--format json` for machine-readable / pipe-friendly output (NDJSON)
- Spinners write to stderr; data writes to stdout — safe for piping

## Installation

From the monorepo root:

```bash
pnpm install
pnpm ledger-cli:run build
```

## Usage

```bash
# From the monorepo root:
pnpm ledger-cli <command> [options]

# Or directly:
./apps/ledger-cli/bin/index.js <command> [options]
```

### Commands

#### `discover-accounts`

Scan your Ledger device for accounts of a given currency.

```bash
pnpm ledger-cli discover-accounts --currency ethereum
pnpm ledger-cli discover-accounts --currency bitcoin --format json
pnpm ledger-cli discover-accounts -c btc | jq '.descriptor'
```

Options:
- `-c, --currency <id>` — Currency name or ticker (e.g. `ethereum`, `bitcoin`, `btc`) **(required)**
- `--scheme <scheme>` — Limit to a specific derivation scheme
- `--format json` — NDJSON output (one object per line)

Output (human):
```
Ethereum accounts:
  ethereum • 0xAbC1…eF90 (native_segwit, index 0)
    Balance:    1000000000000000000 (raw)
    Descriptor: js:2:ethereum:0xAbC1...eF90::
```

Output (JSON, one line per account):
```json
{"descriptor":"js:2:ethereum:0xAbC1...eF90::","currency":"ethereum","freshAddress":"0xAbC1...eF90","balance":"1000000000000000000","index":0,"derivationMode":""}
```

#### `balance`

Sync an account and display its balance.

```bash
pnpm ledger-cli balance "js:2:ethereum:0xAbC1...eF90::"
pnpm ledger-cli balance "js:2:bitcoin:xpub6Dfd...::native_segwit" --format json
```

Options:
- `--sub-accounts` — Also show token balances
- `--format json` — JSON output

#### `operations`

List recent operations for an account.

```bash
pnpm ledger-cli operations "js:2:ethereum:0xAbC1...eF90::" --limit 10
pnpm ledger-cli operations "js:2:ethereum:0xAbC1...eF90::" --format json | jq '.[].hash'
```

Options:
- `--limit <n>` — Max number of operations to show (default: 20)
- `--format json` — JSON array output

#### `receive`

Get and optionally verify a receive address on your device.

```bash
pnpm ledger-cli receive "js:2:ethereum:0xAbC1...eF90::"
pnpm ledger-cli receive "js:2:bitcoin:xpub6Dfd...::native_segwit" --no-verify
```

Options:
- `--no-verify` — Skip device verification (print address without showing on device)
- `--format json` — JSON output

#### `send`

Sign and broadcast a transaction.

```bash
pnpm ledger-cli send "js:2:ethereum:0xAbC1...eF90::" \
  --recipient 0xDest...1234 \
  --amount 0.01 \
  --dry-run

pnpm ledger-cli send "js:2:bitcoin:xpub6Dfd...::native_segwit" \
  --recipient bc1q... \
  --amount 0.001
```

Options:
- `--recipient <addr>` — Recipient address **(required)**
- `--amount <value>` — Amount in main unit (e.g. `0.01` ETH) **(required)**
- `--dry-run` — Build and sign but do not broadcast
- `--format json` — JSON output

## Account Descriptor Format

The CLI uses the Ledger account ID format as descriptors:

```
js:2:<currencyId>:<xpubOrAddress>:<derivationMode>
```

Examples:
- `js:2:ethereum:0xAbC1...eF90::` — Ethereum account
- `js:2:bitcoin:xpub6Dfd...::native_segwit` — Bitcoin native SegWit account

Use `discover-accounts` to obtain descriptors for your accounts.

## Global Options

- `--format human|json` — Output format (default: `human`)

## Development

```bash
# Build
pnpm ledger-cli:run build

# Watch mode (rebuilds on save)
pnpm ledger-cli:run watch

# Typecheck
pnpm ledger-cli:run typecheck

# Lint
pnpm ledger-cli:run lint
```

## Environment Variables

Standard Ledger Live env vars apply (see `@ledgerhq/live-env`):

- `VERBOSE=1` — Enable verbose logging to stderr
- `VERBOSE_FILE=<path>` — Write verbose logs to a file
- `MOCK=1` — Use mock bridges (no device needed, for testing)

## Architecture

- `src/index.ts` — Commander root, registers all commands
- `src/setup.ts` — Live-common init, transport registration
- `src/dmk.ts` — DMK singleton + `withDeviceApp()` for device interactions
- `src/descriptor.ts` — Account descriptor parsing and formatting
- `src/bridge.ts` — Account sync via live-common bridges
- `src/output.ts` — Spinner, chalk, JSON/human output utilities
- `src/commands/` — One file per CLI command
