---
name: ledger-wallet-cli
description: Official Ledger wallet-cli — USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send) built on the Device Management Kit (DMK)
---

# wallet-cli usage guide

`wallet-cli` is an experimental USB-based CLI for Ledger wallet flows, built on the Device Management Kit (DMK). Supported networks: **bitcoin**, **ethereum**, **solana** (mainnet and testnets).

**Prerequisites:** Ledger device connected via USB, target coin app open on device (for commands that require it).

**Run from repo root:**
```bash
pnpm --silent wallet-cli start <command> [flags]
```

---

## Commands at a glance

| Command | Device required |
|---------|----------------|
| `account discover` | Yes |
| `receive` | Yes (optional with `--no-verify`) |
| `send` | Yes (no device with `--dry-run`) |
| `balances` | No |
| `operations` | No |

---

## Account descriptor format (V1)

`account discover` outputs **V1 descriptors**:

```
account:1:<type>:<network>:<env>:<xpub_or_address>:<path>
```

Hardened segments use `h` (shell-safe). `'` is also accepted for backward compatibility.

Examples:
```
account:1:utxo:bitcoin:main:xpub6BosfCn...:m/84h/0h/0h
account:1:account:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0
account:1:account:solana:main:7xCU4XQfL...:m/44h/501h/0h/0h
account:1:utxo:bitcoin:test:tpubD8Lg2g...:m/84h/1h/0h
```

All commands (`balances`, `operations`, `receive`, `send`) accept V1 descriptors as `--account` or first positional arg. Legacy V0 (`js:2:bitcoin:xpub...:native_segwit:0`) still accepted.

---

## Typical flow

### 1. Discover accounts — requires device

```bash
pnpm --silent wallet-cli start account discover bitcoin
pnpm --silent wallet-cli start account discover ethereum:goerli
pnpm --silent wallet-cli start account discover --network bitcoin --output json
```

Network forms: `bitcoin` (= mainnet), `ethereum:mainnet` (alias → `main`), `ethereum:goerli`, `bitcoin:testnet` (alias → `test`), `solana:devnet` (alias → `dev`).

Human output: one account per line with fresh address and V1 descriptor to copy.
JSON output: `{ "accounts": ["account:1:utxo:bitcoin:main:xpub...:m/84h/0h/0h", ...] }`

### 2. Receive address — requires device

```bash
pnpm --silent wallet-cli start receive account:1:utxo:bitcoin:main:xpub...:m/84h/0h/0h
pnpm --silent wallet-cli start receive account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0 --no-verify
```

Use `--no-verify` to skip device confirmation.

### 3. Balances — no device required

```bash
pnpm --silent wallet-cli start balances account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0
pnpm --silent wallet-cli start balances account:1:utxo:bitcoin:main:xpub...:m/84h/0h/0h --output json
```

Fetches native balance and token balances (ERC-20). JSON amounts are human-readable strings (`"1.5 ETH"`, `"100 USDT"`).

### 4. Operations — no device required

```bash
pnpm --silent wallet-cli start operations account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0
pnpm --silent wallet-cli start operations <descriptor> --limit 20 --cursor <cursor>
pnpm --silent wallet-cli start operations <descriptor> --output json
```

Lists transactions including internal operations (ETH contract call traces). Pagination: `--limit <n>` and `--cursor <cursor>`. Next cursor on stderr (human) or `nextCursor` in JSON.

JSON: `value`/`fee` are human-readable ticker strings. `accountId` is the V1 descriptor string.

### 5. Send — requires device (unless `--dry-run`)

```bash
# Native ETH
pnpm --silent wallet-cli start send account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0 \
  --to 0xDEF... --amount '0.5 ETH'

# ERC-20 token — ticker resolves the token automatically
pnpm --silent wallet-cli start send account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0 \
  --to 0xDEF... --amount '100 USDT'

# Bitcoin with custom fee
pnpm --silent wallet-cli start send account:1:utxo:bitcoin:main:xpub...:m/84h/0h/0h \
  --to bc1q... --amount '0.001 BTC' --fee-per-byte 15 --rbf

# Dry run — no device needed
pnpm --silent wallet-cli start send account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0 \
  --to 0xDEF... --amount '0.5 ETH' --dry-run
```

Ticker is **mandatory** in `--amount` (e.g. `'0.5 ETH'`, `'0.001 BTC'`). It drives asset resolution — no `--token` flag.

`--dry-run`: prepares and validates without signing or broadcasting. No device opened.

---

## Send flags

### All families

| Flag | Description |
|------|-------------|
| `--amount '<value> <TICKER>'` | Required. e.g. `'0.001 BTC'`, `'0.01 ETH'`, `'0.4 USDT'` |
| `--to <address>` | Required. Recipient address |
| `--dry-run` | Prepare and validate without signing or opening the device |
| `--output json` | Machine-readable JSON output |

### Bitcoin only

| Flag | Description |
|------|-------------|
| `--fee-per-byte <satoshis>` | Custom fee per byte in satoshis |
| `--rbf` | Enable Replace-By-Fee |

### Solana only

| Flag | Description |
|------|-------------|
| `--mode <mode>` | `send`, `stake.createAccount`, `stake.delegate`, `stake.undelegate`, `stake.withdraw` (default: `send`) |
| `--validator <address>` | Validator address (staking flows) |
| `--stake-account <address>` | Stake account address (staking flows) |
| `--memo <text>` | Memo/tag |

---

## Output format

All commands: `--output human` (default) or `--output json`.

JSON envelope shape:
```json
{
  "status": "success",
  "command": "balances",
  "network": "ethereum:main",
  "account": "account:1:account:ethereum:main:0xABC...:m/44h/60h/0h/0/0",
  "timestamp": "2026-04-03T12:00:00.000Z",
  "...": "command-specific fields"
}
```

Command-specific payloads:
- `account discover`: `{ "accounts": ["account:1:...", ...] }`
- `balances`: `{ "balances": [{ "asset": "ethereum", "amount": "1.5 ETH" }, ...] }`
- `operations`: `{ "operations": [{ "accountId": "account:1:...", "value": "0.1 ETH", "fee": "...", ... }], "nextCursor": "..." }`
- `send`: `{ "tx_hash": "0x...", "amount": "0.5 ETH", "fee": "0.0003 ETH" }`
- `send --dry-run`: `{ "dry_run": true, "recipient": "0x...", "amount": "0.5 ETH", "fee": "0.0003 ETH" }`

Error envelope: `{ "status": "error", "message": "...", ... }` — exit code non-zero.

---

## Common errors

| Error | Cause |
|-------|-------|
| `Amount must include a ticker, e.g. '0.5 ETH' or '0.001 BTC'` | `--amount` given a bare number |
| `Ticker UNKN not found in account. Available: ETH, USDT, ...` | Ticker not in account balances |
| `No currencyId mapping for network "x:y"` | Unsupported network/env combination |
| `UnknownDeviceExchangeError` | Device not connected or coin app not open |
| `[x] Transaction Cancelled: Rejected on device. No funds moved.` | User rejected on device |
