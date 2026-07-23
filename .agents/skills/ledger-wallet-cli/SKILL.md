---
name: ledger-wallet-cli
description: Official Ledger wallet-cli - USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send, swap quote/execute/status, genuine-check, assets token / token-by-id) and the Ledger Key Ring (ring init/encrypt/decrypt/keys/destroy — LKRP-backed encryption of files and text). Use for any wallet-cli command execution and for mapping informal requests to the right command.
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Concepts & rationale:** for _why_ a command behaves the way it does, or to surface a safety rule that this skill states tersely (genuine check, receive-address verification, sessions, sandbox, device contention), read [`references/business-logic.md`](references/business-logic.md).

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `account discover`, `receive`, `send`, `genuine-check`, `swap execute`, `ring encrypt`, `ring decrypt`, `ring keys`, `ring destroy` **must** use `dangerouslyDisableSandbox: true` — the first group is blocked by USB restrictions; the ring commands are blocked by OS keychain access restrictions.

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
| "where can I earn", "staking rates", "yield/APY", "best return on my ETH/SOL"        | `earn yields [-n <network>]`                                |
| "what am I staking", "my staking positions", "earn balance"                         | `earn positions <account>`                                  |
| "stake my SOL", "deposit into a vault", "earn yield on my USDC", "delegate"          | `earn deposit <account> --product <id> --amount '<amount>'` |
| "unstake", "withdraw my stake", "redeem from vault", "stop earning"                 | `earn withdraw <account> …`                                 |
| "is this Ledger real", "verify authenticity", "I bought this off eBay"              | `genuine-check`                                              |
| "encrypt this file / these env vars / publish tokens", "GPG alternative", "secret manager", "decrypt anywhere with my Ledger" | `ring init` -> `ring encrypt --key <name>` / `ring decrypt --key <name>` |
| "what keys do I have on my ring", "list domains/projects I've encrypted under"       | `ring keys`                                                  |
| "wipe my key ring", "destroy the ring", "tear down LKRP membership"                 | `ring destroy`                                               |
| "start over", "clear my session", "I switched devices"                              | `session reset`                                              |

---

## Out of scope — say no, don't improvise

If the user asks for any of the following, surface that wallet-cli does not support it yet rather than constructing a command:

- NFTs (mint, transfer, view).
- OpenPGP-compatible output or key-share / multi-recipient encryption (the `ring` commands encrypt with a per-user Ledger Key Ring, not a sharable key).
- `send`, `receive`, `operations`, or `swap execute` on testnets and layer 2s (e.g. Base).
- Custom chains not listed in the Networks line above.

---

## Session & labels

`account discover` persists accounts. Each gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`).

All `--account` flags accept a session label (e.g. `ethereum-1`). Run `account discover` first to populate the session.

---

## Commands

| Command              | Device | Sandbox      | TTY†        | Network |
| -------------------- | ------ | ------------ | ----------- | ------- |
| `session view`       | No     | No           | No          | No      |
| `session reset`      | No     | No           | No          | No      |
| `account discover`   | Yes    | **Required** | No          | Yes     |
| `receive`            | Yes    | **Required** | No          | No      |
| `send`               | Yes\*  | **Required** | No          | Yes     |
| `genuine-check`      | Yes    | **Required** | No          | Yes     |
| `balances`           | No     | No           | No          | Yes     |
| `operations`         | No     | No           | No          | Yes     |
| `swap quote`         | No     | No           | No          | Yes     |
| `swap execute`       | Yes    | **Required** | No          | Yes     |
| `swap status`        | No     | No           | No          | Yes     |
| `assets token`       | No     | No           | No          | No      |
| `assets token-by-id` | No     | No           | No          | No      |
| `earn yields`        | No     | No           | No          | Yes     |
| `earn positions`     | No     | No           | No          | Yes     |
| `earn deposit`       | Yes\*  | **Required** | No          | Yes     |
| `earn withdraw`      | Yes\*  | **Required** | No          | Yes     |
| `ring init`          | Yes    | **Required** | Required‡   | Yes     |
| `ring encrypt`       | No     | **Required** | No          | Yes     |
| `ring decrypt`       | No     | **Required** | No          | Yes     |
| `ring keys`          | No     | **Required** | No          | No      |
| `ring destroy`       | No     | **Required** | Required‡‡  | Yes     |

\*`send`, `earn deposit`, and `earn withdraw` with `--dry-run` need no device and no sandbox bypass.

†TTY: whether the command requires an interactive terminal for user input.

‡`ring init` requires a password to protect the ring. `WALLET_PASS` must already be provided in the environment by the developer/user before the command runs — the agent never sets or injects it (see [Non-TTY password injection](#ring--ledger-key-ring-lkrp)).

‡‡`ring destroy` prompts for typed confirmation (`"destroy"`). Pipe it in non-interactive shells: `echo "destroy" | wallet-cli ring destroy`. If a password was set, `WALLET_PASS` must already be present in the environment (provided by the developer, not the agent).

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

**Default providers queried by `swap quote` and usable by `swap execute`:** `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `lifi`, `nearintents`, `okx`, `oneinch`, `swapsxyz`, `uniswap`, `velora`. Some are CEX/aggregators run through the legacy Exchange-app pipeline; the DEX providers (`uniswap`, `oneinch`, `velora`, `okx`) execute in the partner's embedded coin app — see [swap execute — DEX providers](#swap-execute).

