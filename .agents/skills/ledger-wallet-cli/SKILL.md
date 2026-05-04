---
name: ledger-wallet-cli
description: Official Ledger wallet-cli — USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send, secrets encryption) built on the Device Management Kit (DMK)
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **base**, **solana** (mainnet + testnets). Base uses the Ethereum app.

Also supports hardware-backed **file encryption** via `secrets` commands.

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `account discover`, `receive`, `send` **must** use `dangerouslyDisableSandbox: true` — sandbox blocks USB (causes `Timeout has occurred`). Other commands are fine in sandbox.

> **Device contention:** Never run two device commands in parallel — they fail with `[object Object]` or garbled APDU. Run sequentially.

---

## Commands

| Command              | Device | Sandbox      |
| -------------------- | ------ | ------------ |
| `session view`       | No     | No           |
| `session reset`      | No     | No           |
| `account discover`   | Yes    | **Required** |
| `receive`            | Yes    | **Required** |
| `send`               | Yes*   | **Required** |
| `balances`           | No     | No           |
| `operations`         | No     | No           |
| `secrets init`       | Yes†   | **Required** |
| `secrets encrypt`    | No     | No           |
| `secrets decrypt`    | No     | No           |
| `secrets keys`       | No     | No           |
| `secrets destroy`    | No     | No           |

*`send --dry-run` needs no device and no sandbox bypass.
†`secrets init` needs the device (Ledger Sync app) only on first run to register this machine as a trustchain member.

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

### secrets

Powered by LKRP (Ledger Key Ring Protocol): register this machine once with your Ledger device (`init`), then encrypt and decrypt files without the device. Only a machine credential is stored locally (in the OS keychain); the shared root key is end-to-end encrypted — Ledger's servers relay it between members but only registered members can read it.

The `--key <domain>` argument is a namespace (e.g. `prod`, `staging`): each domain produces an independent AES-256-GCM key derived from that shared root, so secrets across domains cannot cross-decrypt. Multiple machines can be registered as members, meaning any of them can decrypt what another encrypted. `destroy` removes this machine's access.

**Flag conventions:** `--out` = output file path; `--output` = format (`human`|`json`).

```bash
# one-time setup (device + Ledger Sync app required) — needs dangerouslyDisableSandbox
pnpm --silent wallet-cli start secrets init [--name "my-machine"]

# encrypt/decrypt (no device needed after init)
pnpm --silent wallet-cli start secrets encrypt --key prod -i secret.txt --out secret.enc
pnpm --silent wallet-cli start secrets decrypt --key prod -i secret.enc --out secret.txt

# pipe
echo "hello" | pnpm --silent wallet-cli start secrets encrypt --key foo | pnpm --silent wallet-cli start secrets decrypt --key foo

# list tracked domain keys with first-used date
pnpm --silent wallet-cli start secrets keys

# revoke this machine's credentials (interactive confirmation)
pnpm --silent wallet-cli start secrets destroy
```

---

## Common errors

| Error | Cause |
| ----- | ----- |
| `Amount must include a ticker` | `--amount` missing ticker |
| `Ticker UNKN not found in account` | ticker not in account balances |
| `UnknownDeviceExchangeError` | device not connected or wrong app |
| `Transaction Cancelled: Rejected on device` | user rejected on device |
| `Timeout has occurred` | sandbox blocking USB — use `dangerouslyDisableSandbox: true` |
