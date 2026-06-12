---
name: ledger-wallet-cli
description: Official Ledger wallet-cli - CLI for Ledger hardware wallet flows over USB or BLE (devices, account discover, receive, balances, operations, send, swap quote/execute/status, genuine-check, assets token / token-by-id). Use for any wallet-cli command execution and for mapping informal requests to the right command.
---

# wallet-cli

CLI for Ledger wallet flows over **USB** (default) or opt-in **BLE**. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Concepts & rationale:** for _why_ a command behaves the way it does, or to surface a safety rule that this skill states tersely (genuine check, receive-address verification, sessions, sandbox, device contention), read [`references/business-logic.md`](references/business-logic.md).

> **Machine interface:** the field-by-field envelope schemas, the full error-code table, and per-command JSON data keys live in [`references/machine-interface.md`](references/machine-interface.md). Read it before writing any parser.

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `devices`, `account discover`, `receive`, `send`, `genuine-check`, `swap execute` **must** use `dangerouslyDisableSandbox: true` — sandbox blocks the USB/BLE transports (causes a device timeout error). Other commands are fine in sandbox.

> **Device contention:** Run **one wallet-cli device command at a time** — across all your tool calls and sessions. Two concurrent device commands fail with `[object Object]` or garbled APDU. Run sequentially.

> **Device readiness:** Before running a device command, briefly describe what you're about to do. The CLI prompts for device interaction itself — **don't time out or kill the command**. _Exception: `genuine-check` exits immediately (`[✖] Wrong app. Open Ledger dashboard.`, exit code 4) if any currency app is open — unlike the other device commands, it targets the dashboard and has no auto-launch path. Ensure the device is on the dashboard before running; if it exits, ask the user to back out to the dashboard and re-run._

> **Ambiguous requests — ask, don't guess.** If a required parameter is missing or unclear (no recipient for `send`, no network for `account discover`, an amount with no ticker), stop and ask. A wrong guess on a hardware wallet flow can mean irreversible fund loss. The same rule applies to flags: never invent or "fix" a flag by guessing — unknown flags are rejected with exit 64.

---

## Output contract (NDJSON)

Always pass `--output json` when you will parse the result. In JSON mode **stdout is NDJSON**: zero or more typed **intermediate events**, then exactly **one final envelope**.

Intermediate events — dispatch on `type` first:

- `{"type":"device-state", "command", "network", "account"?, "state":{"code","reason"?}, "message"}` — device progress (see the runbook below).
- `{"type":"pre-verify-address", "command", "network", "account", "address"}` — emitted by `receive` before device confirmation, so you can show the human the address to compare against the device screen.

Final envelopes — three shapes, two streams:

| Shape                                                                                                                                                     | Stream                                   | When                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `{"status":"success", "command", "network", "account"?, ...data, "timestamp"}`                                                                           | stdout                                   | command succeeded                                                          |
| `{"ok":false, "error":{"command", "code", "message", "retryable", "hint"?, "details"?}}`                                                                 | stdout                                   | command failed — `code` is always present (`"unknown"` is the fallback)    |
| bunli framework JSON: `{"ok":false,"error":{"kind","name","tag",...}}` for flag validation / unknown commands; `{"ok":true,"data":{...}}` for help/version | stderr (errors) / stdout (help, version) | failures in the framework layer, before the command handler runs           |

Traps:

- Success keys on `status`; errors key on `ok`. Check `type`, then `status`, then `ok` — in that order.
- Capture **both** streams: framework validation errors land on **stderr** even when `--output json` was passed.
- Amounts in JSON are formatted strings with ticker (`"0.5 ETH"`), not atomic integers.

---

## Exit codes — required action per code

Prefer `error.code` from the envelope; fall back to the exit code only when stdout is unavailable.

