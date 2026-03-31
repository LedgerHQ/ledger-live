---
name: ledger-wallet-cli
description: Official Ledger wallet-cli — USB-based CLI for Ledger hardware wallet flows (discover-accounts, receive, balances, operations, send) built on the Device Management Kit (DMK)
---

# wallet-cli usage guide

`wallet-cli` is an experimental USB-based CLI for Ledger wallet flows, built on the Device Management Kit (DMK). Supported currencies: **bitcoin**, **ethereum**, **solana**.

**Prerequisites:** Ledger device connected via USB, target coin app open on device.

**Run from repo root:**
```bash
pnpm wallet-cli start -- <command> [flags]
```

---

## Typical flow

### 1. Discover accounts — requires device

```bash
pnpm wallet-cli start -- discover-accounts --currency bitcoin
```

Outputs one account per line while scanning. Each account shows:
- `bitcoin account #0 (native_segwit)  <freshAddress>`
- `<short-descriptor>` on the next line — copy this for subsequent commands

**Short descriptor format:** `js:2:<currency>:<xpub>:<derivationMode>:<index>`

### 2. Receive address — requires device

```bash
pnpm wallet-cli start -- receive <short-descriptor>
```

Streams the address to the device for visual verification. Use `--no-verify` to skip device confirmation.

### 3. Balances — no device required

```bash
pnpm wallet-cli start -- balances <short-descriptor>
```

Fetches native balance (and tokens if applicable).

### 4. Operations — no device required

```bash
pnpm wallet-cli start -- operations <short-descriptor>
```

Lists transactions. Optional pagination: `--limit <n> --cursor <cursor>`.

### 5. Send — requires device

```bash
pnpm wallet-cli start -- send <short-descriptor> --to <address> --amount <amount>
```

Shows prepared tx details (recipient, amount, fees), streams to device for signature, then broadcasts.

Use `--dry-run` to sign without broadcasting. The device will prompt for confirmation — reject on device to abort.

---

## Output format

All commands support `--output human` (default, with spinners) and `--output json` (machine-readable, no spinners).

---

## Common errors

| Error | Cause |
|-------|-------|
| `UnknownDeviceExchangeError` | Device not connected or coin app not open |
| `0x6985` (Condition of use not satisfied) | User rejected on device |
| `Invalid short account descriptor` | Missing `:<index>` suffix — append `:0`, `:1`, etc. |
