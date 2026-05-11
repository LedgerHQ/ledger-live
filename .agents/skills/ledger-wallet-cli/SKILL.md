---
name: ledger-wallet-cli
description: Official Ledger wallet-cli — USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send, swap quote/execute/status) built on the Device Management Kit (DMK)
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **base**, **solana** (mainnet + testnets). Base uses the Ethereum app.

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `account discover`, `receive`, `send`, `genuine-check` **must** use `dangerouslyDisableSandbox: true` — sandbox blocks USB (causes `Timeout has occurred`). Other commands are fine in sandbox.

> **Device contention:** Never run two device commands in parallel — they fail with `[object Object]` or garbled APDU. Run sequentially.

---

## Commands

| Command            | Device | Sandbox      |
| ------------------ | ------ | ------------ |
| `session view`     | No     | No           |
| `session reset`    | No     | No           |
| `account discover` | Yes    | **Required** |
| `receive`          | Yes    | **Required** |
| `send`             | Yes*   | **Required** |
| `genuine-check`    | Yes    | **Required** |
| `balances`         | No     | No           |
| `operations`       | No     | No           |
| `swap quote`       | No     | No           |
| `swap execute`     | Yes**  | **Required** |
| `swap status`      | No     | No           |

*`send --dry-run` needs no device and no sandbox bypass.
**`swap execute --dry-run` needs no device and no sandbox bypass.

---

## Session & labels

`account discover` persists accounts. Each gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-goerli-2`).

All `--account` flags accept a label or a full descriptor.

---

## Commands

### session view / reset
```bash
pnpm --silent wallet-cli start session view
pnpm --silent wallet-cli start session reset
```

### account discover
```bash
pnpm --silent wallet-cli start account discover ethereum
pnpm --silent wallet-cli start account discover bitcoin
pnpm --silent wallet-cli start account discover ethereum:sepolia
```
Networks: `bitcoin` (mainnet), `base`, `ethereum:sepolia`, `bitcoin:testnet`, `solana:devnet`.

### receive
```bash
pnpm --silent wallet-cli start receive ethereum-1
pnpm --silent wallet-cli start receive ethereum-1 --no-verify  # skip device confirmation
```

### genuine-check
```bash
pnpm --silent wallet-cli start genuine-check
pnpm --silent wallet-cli start genuine-check --output json
```
Device must be unlocked and on the dashboard.

### balances
```bash
pnpm --silent wallet-cli start balances ethereum-1
pnpm --silent wallet-cli start balances ethereum-1 --output json
```

### operations
```bash
pnpm --silent wallet-cli start operations ethereum-1
pnpm --silent wallet-cli start operations ethereum-1 --limit 20 --cursor <cursor>
```
Pagination: next cursor on stderr (human) or `nextCursor` in JSON.

### send
```bash
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH'
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '100 USDT'  # ERC-20
pnpm --silent wallet-cli start send bitcoin-native-1 --to bc1q... --amount '0.001 BTC' --fee-per-byte 15 --rbf
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH' --dry-run
```

Ticker is **mandatory** in `--amount`. No `--token` flag — ticker drives asset resolution.

**Bitcoin flags:** `--fee-per-byte <sats>`, `--rbf`

**Solana flags:** `--mode send|stake.createAccount|stake.delegate|stake.undelegate|stake.withdraw`, `--validator <addr>`, `--stake-account <addr>`, `--memo <text>`

### swap quote
```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-fresh-address 0xABC... --to-fresh-address bc1q...
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-fresh-address 0xABC... --to-fresh-address bc1q... --output json
```
Required flags: `--from`, `--to`, `--amount`, `--from-fresh-address`, `--to-fresh-address`

### swap execute
```bash
pnpm --silent wallet-cli start swap execute --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1
pnpm --silent wallet-cli start swap execute --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --fee-strategy fast
pnpm --silent wallet-cli start swap execute --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --dry-run --output json
```
Required flags: `--account`, `--to-account`, `--provider`, `--amount`

### swap status
```bash
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly --output json
```
Required flags: `--swap-id`, `--provider`

---

## Common errors

| Error | Cause |
| ----- | ----- |
| `Amount must include a ticker` | `--amount` missing ticker |
| `Ticker UNKN not found in account` | ticker not in account balances |
| `UnknownDeviceExchangeError` | device not connected or wrong app |
| `Transaction Cancelled: Rejected on device` | user rejected on device |
| `Timeout has occurred` | sandbox blocking USB — use `dangerouslyDisableSandbox: true` |