| Exit      | Error codes                                                                                                  | Meaning                                                  | Required agent action                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0         | —                                                                                                            | success                                                  | Proceed.                                                                                                                                       |
| 1         | `unknown`, `account_not_found`, `session_corrupt`, `raw_descriptor_rejected`, `swap_quotes_unavailable`      | generic / resolution failure                             | Read `error.code` + `hint`, fix the cause. Do not blind-retry.                                                                                 |
| 2         | `rejected`                                                                                                   | **the human refused on the device**                      | **NEVER auto-retry.** The rejection was deliberate — ask the human whether to retry or abort.                                                  |
| 3         | `disconnected`, `device_not_found`                                                                           | device unreachable                                       | Ask the human to check the cable (USB) or power/Bluetooth (Flex/Stax) and unlock the device, then retry (`retryable: true`).                   |
| 4         | `wrong_app`                                                                                                  | wrong app open on the device                             | Ask the human to open the expected app (`error.details.expected`), then retry.                                                                 |
| 5         | `app_not_installed`                                                                                          | required app missing                                     | Ask the human to install `error.details.appName` via Ledger Live. Do not retry until installed.                                               |
| 6         | `timeout`                                                                                                    | device wait expired (`--device-timeout`, default 60000 ms) | Confirm the human is present and the device is awake, then retry. If a sign was in flight, run the duplicate-spend check first.                |
| 7         | `locked`                                                                                                     | device locked (changed: previously 6, shared with timeout) | Ask the human to unlock the device with their PIN, then retry.                                                                                 |
| 64        | `unknown_flag`, `invalid_flag_value`, `missing_required_flag`, `unknown_command`, `invalid_transport`, `device_ambiguous` | **your invocation is wrong**                             | Fix the command line — never retry by guessing flags. For `device_ambiguous`, pick from `error.details.candidates` and pass `--device <id>`. |
| 130 / 143 | —                                                                                                            | SIGINT / SIGTERM                                         | Treat as cancelled; report, don't retry silently.                                                                                              |

Unknown flags **hard-fail** with exit 64 (`unknown_flag`) before any device or network work — a typo like `--dryrun` is rejected, never silently dropped.

---

## Device-state runbook

A `{"type":"device-state"}` event with `state.code: "awaiting_approval"` means the CLI is healthy and waiting **on the human**. Keep the process running (it gives up by itself after `--device-timeout`) and relay exactly what to do:

