---
name: ledger-wallet-cli-account-discover
description: Discover/import Ledger accounts for a network (bitcoin/ethereum/solana) over USB and save them to the wallet-cli session. Use for "find/scan/import my accounts", "set up <network>".
---

# wallet-cli — account discover

Discover accounts for a network on the connected Ledger over USB and persist them to the local session. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, ambiguous-request handling, shared error table). For _why_ sessions and discovery work the way they do, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`).

> **Sandbox:** `account discover` is a device command — it **must** run with `dangerouslyDisableSandbox: true` (sandbox blocks USB).

> **Session first:** if invoked without a specific task, run `session view` first (see the `ledger-wallet-cli` umbrella skill). If labels already exist for the network, you may not need to re-discover.

---

## Intent map

| User says                                                                           | Command                      |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| "find my accounts", "scan my wallet", "import my wallet", "set up Ethereum/Bitcoin" | `account discover <network>` |

If the network is missing or ambiguous, **ask** — do not guess (see `references/safety.md`).

---

## account discover

```bash
pnpm --silent wallet-cli start account discover ethereum
pnpm --silent wallet-cli start account discover bitcoin
pnpm --silent wallet-cli start account discover ethereum:sepolia
```

Networks: `bitcoin` (mainnet), `ethereum`, `solana`, `ethereum:sepolia`, `bitcoin:testnet`, `solana:devnet`.

## Session & labels

`account discover` persists accounts. Each gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`). Every other command's `--account` flag accepts a session label. Run `account discover` first to populate the session.

`session view` / `session reset` (viewing and clearing the session) live in the `ledger-wallet-cli` umbrella skill.

---

## Task errors

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, rejected-on-device, locked device). Discovery uses the standard app-launch path, so it does not hit the dashboard-only error that `genuine-check` can.
