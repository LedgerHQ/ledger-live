---
name: ledger-wallet-cli
description: Official Ledger wallet-cli - USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send, swap quote/execute/status, genuine-check, assets token / token-by-id). Use for any wallet-cli command execution and for mapping informal requests to the right command.
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Concepts & rationale:** for _why_ a command behaves the way it does, or to surface a safety rule that this skill states tersely (genuine check, receive-address verification, sessions, sandbox, device contention), read [`references/business-logic.md`](references/business-logic.md).

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `account discover`, `receive`, `send`, `genuine-check`, `swap execute` **must** use `dangerouslyDisableSandbox: true` — sandbox blocks USB (causes a USB timeout error). Other commands are fine in sandbox.

> **Device contention:** Never run two device commands in parallel — they fail with `[object Object]` or garbled APDU. Run sequentially.

> **Device readiness:** Before running a device command, briefly describe what you're about to do. The CLI prompts for device interaction itself — **don't time out or kill the command**. _Exception: `genuine-check` exits immediately (`[✖] Wrong app. Open Ledger dashboard.`, exit code 4) if any currency app is open — unlike the other device commands, it targets the dashboard and has no auto-launch path. Ensure the device is on the dashboard before running; if it exits, ask the user to back out to the dashboard and re-run._

> **Ambiguous requests — ask, don't guess.** If a required parameter is missing or unclear (no recipient for `send`, no network for `account discover`, an amount with no ticker), stop and ask. A wrong guess on a hardware wallet flow can mean irreversible fund loss.

---

## Intent map

Map informal phrasings to commands. Account references use a session label (e.g. `ethereum-1`).

| User says                                                                           | Command                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| "show me my wallet", "what do I have", "let's get started", no specific task        | `session view` (run _immediately_, before asking anything)   |
| "find my accounts", "scan my wallet", "import my wallet", "set up Ethereum/Bitcoin" | `account discover <network>`                                 |
| "where do I send funds to", "give me my address", "deposit address"                 | `receive <account>`                                          |
| "how much do I have", "balance", "what's my ETH balance"                            | `balances <account>`                                         |
| "what did I send", "transaction history", "recent activity"                         | `operations <account>`                                       |
| "send X to Y", "transfer", "pay", "withdraw to an exchange"                         | `send <account> --to <address> --amount '<amount> <ticker>'` |
| "swap A to B", "convert", "trade ETH for BTC", "exchange"                           | `swap quote` -> `swap execute` -> `swap status`              |
| "is this Ledger real", "verify authenticity", "I bought this off eBay"              | `genuine-check`                                              |
| "start over", "clear my session", "I switched devices"                              | `session reset`                                              |

---

## Out of scope — say no, don't improvise

If the user asks for any of the following, surface that wallet-cli does not support it yet rather than constructing a command:

- NFTs (mint, transfer, view).
- Encryption / OpenPGP / key-share operations.
- `send`, `receive`, `operations`, or `swap execute` on testnets and layer 2s (e.g. Base).
- Custom chains not listed in the Networks line above.

---

## Session & labels

`account discover` persists accounts. Each gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`).

All `--account` flags accept a session label (e.g. `ethereum-1`). Run `account discover` first to populate the session.

---

## Commands

| Command              | Device | Sandbox      |
| -------------------- | ------ | ------------ |
| `session view`       | No     | No           |
| `session reset`      | No     | No           |
| `account discover`   | Yes    | **Required** |
| `receive`            | Yes    | **Required** |
| `send`               | Yes\*  | **Required** |
| `genuine-check`      | Yes    | **Required** |
| `balances`           | No     | No           |
| `operations`         | No     | No           |
| `swap quote`         | No     | No           |
| `swap execute`       | Yes    | **Required** |
| `swap status`        | No     | No           |
| `assets token`       | No     | No           |
| `assets token-by-id` | No     | No           |

\*`send --dry-run` needs no device and no sandbox bypass.

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

Networks: `bitcoin` (mainnet), `ethereum`, `solana`, `ethereum:sepolia`, `bitcoin:testnet`, `solana:devnet`.

### receive

```bash
pnpm --silent wallet-cli start receive ethereum-1
pnpm --silent wallet-cli start receive ethereum-1 --no-verify  # skip device confirmation
```

**If the on-screen address differs from the terminal address:** do not share or use the address. Have the user disconnect the device and run `genuine-check` before retrying. See [`references/business-logic.md`](references/business-logic.md) § Receive-address verification for context.

### genuine-check

```bash
pnpm --silent wallet-cli start genuine-check
pnpm --silent wallet-cli start genuine-check --output json  # only if a downstream caller needs to parse the result
```

**Preconditions:** device unlocked and on the dashboard (exit any open app); host has internet access (the secure channel reaches Ledger's backend — offline runs fail).

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

Fetches quotes in parallel from the built-in provider list (no device required; addresses are resolved from session accounts).

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** — native assets (e.g. `ethereum`, `bitcoin`, `solana`) **or token IDs** when the token’s parent chain is a supported native swap currency (same IDs the CLI allows for swap). They are **not** session account labels — use `--from-account` / `--to-account` for accounts.

**Default providers queried by `swap quote` and usable by `swap execute`:** `changelly`, `cic`, `exodus`, `nearintents`, `swapsxyz`.

**Accounts:** `--from-account` and `--to-account` accept a session label only; the CLI resolves a fresh receive address from the account like `receive`.

```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1
pnpm --silent wallet-cli start swap quote -f ethereum -t bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1 --output json
```

Required: `--from`, `--to`, `--from-account`, `--to-account`, `--amount`.

### swap execute

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** (same as `swap quote`): native assets or **tokens** on an allowed parent chain. They must match the asset of the source `--account` and of `--to-account` respectively.

**Providers:** Valid `--provider` values are `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `nearintents`, `swapsxyz`. Use the provider id shown on the quote line you pick from `swap quote`.