| `state.reason`   | Tell the human                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sign`           | "Review the amount, recipient, and fees on the Ledger screen, then approve or reject."                          |
| `verify_address` | "Compare the address on the Ledger screen with the one I showed you; approve only if they match exactly."       |
| `open_app`       | "Open the app named in the prompt on the device." (the event `message` names the app)                           |
| `unlock`         | "Unlock the device with your PIN." — the command resumes automatically.                                          |

Never kill a command that is waiting on the device.

---

## Money-movement rails

1. **Dry-run first, verify the echo.** Before any live `send`, run the identical command with `--dry-run` and confirm the JSON result contains `"dry_run": true` plus the intended recipient/amount/fee. Show those to the human and get explicit approval, then re-run the byte-identical command without `--dry-run`. If `dry_run: true` is missing from the output, the flag did not take — **abort**.
2. **Duplicate-spend rule.** After any ambiguous failure (timeout, disconnect, crash, unparseable output) that follows an `awaiting_approval` event with reason `sign`, the transaction may already be signed and broadcast. Check `operations` for the transaction (or the tx hash from any partial output, or `swap status` for swaps) **before** re-sending. Never re-send on a hunch.
3. **`swap execute`: silence is in-progress.** In JSON mode it emits no device-state events between launch and the final envelope — never kill it. Brief the human **before** launching: unlock the device, be ready to open the Exchange app and approve on-device. After any ambiguous outcome, `swap status` is the only monitoring/recovery path. A swap is irreversible once approved on the device.
4. **`receive --no-verify` is unattested.** It returns a software-derived address (`"verified": false`, `"source": "software-derivation"`) that was never confirmed on the trusted display. Never hand it to third parties for deposits.

---

## Devices & transports

The default transport is USB. BLE is opt-in via `WALLET_CLI_TRANSPORT=ble` (Flex/Stax/Nano X paired over Bluetooth).

- `devices` lists every reachable Ledger across USB and BLE — read-only scan (~4 s per transport), no on-device approval. JSON data: `{"devices":[{"id","name","model","transport"}]}`.
- `--device <id|name>` selects a device on every device command; `WALLET_CLI_DEVICE` is the env fallback (the flag wins). Matching: transport-id exact or prefix, or case-insensitive name substring (`--device flex`).
- With `WALLET_CLI_TRANSPORT` unset, the transport is inferred from where the matched device lives (adds a ~4-8 s scan). An invalid value exits 64 with code `invalid_transport`.
- **Refuse-to-guess:** several reachable devices with no selector fail with code `device_ambiguous` (exit 64) and `error.details.candidates[]` (`{id,name,model,transport}`) — pick one and re-run with `--device <id>`.
- No reachable device fails with code `device_not_found` (exit 3, retryable) — have the human plug in / power on the device, unlock it, and enable Bluetooth on Flex/Stax.
- BLE requires the optional `@abandonware/noble` dependency; when missing, the error says so — install it or fall back to USB. After any BLE use the process hard-exits once finished (the BLE stack pins the event loop), so an abrupt exit **after** the final envelope is expected, not a crash.
- `--device-timeout <ms>` (default 60000) bounds every device wait (unlock, app open, approval).

```bash
pnpm --silent wallet-cli start devices
pnpm --silent wallet-cli start receive ethereum-1 --device flex
WALLET_CLI_DEVICE=flex pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH' --dry-run
WALLET_CLI_TRANSPORT=ble pnpm --silent wallet-cli start devices
```

---

## Intent map

Map informal phrasings to commands. Account references use a session label (e.g. `ethereum-1`).

| User says                                                                           | Command                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| "show me my wallet", "what do I have", "let's get started", no specific task        | `session view` (run _immediately_, before asking anything)   |
| "which devices are connected", "is my Flex reachable", "list my Ledgers"            | `devices`                                                    |
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

`account discover` persists accounts to `~/.local/state/ledger-wallet-cli/session.yaml` (mode 0600; labels, addresses, and derivation paths only — no key material). Each account gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`).

- All `--account` flags accept a session label only. Raw descriptors are never valid CLI arguments — the label is the only account handle. Run `account discover` first to populate the session.
- Labels are **stable**: accounts are deduped by descriptor, so re-running `account discover` returns the same labels for known accounts and only appends new ones.
- `session view` shows the store; `session reset` wipes it. A corrupt store fails with code `session_corrupt` — the fix is `session reset`, then re-discover.
- The store has no file locking: never run two `account discover` / `session reset` invocations concurrently.

---

## Commands

| Command              | Device     | Sandbox      |
| -------------------- | ---------- | ------------ |
| `session view`       | No         | No           |
| `session reset`      | No         | No           |
| `devices`            | Scan only  | **Required** |
| `account discover`   | Yes        | **Required** |
| `receive`            | Yes        | **Required** |
| `send`               | Yes\*      | **Required** |
| `genuine-check`      | Yes        | **Required** |
| `balances`           | No         | No           |
| `operations`         | No         | No           |
| `swap quote`         | No         | No           |
| `swap execute`       | Yes        | **Required** |
| `swap status`        | No         | No           |
| `assets token`       | No         | No           |
| `assets token-by-id` | No         | No           |

\*`send --dry-run` needs no device and no sandbox bypass.

### session view / reset

```bash
pnpm --silent wallet-cli start session view
pnpm --silent wallet-cli start session reset
```

### devices

```bash
pnpm --silent wallet-cli start devices
pnpm --silent wallet-cli start devices --output json
```