**Accounts:** `--from-account` and `--to-account` accept a session label only; the CLI resolves a fresh receive address from the account like `receive`.

```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1
pnpm --silent wallet-cli start swap quote -f ethereum -t bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1 --output json
```

Required: `--from`, `--to`, `--from-account`, `--to-account`, `--amount`.

### swap execute

**Currencies:** `--from` / `-f` and `--to` / `-t` are Ledger **currency IDs** (same as `swap quote`): native assets or **tokens** on an allowed parent chain. They must match the asset of the source `--account` and of `--to-account` respectively.

**Providers:** Valid `--provider` values are `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `lifi`, `nearintents`, `okx`, `oneinch`, `swapsxyz`, `uniswap`, `velora`. Aliases: `changelly` → `changelly_v2`, `1inch` → `oneinch`. Use the provider id shown on the quote line you pick from `swap quote`.

**DEX providers (`uniswap`, `oneinch`, `velora`, `okx`):** these run end-to-end **in the partner's embedded coin app** on the device (via the Device Intent Executor), not the legacy Exchange app. The flow re-fetches a quote for the chosen provider, then drives an on-device approval + swap sequence (`sign-approval` / `sign-permit2` / `sign-swap` / broadcast), switching device apps as needed — confirm each `Open <app>` and signing prompt on the device.

- **EVM only.** DEX execution requires an **EVM source account** (e.g. `ethereum`); a non-EVM `--account` falls through to the legacy pipeline.
- **RFQ quotes are not supported in the CLI.** If the picked quote resolves to an RFQ plan (`rfq-order` / `approval-then-rfq-order`), the embedded flow is skipped and execution **falls back to the legacy Exchange-app pipeline** (you'll see a `falling back to legacy Exchange-app pipeline` progress line).

All other providers (`changelly`, `cic`, `exodus`, `nearintents`, `swapsxyz`, `lifi`, …) run the legacy Exchange-app pipeline (nonce → payload → complete exchange → sign/broadcast).

**Fee strategy:** `--fee-strategy` accepts `slow`, `medium` (default), or `fast`. On the legacy pipeline it sets the refund-chain transaction fee.

```bash
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1
pnpm --silent wallet-cli start swap execute -f ethereum -t bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --fee-strategy fast
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --output json
# DEX (embedded coin app): EVM-only, source and destination on an EVM chain
pnpm --silent wallet-cli start swap execute --from ethereum --to ethereum/erc20/usd_tether__erc20_ --account ethereum-1 --to-account ethereum-1 --provider uniswap --amount 0.1
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

### ring — Ledger Key Ring (LKRP)

Trustless, hardware-rooted encryption for files and text. The key ring is provisioned once on your Ledger via the Ledger Sync app; afterwards `encrypt`/`decrypt` run **without** the device — keys derive deterministically via HKDF-SHA256 from the LKRP-shared root and never leave AES-256-GCM. `encrypt`/`decrypt` still call the LKRP backend to restore the trustchain on each invocation, so network access is required. The ring is recoverable from your seed on any new machine.

```bash
# One-time provisioning (device required). Password comes from WALLET_PASS in the environment (see below); name the machine with --name.
pnpm --silent wallet-cli start ring init
pnpm --silent wallet-cli start ring init --name my-laptop

# File round-trip (no device after init):
pnpm --silent wallet-cli start ring encrypt --key my-oss-project -i .publish-tokens -o .publish-tokens.enc
pnpm --silent wallet-cli start ring decrypt --key my-oss-project -i .publish-tokens.enc -o .publish-tokens

# Text via stdin/stdout (clipboard pattern):
pbpaste | pnpm --silent wallet-cli start ring encrypt --key personal-notes | pbcopy
pbpaste | pnpm --silent wallet-cli start ring decrypt --key personal-notes | pbcopy

# List the keys this machine has used; tear down the ring:
pnpm --silent wallet-cli start ring keys
pnpm --silent wallet-cli start ring destroy
```