**Fee strategy:** `--fee-strategy` accepts `slow`, `medium` (default), or `fast`.

```bash
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1
pnpm --silent wallet-cli start swap execute -f ethereum -t bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --fee-strategy fast
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --output json
```

Required flags: `--from`, `--to`, `--account`, `--to-account`, `--provider`, `--amount`. Use a `--provider` value that matches the provider id on the quote line you pick from `swap quote`.

### swap status

```bash
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly --output json
```

Required flags: `--swap-id`, `--provider`

### assets token / token-by-id

Resolve token metadata from the cryptoassets store. No device, no session.

```bash
pnpm --silent wallet-cli start assets token ethereum 0xdac17f958d2ee523a2206206994597c13d831ec7
pnpm --silent wallet-cli start assets token-by-id ethereum/erc20/usd_tether__erc20_
```

Use `token` when you have the contract address; use `token-by-id` when you have the id. Exits non-zero if not found.

For non-EVM chains pass `--identifier`.

The `id` printed here is the same id accepted by `swap quote --from` / `--to` and `swap execute --from` / `--to`.

---

## Common errors

| Error                                                                                                 | Cause                                                                                                                                                  | Fix                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Amount must include a ticker`                                                                        | `--amount` missing ticker                                                                                                                              | **Ask the user which asset they mean** — do not guess. Then pass the ticker inline, e.g. `--amount '0.5 ETH'`.                                                                                                                                                                                                                                                                        |
| `Ticker UNKN not found in account`                                                                    | ticker not in account balances                                                                                                                         | Run `balances <account>` and show the user the tickers held by this account. **Ask the user which ticker to use, or whether they meant a different account — do not silently substitute another ticker.**                                                                                                                                                                             |
| `[✖] Wrong app. Open Ledger dashboard.` (exit code 4)                                                | `genuine-check` invoked while a currency app is open. Unlike other device commands, `genuine-check` targets the dashboard and has no auto-launch path. | Ask the user to exit the foreground app on the device (short-press both buttons on the app's main screen until `Quit` shows, then confirm), then re-run `genuine-check`. Other device commands (`account discover`, `receive`, `send`, `swap execute`) don't hit this — they auto-prompt the correct app launch.                                                                      |
| `[✖] Rejected on device. No action taken.`                                                           | user rejected a sign request on device                                                                                                                 | The rejection was deliberate. **Ask the user whether to retry or abort** — do not auto-retry. If they retry, have them review amount, recipient, and fees on the device screen before approving.                                                                                                                                                                                      |
| `[✖] Rejected on device. App was not opened.`                                                        | user rejected the app-open prompt on device                                                                                                            | Ask the user to confirm the app-open prompt on the device and re-run the command.                                                                                                                                                                                                                                                                                                     |
| `[✖] Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.` | sandbox blocking USB, or device busy/locked                                                                                                            | Surface to the user that the command needs `dangerouslyDisableSandbox: true` and **ask for confirmation before re-running with the bypass**. The bypass is expected for device commands (`account discover`, `receive`, `send`, `genuine-check`, `swap execute`); if this error fires on any other command, investigate before bypassing rather than disabling the sandbox by reflex. |
| `[object Object]` or garbled APDU output                                                              | two device commands running in parallel (contention)                                                                                                   | Run device-touching commands sequentially — never in parallel tool calls.                                                                                                                                                                                                                                                                                                             |
| `[✖] Ledger not detected. Plug in, unlock, retry.` (exit code 3)                                     | device powered off or unplugged                                                                                                                        | Ask the user to power on the device, unlock it, and connect via USB, then re-run the command.                                                                                                                                                                                                                                                                                         |
| `device-state … awaiting_approval … reason: unlock` (JSON stream)                                     | device locked                                                                                                                                          | Keep the command running — the CLI resumes automatically once unlocked. Ask the user to unlock the device with their PIN.                                                                                                                                                                                                                                                             |
