---
name: ledger-wallet-cli-send
description: Sign and broadcast a send/transfer/withdraw over USB (native + ERC-20; BTC/Solana flags). Use for "send/transfer/pay X to Y"; ticker is mandatory.
---

# wallet-cli — send

Sign and broadcast a transfer on the connected Ledger over USB. Supports native assets and ERC-20 tokens, plus Bitcoin and Solana flags. Networks: **bitcoin**, **ethereum**, **solana** (mainnet only).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, ambiguous-request handling, out-of-scope, shared error table). For _why_ signing is confirmed on the device, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`).

> **Sandbox:** `send` is a device command — it **must** run with `dangerouslyDisableSandbox: true` (sandbox blocks USB). **`send --dry-run` needs no device and no sandbox bypass** — use it to validate before signing.

> **Ambiguous → ask.** Never guess a recipient, amount, or ticker. A wrong guess on a send is irreversible fund loss (see `references/safety.md`).

> **Session first:** the `<account>` argument is a session label (e.g. `ethereum-1`). If the session is empty, run `account discover <network>` first (see the `ledger-wallet-cli-account-discover` skill).

---

## Intent map

| User says                                             | Command                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| "send X to Y", "transfer", "pay", "withdraw to an exchange" | `send <account> --to <address> --amount '<amount> <ticker>'` |

---

## send

```bash
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH'
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '100 USDT'  # ERC-20
pnpm --silent wallet-cli start send bitcoin-native-1 --to bc1q... --amount '0.001 BTC' --fee-per-byte 15 --rbf
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH' --dry-run
```

Ticker is **mandatory** in `--amount`. There is no `--token` flag — the ticker drives asset resolution (native vs ERC-20).

**Bitcoin flags:** `--fee-per-byte <sats>`, `--rbf`

**Solana flags:** `--mode send|stake.createAccount|stake.delegate|stake.undelegate|stake.withdraw`, `--validator <addr>`, `--stake-account <addr>`, `--memo <text>`

The user must review amount, recipient, and fees on the device screen before approving.

---

## Task errors

| Error                              | Cause                          | Fix                                                                                                                                                                    |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Amount must include a ticker`     | `--amount` missing ticker      | **Ask the user which asset they mean** — do not guess. Then pass the ticker inline, e.g. `--amount '0.5 ETH'`.                                                         |
| `Ticker UNKN not found in account` | ticker not in account balances | Run `balances <account>` (umbrella skill) and show the tickers held. **Ask which ticker to use, or whether they meant a different account — do not silently substitute.** |

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, rejected-on-device, locked device).