> **Always provision with a password.** The ring must be protected by a password. The user provides it via `WALLET_PASS` in the environment before running `ring init` (see [Non-TTY password injection](#ring--ledger-key-ring-lkrp)) — the agent never provisions a ring without one.

> **Decrypted output is sensitive.** `ring decrypt` emits secrets — never print them to the terminal, `cat` a decrypted file, or otherwise surface the decrypted contents, since they land in the agent transcript, logs, and scrollback. Pipe `decrypt` straight to its destination (a file via `-o`, another process, or the clipboard as shown above) or capture it into an env var; avoid `--output`/logging sinks that could echo it back.

`--key <name>` derives a per-name AES-256-GCM key; matching name at decrypt time is mandatory. Names are free-form (max 253 chars, no whitespace) — common patterns: project slugs (`my-oss-project`), env tags (`openClaw-prod`), notebooks (`personal-notes`).

**Non-TTY (CI / agentic) password injection:** the `ring` commands read the password from the `WALLET_PASS` env var when there is no TTY. **The password itself must be provisioned by the developer/user (exported in the environment or stored in the OS keychain) — the agent never chooses, types, or otherwise handles the secret value; it only references what the user has already provisioned.**

- **Never write the password literally** into a command (e.g. `WALLET_PASS=hunter2 wallet-cli …`, or via a flag). A literal leaks into shell history, `ps` output, CI logs, and — when an agent runs the command — the **agent transcript**. This applies to throwaway/test passwords too: make it a habit, because the same command shape is reused with a real secret.
- **Always inject via command substitution** so the secret never appears in the command text you type:
  - macOS : `WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) wallet-cli ring encrypt …`
  - Linux : `WALLET_PASS=$(secret-tool lookup service ledger-wallet-cli account default) wallet-cli ring encrypt …`
- **Agents must not handle the secret at all.** Ask the user to store the password once in their OS keychain, then reference only the `$(…)` substitution. If a test or `ring init` needs a password, store a throwaway value in the keychain first (`security add-generic-password -a default -s ledger-wallet-cli -w`) and inject it the same way — never type the literal into a tool call.
- Even via substitution the value lives in the child process environment (readable via `ps eww` by the same user) — acceptable, but prefer the keychain form and avoid `--output json` sinks or logs that could echo it back.

**Rotation limitation:** the domain key derives from the ring's wallet-sync encryption key, which the LKRP protocol **rotates when a ring member is removed**. After a rotation, data encrypted before it can no longer be decrypted (decrypt fails with a "wrong key name, corrupted data, or the Ledger Key Ring rotated" error, and the CLI prints a `⚠ Ledger Key Ring rotated` warning). Re-encrypt the affected data under the new ring after a member is removed. `ring destroy` aborts (no changes) if you enter a wrong password, and also if `WALLET_PASS` is set but empty (a failed keychain lookup) — this is treated as a mistake, not a skip, so it never orphans the remote ring. To intentionally skip the remote teardown and wipe only local credentials, press Enter at the interactive password prompt.

---

## earn (staking & DeFi yield)

Earn covers two flows: **Ethereum** ERC-4626 DeFi vaults (deposit/redeem) and **Solana** native staking (delegate/undelegate). `yields` and `positions` are read-only (no device); `deposit` and `withdraw` sign on the device.

> **Only ethereum & solana** support `deposit`/`withdraw`. Other networks appear in `earn yields` (informational) but cannot be deposited to via the CLI.

### earn yields

Lists yield opportunities (no device). Without `--network` it prints every network's headline rate. **With `-n ethereum` or `-n solana` it also prints the concrete deposit targets**, each ending with the exact `→ --product <id>` value to pass to `earn deposit`:

- **ethereum** → ERC-4626 vault ids (e.g. `1_0x7daeba3f217614e409f85d3014d33923a6b03630`).
- **solana** → validator vote accounts. The CLI surfaces the **Ledger-operated** validators ("Ledger by Figment", "Ledger by Bitwise") as the recommended targets; any other valid vote account also works as `--product`.

```bash
pnpm --silent wallet-cli start earn yields
pnpm --silent wallet-cli start earn yields -n solana
pnpm --silent wallet-cli start earn yields -n ethereum --output json
```

There is no separate "list validators / vaults" command — `earn yields -n <network>` **is** how you discover a valid `--product`. In JSON, the value is the `vaultId` (ETH) or `validator` (SOL) field on each row.

### earn positions

Lists active earn positions for an account (no device). Account-based networks only (solana, ethereum).

```bash
pnpm --silent wallet-cli start earn positions solana-1
pnpm --silent wallet-cli start earn positions solana-1 --fresh   # request a background refresh
```

`--fresh` flags stale rows for an async backend refresh; the refreshed data shows up on a **re-run**, not in the same response. Watch for the `(stale)` marker.

**Solana stake accounts:** for Solana accounts the command also reads on-chain stake accounts and prints each one's `→ --stake-account <address>`, its `state` (active / inactive / activating / deactivating), balance, and validator. **This is where you get the `--stake-account` value for `earn withdraw`.** In JSON they're a **top-level `stakes[]`** array alongside `positions` (each entry: `stakeAccount`, `validator`, `state`, `stakeBalance`, `withdrawable`); the `stakes` key is omitted entirely when there are none. Stake accounts show up here right after a deposit even if the backend snapshot is still empty. (Requires a chain sync; if it can't be reached the backend snapshot still prints, with a warning.)

### earn deposit

Stakes (Solana) or deposits into a vault (Ethereum). **Touches the device** to sign — bypass the sandbox. `--product` comes from `earn yields -n <network>` (see above). `--amount` requires a ticker.

```bash
# Solana: --product is a validator vote account
pnpm --silent wallet-cli start earn deposit solana-1 --product 26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx --amount '1.5 SOL'
# Ethereum: --product is a vault id
pnpm --silent wallet-cli start earn deposit ethereum-1 --product 1_0x7daeba3f217614e409f85d3014d33923a6b03630 --amount '100 USDC'
# Validate without signing (no device, no sandbox bypass)
pnpm --silent wallet-cli start earn deposit solana-1 --product 26pV97… --amount '1.5 SOL' --dry-run
```

Solana `stake.createAccount` creates **and** delegates the stake account in one transaction. Ethereum deposits may run two transactions (ERC-20 `approve` then `deposit`).

**First-time ETH vault deposit — dry-run can't validate the deposit leg.** A first deposit into a vault you've never used is `approve` → `deposit`, and the deposit can only be built once a non-zero allowance exists on-chain. In `--dry-run` nothing is broadcast, so when an approve is still required the CLI validates the approve and **skips** the deposit build (status `not-simulated …`, overall `dry-run: approve validated; deposit needs an on-chain allowance to simulate`) rather than surfacing the backend's opaque 500. This is expected — **not** a balance error. The only way to validate the deposit leg is the real run (broadcast `approve`, wait for confirmation, then `deposit`). Treat a clean dry-run here as "approve is fine"; **confirm with the user before the live run** since it's an irreversible on-device signature. Once the allowance exists, a re-run of `--dry-run` will simulate the deposit normally.

### earn withdraw

Unstakes (Solana) or redeems from a vault (Ethereum). **Touches the device** — bypass the sandbox.

- **Ethereum:** `--product <vault-id>` required; `--amount` optional. The amount is in the vault's **asset** units (e.g. `'50 USDC'`); if a ticker is given it must match the vault asset. **Omit `--amount` for a full exit:** the CLI sends `amount:"max"` and the backend redeems the entire share balance, leaving no dust (don't compute the asset amount yourself for a full exit — the share→asset rate drifts).
- **Solana:** `--stake-account <address>` (required). **Two-phase:** run once to `undelegate` (deactivate), wait for the deactivation epoch boundary (~2–3 days), then re-run with `--finalize` to withdraw the now-inactive lamports back to the main account. coin-solana computes the withdrawable amount on-chain, so `--amount` is ignored on finalize.

```bash
# Ethereum vault redeem
pnpm --silent wallet-cli start earn withdraw ethereum-1 --product 1_0x7daeba3f… --amount '50 USDC'
# Solana phase 1: deactivate
pnpm --silent wallet-cli start earn withdraw solana-1 --stake-account <stakeAccountAddr>
# Solana phase 2 (after ~2–3 days): withdraw
pnpm --silent wallet-cli start earn withdraw solana-1 --stake-account <stakeAccountAddr> --finalize
```

Get the Solana `--stake-account` address from `earn positions <account>` (its `stakes[]` / `→ --stake-account` lines) — that's the stake account created by your earlier `earn deposit`.

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