Read-only scan across USB and BLE; lists `id`, `name`, `model`, `transport` per device. Use the `id` (or a name substring) with `--device` on any device command.

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
pnpm --silent wallet-cli start receive ethereum-1 --device flex
pnpm --silent wallet-cli start receive ethereum-1 --no-verify  # skip device confirmation — UNATTESTED address (source: software-derivation)
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
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH' --dry-run  # ALWAYS dry-run first (see Money-movement rails)
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH'
pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '100 USDT'  # ERC-20
pnpm --silent wallet-cli start send bitcoin-native-1 --to bc1q... --amount '0.001 BTC' --fee-per-byte 15 --rbf
```

Ticker is **mandatory** in `--amount`. No `--token` flag — ticker drives asset resolution.

**Bitcoin flags:** `--fee-per-byte <sats>`, `--rbf`

**Solana flags:** `--mode send|stake.createAccount|stake.delegate|stake.undelegate|stake.withdraw`, `--validator <addr>`, `--stake-account <addr>`, `--memo <text>`

**EVM `--data` (0x-prefixed calldata)** is an arbitrary contract interaction — require the human to explain and confirm it like any contract call before signing.

### swap quote

Fetches quotes in parallel from the built-in provider list (no device when addresses are supplied via flags below).

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** — native assets (e.g. `ethereum`, `bitcoin`, `solana`) **or token IDs** when the token’s parent chain is a supported native swap currency (same IDs the CLI allows for swap). They are **not** session account labels — use `--from-account` / `--to-account` (or fresh addresses) for accounts.

**Default providers queried by `swap quote` and usable by `swap execute`:** `changelly`, `cic`, `exodus`, `nearintents`, `swapsxyz`.

**Addresses (pick one per side):** `--from-fresh-address` or `--from-account`; `--to-fresh-address` or `--to-account`. Account flags accept a session label only; the CLI resolves a fresh receive address like `receive`.

```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-fresh-address 0xABC... --to-fresh-address bc1q...
pnpm --silent wallet-cli start swap quote -f ethereum -t bitcoin --amount 0.1 --from-fresh-address 0xABC... --to-fresh-address bc1q... --output json
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1 --output json
```

Required: `--from`, `--to`, `--amount`, and both sides covered by the address flags above.

If no provider returns a quote, the error has code `swap_quotes_unavailable` with `provider_errors[]` — retry later or with a different pair; do not retry in a tight loop.

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

There is **no dry-run** for `swap execute`, and JSON mode stays silent until the final envelope — follow rule 3 of the Money-movement rails (brief the human first, never kill it, `swap status` is the only recovery path).

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
| `[✖] Wrong app. Open Ledger dashboard.` (exit 4, code `wrong_app`)                                   | `genuine-check` invoked while a currency app is open. Unlike other device commands, `genuine-check` targets the dashboard and has no auto-launch path. | Ask the user to exit the foreground app on the device (short-press both buttons on the app's main screen until `Quit` shows, then confirm), then re-run `genuine-check`. Other device commands (`account discover`, `receive`, `send`, `swap execute`) don't hit this — they auto-prompt the correct app launch.                                                                      |
| `[✖] Rejected on device. No action taken.` (exit 2, code `rejected`)                                 | user rejected a sign request on device                                                                                                                 | The rejection was deliberate. **Ask the user whether to retry or abort** — do not auto-retry. If they retry, have them review amount, recipient, and fees on the device screen before approving.                                                                                                                                                                                      |
| `[✖] Rejected on device. App was not opened.` (exit 2, code `rejected`)                              | user rejected the app-open prompt on device                                                                                                            | Ask the user to confirm the app-open prompt on the device and re-run the command.                                                                                                                                                                                                                                                                                                     |
| `[✖] Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.` (exit 6, code `timeout`) | sandbox blocking the transport, or device busy/asleep                                                                                                  | Surface to the user that the command needs `dangerouslyDisableSandbox: true` and **ask for confirmation before re-running with the bypass**. The bypass is expected for device commands (`devices`, `account discover`, `receive`, `send`, `genuine-check`, `swap execute`); if this error fires on any other command, investigate before bypassing rather than disabling the sandbox by reflex. If a sign was in flight, run the duplicate-spend check before retrying. |
| `Ledger is locked. Unlock your device with your PIN and retry.` (exit 7, code `locked`)              | device locked and the command could not wait                                                                                                           | Ask the user to unlock the device with their PIN, then re-run the command (`retryable: true`).                                                                                                                                                                                                                                                                                        |
| `<App> app is not installed. Install it via Ledger Live and retry.` (exit 5, code `app_not_installed`) | required currency app missing (`error.details.appName`)                                                                                                | Ask the user to install the app via Ledger Live (My Ledger tab), then re-run. Do not retry until installed.                                                                                                                                                                                                                                                                           |
| `[object Object]` or garbled APDU output                                                              | two device commands running in parallel (contention)                                                                                                   | Run device-touching commands sequentially — never in parallel tool calls.                                                                                                                                                                                                                                                                                                             |
| `[✖] Ledger not detected. Plug in, unlock, retry.` (exit 3, code `disconnected`)                     | device powered off or unplugged mid-command                                                                                                            | Ask the user to power on the device, unlock it, and check the cable (USB) or Bluetooth (Flex/Stax), then re-run the command.                                                                                                                                                                                                                                                          |
| `No Ledger device found` (exit 3, code `device_not_found`)                                            | pre-connect scan found no reachable device                                                                                                             | Ask the user to plug in / power on the device, unlock it, and enable Bluetooth on Flex/Stax; then retry (`retryable: true`).                                                                                                                                                                                                                                                          |
| `Multiple Ledger devices found` (exit 64, code `device_ambiguous`)                                    | several devices reachable, no `--device`/`WALLET_CLI_DEVICE` selector                                                                                  | Pick a device from `error.details.candidates` (or run `devices`) and re-run with `--device <id>`.                                                                                                                                                                                                                                                                                     |
| Ambiguous `--device` selector (exit 64, code `device_ambiguous`)                                      | selector matches more than one device                                                                                                                  | Use a longer transport-id prefix or the full id from `error.details.candidates`.                                                                                                                                                                                                                                                                                                      |
| Unknown flag (exit 64, code `unknown_flag`)                                                           | typo'd or invented flag                                                                                                                                | Fix the spelling against `<command> --help` — never retry by guessing another flag.                                                                                                                                                                                                                                                                                                   |
| `Invalid WALLET_CLI_TRANSPORT` (exit 64, code `invalid_transport`)                                    | env var typo — **not** a device problem                                                                                                                | Set `WALLET_CLI_TRANSPORT` to `usb` or `ble` (or unset it), then retry.                                                                                                                                                                                                                                                                                                               |
| `Invalid session file at <path>` (code `session_corrupt`)                                             | corrupt `session.yaml`                                                                                                                                 | Run `session reset`, then `account discover` to repopulate.                                                                                                                                                                                                                                                                                                                           |
| `No account labeled "X" in session` (code `account_not_found`)                                        | label not in session store                                                                                                                             | Run `session view` to list labels; run `account discover` if the account was never discovered. Do not invent labels.                                                                                                                                                                                                                                                                  |
| Swap quote failure (code `swap_quotes_unavailable`, `provider_errors[]`)                              | no provider returned a quote                                                                                                                           | Inspect `provider_errors`, retry later or with a different pair/provider — not in a tight loop.                                                                                                                                                                                                                                                                                       |
| BLE error naming `@abandonware/noble`                                                                 | optional BLE dependency not installed                                                                                                                  | Install the optional dependency, or use USB (`WALLET_CLI_TRANSPORT=usb` or unset).                                                                                                                                                                                                                                                                                                    |
| `device-state … awaiting_approval … reason: unlock` (JSON stream)                                     | device locked while a command waits                                                                                                                    | Keep the command running — the CLI resumes automatically once unlocked. Ask the user to unlock the device with their PIN.                                                                                                                                                                                                                                                             |
