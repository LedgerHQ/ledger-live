---
name: ledger-wallet-cli
description: Official Ledger wallet-cli - USB-based CLI for Ledger hardware wallet flows (account discover, receive, balances, operations, send, swap quote/execute/status, genuine-check, assets token / token-by-id), the Ledger Key Ring (ring init/encrypt/decrypt/keys/destroy — LKRP-backed encryption of files and text), and Agent Intent (agent-intent enroll/recover/list/show/sync/send/swap/intents/status/cancel — enroll or recover a remote agent's software identity, import the Ledger Sync accounts it was granted, propose Ethereum and Solana payments and Ethereum swaps for human review, list the intents it proposed, check their status and cancel them, no device required, never broadcasts, a separate trust model from `ring`). Use for any wallet-cli command execution and for mapping informal requests to the right command.
---

# wallet-cli

USB-based CLI for Ledger wallet flows. Networks: **bitcoin**, **ethereum**, **solana** (mainnet + testnets).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Concepts & rationale:** for _why_ a command behaves the way it does, or to surface a safety rule that this skill states tersely (genuine check, receive-address verification, sessions, sandbox, device contention), read [`references/business-logic.md`](references/business-logic.md).

> **Session first:** When invoked without a specific task, **immediately run `session view`** — do not ask the user what to do first. Show the result, then ask what to do next. If labels exist, skip `account discover`.

> **Sandbox:** `account discover`, `receive` (without `--no-verify`), `send` (without `--dry-run`), `genuine-check`, `swap execute`, `earn deposit` (without `--dry-run`), `earn withdraw` (without `--dry-run`), `ring init` **must** use `dangerouslyDisableSandbox: true` — these open the device over USB (via the node-webusb DMK transport) and are blocked by USB restrictions. `ring encrypt`, `ring decrypt`, `ring destroy`, `agent-intent enroll`, `agent-intent recover`, `agent-intent sync`, `agent-intent send` and `agent-intent swap` (without `--dry-run`), `agent-intent intents`, `agent-intent status`, `agent-intent cancel` never open the device but **also** need the bypass — they're blocked by OS keychain access restrictions instead (`agent-intent enroll`/`recover` also hold a WebSocket to the Trustchain relay). `ring keys` needs neither, and neither does `agent-intent list`/`show`: they only read the local session file, so they run without the bypass.

> **Speculos:** When `SPECULOS_API_PORT` is set, device commands talk to a Speculos emulator over HTTP instead of a USB Ledger (`SPECULOS_DEVICE` names the model). Use it only when the user set it up. Speculos cannot approve on-device prompts, so stick to flows like `account discover`: a prompt to open the app gives up after `--device-timeout` (exit code 6), and an unanswered signing or address verification prompt blocks for about 5 minutes before it exits with code 1 (`GeneralDmkError`); `genuine-check` refuses to run on it. The sandbox lets HTTP to a local Speculos through, but `account discover` still needs `dangerouslyDisableSandbox: true`: it saves the found accounts to `session.yaml` in the user state dir, which the sandbox cannot write. Inside the sandbox the scan still exits 0, but the accounts are not saved (`⚠ Found accounts were NOT saved to the session`).

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
| "enroll this agent", "let an agent propose intents", "set up Agent Intent for a bot" | `agent-intent enroll --profile <id> --name <name> --source <runtime>` (no device; blocks until approved) |
| "recover this agent", "re-enroll an agent into its trustchain"                       | `agent-intent recover --profile <id>` (no device; blocks until approved) |
| "what agents are enrolled", "list agent profiles"                                    | `agent-intent list`                                            |
| "show me that agent profile", "what's the fingerprint for this agent"                | `agent-intent show --profile <id>`                             |
| "pull my synced accounts", "import from Ledger Sync", "sync the agent's accounts"   | `agent-intent sync --profile <id>` (no device)                 |
| "have the agent request a payment", "propose sending X to Y for approval"            | `agent-intent send --profile <id> --account <label> --to <address> --amount '<amount> <ticker>'` (no device, never broadcasts) |
| "have the agent propose a swap", "propose swapping X ETH to USDC for approval"        | `agent-intent swap --profile <id> --account <label> --from ethereum --to <currency id> --amount <amount>` (no device, never broadcasts) |
| "what did the agent propose", "list the agent's intents"                           | `agent-intent intents --profile <id>` (no device; `--status signed,broadcast`, `--cursor` for the next page) |
| "is my intent approved", "what's the status of intent X", "wait until it's signed"  | `agent-intent status --profile <id> --intent <id>` (no device; poll JSON `intent.status` for one state, `terminal` for a final one) |
| "cancel intent X", "withdraw the proposal", "the agent changed its mind"            | `agent-intent cancel --profile <id> --intent <id> --yes` (no device; only before the user signs; irreversible) |
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
| `receive`            | Yes\*  | **Required** | No          | No      |
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
| `ring keys`          | No     | No           | No          | No      |
| `ring destroy`       | No     | **Required** | Required‡‡  | Yes     |
| `agent-intent enroll` | No    | **Required** | No          | Yes     |
| `agent-intent recover` | No   | **Required** | No          | Yes     |
| `agent-intent list`  | No     | No           | No          | No      |
| `agent-intent show`  | No     | No           | No          | No      |
| `agent-intent sync`  | No     | **Required** | No          | Yes     |
| `agent-intent intents` | No   | **Required** | No          | Yes     |
| `agent-intent status` | No    | **Required** | No          | Yes     |
| `agent-intent cancel` | No    | **Required** | No§§        | Yes     |

\*`receive` with `--no-verify`, `send` with `--dry-run`, and `earn deposit`/`earn withdraw` with `--dry-run` need no device and no sandbox bypass.

†TTY: whether the command requires an interactive terminal for user input.

§§`agent-intent cancel` asks for confirmation on a terminal; without one (scripts, AI agents) it needs `--yes`.

‡`ring init` requires a password to protect the ring. `WALLET_PASS` must already be provided in the environment by the developer/user before the command runs — the agent never sets or injects it (see [Non-TTY password injection](#ring--ledger-key-ring-lkrp)).

‡‡`ring destroy` prompts for typed confirmation (`"destroy"`) and, if a password was set, for the password, so hand the human the command to run in their own terminal ([`references/ring.md`](references/ring.md), Destroy).

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

**EVM flags:** `--data <hex>` — raw calldata for contract calls (0x-prefixed hex, even digit count). Use for contract interactions the CLI has no dedicated command for (e.g. WETH wrap/unwrap below). Omit for plain native/token transfers.

#### Contract calls with --data (wrap/unwrap example)

Canonical pattern: WETH wrap/unwrap. `deposit()` (wrap ETH → WETH, no args) is selector `0xd0e30db0`, sent with `--amount` as the ETH value. `withdraw(uint256)` (unwrap WETH → ETH, one `uint256` arg = amount in wei) is selector `0x2e1a7d4d` followed by the amount left-padded to 32 bytes.

```bash
# wrap 0.5 ETH into WETH
pnpm --silent wallet-cli start send ethereum-1 --to <WETH_CONTRACT_ADDRESS> --amount '0.5 ETH' --data 0xd0e30db0

# unwrap 0.5 WETH back to ETH (0.5 ETH = 500000000000000000 wei = 6f05b59d3b20000 hex, padded to 32 bytes)
pnpm --silent wallet-cli start send ethereum-1 --to <WETH_CONTRACT_ADDRESS> --amount '0 ETH' --data 0x2e1a7d4d00000000000000000000000000000000000000000000000006f05b59d3b20000
```

Always run with `--dry-run` first to validate calldata before signing. The CLI cannot verify the semantic correctness of hand-supplied `--data` — the device screen is the last line of defense, so review the decoded call on-device before approving.

### swap quote / execute / status

Read [`references/swap.md`](references/swap.md) before any `swap` command: currency ids, providers and their pipelines, why `swap execute` has no dry run, and the swap errors. To propose a swap for the human's approval instead, use `agent-intent swap` (below).

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

Read [`references/ring.md`](references/ring.md) before any `ring` command: the `WALLET_PASS` injection, init, encrypt and decrypt, rotation, destroy, and the ring errors.

---

## Agent Intent

Read [`references/agent-intent.md`](references/agent-intent.md) and start at its status gate before any `agent-intent` command: enrolling or recovering an agent, its profiles, importing Ledger Sync accounts, proposing a payment or swap for the human's approval, and checking or cancelling a proposal.

---

## earn (staking & DeFi yield)

Read [`references/earn.md`](references/earn.md) before any `earn` command: finding a `--product`, positions and Solana stake accounts, deposit (including the first-time Ethereum vault dry run), the two-phase Solana withdraw, and the earn errors.

---

## Common errors

When a command outside `agent-intent` exits non-zero or prints `[✖]`, read [`references/errors.md`](references/errors.md) before you retry it: each row says whether the retry is yours or the human's.
