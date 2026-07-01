---
name: ledger-wallet-cli
description: Official Ledger wallet-cli - USB-based CLI for Ledger hardware wallet flows. Entry/router skill - maps informal requests to the right command, hosts the supporting commands (session, balances, operations, assets, earn, ring) and points to the task skills for account discover, receive, send, swap, and genuine-check.
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

This is the **entry/router** skill. It hosts the intent map, the supporting commands that fit no single task skill (`session`, `balances`, `operations`, `assets`, `earn`, `ring`), and the shared references. For a specific flow, retrieve the dedicated task skill (each is self-contained: informal-request mapping, flags, task errors, and the shared safety rails).

> **Shared safety rails:** every device-touching flow follows [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, on-device confirmation, ambiguous→ask, out-of-scope, shared error table). Each task skill embeds an identical copy. The `earn deposit`/`withdraw` and `ring` flows below are hosted here but obey the same rails.

> **Concepts & rationale:** for _why_ a command behaves the way it does (genuine check, receive-address verification, sessions, sandbox, device contention), read [`references/business-logic.md`](references/business-logic.md).

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Ambiguous requests — ask, don't guess.** If a required parameter is missing or unclear, stop and ask. A wrong guess on a hardware-wallet flow can mean irreversible fund loss. See [`references/safety.md`](references/safety.md).

---

## Intent map

Map informal phrasings to commands. Account references use a session label (e.g. `ethereum-1`). For the five task flows, retrieve the dedicated skill for full detail (flags, examples, task errors).

| User says                                                                           | Command / skill                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| "show me my wallet", "what do I have", "let's get started", no specific task        | `session view` (run _immediately_, before asking anything)                               |
| "find my accounts", "scan my wallet", "import my wallet", "set up Ethereum/Bitcoin" | `account discover <network>` → skill `ledger-wallet-cli-account-discover`                 |
| "where do I send funds to", "give me my address", "deposit address"                 | `receive <account>` → skill `ledger-wallet-cli-receive`                                   |
| "how much do I have", "balance", "what's my ETH balance"                            | `balances <account>`                                                                     |
| "what did I send", "transaction history", "recent activity"                         | `operations <account>`                                                                    |
| "send X to Y", "transfer", "pay", "withdraw to an exchange"                         | `send …` → skill `ledger-wallet-cli-send`                                                 |
| "swap A to B", "convert", "trade ETH for BTC", "exchange"                           | `swap quote` → `swap execute` → `swap status` → skill `ledger-wallet-cli-swap`            |
| "where can I earn", "staking rates", "yield/APY", "best return on my ETH/SOL"       | `earn yields [-n <network>]`                                                              |
| "what am I staking", "my staking positions", "earn balance"                         | `earn positions <account>`                                                                |
| "stake my SOL", "deposit into a vault", "earn yield on my USDC", "delegate"         | `earn deposit <account> --product <id> --amount '<amount>'`                               |
| "unstake", "withdraw my stake", "redeem from vault", "stop earning"                 | `earn withdraw <account> …`                                                               |
| "is this Ledger real", "verify authenticity", "I bought this off eBay"              | `genuine-check` → skill `ledger-wallet-cli-genuine-check`                                 |
| "encrypt this file / these env vars / publish tokens", "GPG alternative", "secret manager", "decrypt anywhere with my Ledger" | `ring init` -> `ring encrypt --key <name>` / `ring decrypt --key <name>` |
| "what keys do I have on my ring", "list domains/projects I've encrypted under"      | `ring keys`                                                                               |
| "wipe my key ring", "destroy the ring", "tear down LKRP membership"                 | `ring destroy`                                                                            |
| "start over", "clear my session", "I switched devices"                             | `session reset`                                                                           |

Retrieve a task skill with, e.g., `wallet-cli skill retrieve ledger-wallet-cli-send` (or install them all with `wallet-cli skill install --all`).

---

## Commands (this skill)

| Command              | Device | Sandbox      |
| -------------------- | ------ | ------------ |
| `session view`       | No     | No           |
| `session reset`      | No     | No           |
| `balances`           | No     | No           |
| `operations`         | No     | No           |
| `assets token`       | No     | No           |
| `assets token-by-id` | No     | No           |
| `earn yields`        | No     | No           |
| `earn positions`     | No     | No           |
| `earn deposit`       | Yes\*  | **Required** |
| `earn withdraw`      | Yes\*  | **Required** |
| `ring init`          | Yes    | **Required** |
| `ring encrypt`       | No     | **Required** |
| `ring decrypt`       | No     | **Required** |
| `ring keys`          | No     | **Required** |
| `ring destroy`       | No     | **Required** |

\*`earn deposit` and `earn withdraw` with `--dry-run` need no device and no sandbox bypass.

The five device-touching flows (`account discover`, `receive`, `send`, `genuine-check`, `swap execute`) live in the task skills and all require `dangerouslyDisableSandbox: true` — see [`references/safety.md`](references/safety.md). The `earn deposit`/`withdraw` and `ring` commands above are hosted here but follow the same sandbox rule; `ring init` and `ring destroy` additionally require an interactive terminal (see the `ring` section).

### session view / reset

`account discover` persists accounts; each gets a label: `<network>[-derivation][-env]-<n>` (e.g. `ethereum-1`, `bitcoin-native-1`, `ethereum-sepolia-1`). All `--account` flags accept a session label.

```bash
pnpm --silent wallet-cli start session view
pnpm --silent wallet-cli start session reset
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

### assets token / token-by-id

Resolve token metadata from the cryptoassets store. No device, no session.

```bash
pnpm --silent wallet-cli start assets token ethereum 0xdac17f958d2ee523a2206206994597c13d831ec7
pnpm --silent wallet-cli start assets token-by-id ethereum/erc20/usd_tether__erc20_
```

Use `token` when you have the contract address; use `token-by-id` when you have the id. Exits non-zero if not found. For non-EVM chains pass `--identifier`.

The `id` printed here is the same id accepted by `swap quote --from` / `--to` and `swap execute --from` / `--to` (see skill `ledger-wallet-cli-swap`).

---

## earn (staking & DeFi yield)

Earn covers two flows: **Ethereum** ERC-4626 DeFi vaults (deposit/redeem) and **Solana** native staking (delegate/undelegate). `yields` and `positions` are read-only (no device); `deposit` and `withdraw` sign on the device (bypass the sandbox — see [`references/safety.md`](references/safety.md)).

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

## ring — Ledger Key Ring (LKRP)

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

## Errors

Supporting commands above are non-device and rarely fail on hardware. For device/USB errors (USB timeout, device not detected, contention, rejected-on-device, locked device) see [`references/safety.md`](references/safety.md), and see each task skill for its task-specific errors. The `earn deposit`/`withdraw` and `ring` flows share the same device/USB error table in [`references/safety.md`](references/safety.md).
