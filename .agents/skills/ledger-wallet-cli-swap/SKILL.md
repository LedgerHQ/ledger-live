---
name: ledger-wallet-cli-swap
description: Quote, execute, and track a crypto swap over USB (quote -> execute -> status). Use for "swap/convert/trade A to B".
---

# wallet-cli — swap

Quote, execute, and track a crypto swap: `swap quote` → `swap execute` → `swap status`. Only `swap execute` touches the device. Networks: **bitcoin**, **ethereum**, **solana** (and tokens on those chains).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, ambiguous-request handling, shared error table). For _why_ swaps work this way, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`).

> **Sandbox:** `swap execute` is a device command — it **must** run with `dangerouslyDisableSandbox: true` (sandbox blocks USB). `swap quote` and `swap status` hit only partner/backend APIs and do **not** need the bypass or a device.

> **Session first:** `--from-account` / `--to-account` / `--account` are session labels (e.g. `ethereum-1`). If the session is empty, run `account discover <network>` first (see the `ledger-wallet-cli-account-discover` skill).

---

## Intent map

| User says                                                | Command                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| "swap A to B", "convert", "trade ETH for BTC", "exchange" | `swap quote` -> `swap execute` -> `swap status` |

---

## swap quote

Fetches quotes in parallel from the built-in provider list (no device required; addresses are resolved from session accounts).

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** — native assets (e.g. `ethereum`, `bitcoin`, `solana`) **or token IDs** when the token's parent chain is a supported native swap currency. They are **not** session account labels — use `--from-account` / `--to-account` for accounts.

**Default providers queried by `swap quote` and usable by `swap execute`:** `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `lifi`, `nearintents`, `okx`, `oneinch`, `swapsxyz`, `uniswap`, `velora`.

**Accounts:** `--from-account` and `--to-account` accept a session label only; the CLI resolves a fresh receive address from the account.

```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1
pnpm --silent wallet-cli start swap quote -f ethereum -t bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1 --output json
```

Required: `--from`, `--to`, `--from-account`, `--to-account`, `--amount`.

## swap execute

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** (same as `swap quote`): native assets or **tokens** on an allowed parent chain. They must match the asset of the source `--account` and of `--to-account` respectively.

**Providers:** Valid `--provider` values are `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `lifi`, `nearintents`, `okx`, `oneinch`, `swapsxyz`, `uniswap`, `velora` (plus the `1inch` alias for `oneinch`; `changelly` maps to `changelly_v2`). Use the provider id shown on the quote line you pick from `swap quote`.

**Fee strategy:** `--fee-strategy` accepts `slow`, `medium` (default), or `fast`.

```bash
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1
pnpm --silent wallet-cli start swap execute -f ethereum -t bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --fee-strategy fast
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --output json
```

Required flags: `--from`, `--to`, `--account`, `--to-account`, `--provider`, `--amount`. Use a `--provider` value that matches the provider id on the quote line you pick from `swap quote`.

## swap status

```bash
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly --output json
```

Required flags: `--swap-id`, `--provider`.

## Resolving token currency IDs

The `id` accepted by `swap quote --from` / `--to` and `swap execute --from` / `--to` is the same id printed by `assets token` / `assets token-by-id` (see the `ledger-wallet-cli` umbrella skill).

---

## Task errors

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, rejected-on-device, locked device). Only `swap execute` touches the device.
