# wallet-cli (`@ledgerhq/wallet-cli`)

Command-line tool for Ledger Wallet flows over **USB**, built on the **Device Management Kit (DMK)** and [Bunli](https://www.npmjs.com/package/bunli). Version **2.0.1**.

## Status (v2)

wallet-cli is the stable CLI for USB-based Ledger Wallet flows. Its scope is intentionally focused: it does not aim for full Ledger Live desktop or mobile feature parity. The `2.0.0` release adds the **`earn`** (staking & DeFi yield) and **`ring`** (Ledger Key Ring / LKRP encryption) command groups.

**Supported networks** today: **bitcoin**, **ethereum**, and **solana** (aligned with `live-common-setup.ts`). Token flows are supported for tokens on those networks.

### Commands

| Command                               | Role                                                                                                                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `account discover`                    | Discover accounts for a network on the **connected Ledger** (USB). Each discovered account is saved to the session under a **label** (e.g. `ethereum-1`).                                                       |
| `session view` / `session reset`      | List or wipe accounts stored in the session.                                                                                                                                                                    |
| `balances`                            | Fetch **native and token balances** for an account (by session label). **No device** required.                                                                                                                  |
| `operations`                          | **List operations** for an account (by session label). **No device** required. Optional pagination via `--limit` and `--cursor`.                                                                                |
| `send`                                | Sign and broadcast a transaction. Requires `--amount` with ticker (e.g. `0.001 BTC`, `0.01 ETH`). Use `--dry-run` to validate without signing.                                                                  |
| `receive`                             | Get the receive address for an account (optionally verify on device).                                                                                                                                           |
| `swap quote`                          | Fetch swap quotes for supported currencies and tokens.                                                                                                                                                          |
| `swap execute`                        | Execute the full swap flow with `--from`, `--to`, `--provider`, and `--amount`: prepare the swap, interact with the connected device as needed, complete the exchange, then sign and broadcast the transaction. |
| `swap status`                         | Read the current swap status from the partner API.                                                                                                                                                              |
| `assets token` / `assets token-by-id` | Resolve token metadata by contract address or token id.                                                                                                                                                         |
| `genuine-check`                       | Check whether the connected Ledger device is genuine.                                                                                                                                                           |
| `earn yields` / `earn positions`      | List yield opportunities (per-network deposit targets with `-n ethereum`/`-n solana`) and active staking/vault positions for an account. **No device** required.                                                |
| `earn deposit` / `earn withdraw`      | Stake / deposit into a vault, or unstake / redeem. Ethereum ERC-4626 vaults and Solana native staking. Signs on the **device**; `--dry-run` validates without signing.                                          |
| `ring init`                           | One-time provisioning of your Ledger Key Ring (LKRP) via the device. Prompts for a password unless `--unsecure-no-password`.                                                                                     |
| `ring encrypt` / `ring decrypt`       | AES-256-GCM encrypt/decrypt of files (`-i`/`-o`) or text (stdin/stdout) under a named key (`--key`). **No device** after `init`; requires network to restore the trustchain.                                     |
| `ring keys` / `ring destroy`          | List the keys this machine has used, or tear down the ring (local credentials + remote LKRP application).                                                                                                        |

Typical flow: run `account discover` with a currency id (e.g. `bitcoin`, `ethereum`), then pass the assigned **session label** (e.g. `--account ethereum-1`) to `balances`, `operations`, `send`, or `receive`. Use `session view` to see what's saved.

For exact flags and defaults (from repo root):

```bash
pnpm wallet-cli start -- --help
pnpm wallet-cli start -- account discover --help
pnpm wallet-cli start -- balances --help
pnpm wallet-cli start -- operations --help
pnpm wallet-cli start -- send --help
pnpm wallet-cli start -- receive --help
pnpm wallet-cli start -- assets token --help
pnpm wallet-cli start -- genuine-check --help
pnpm wallet-cli start -- swap quote --help
pnpm wallet-cli start -- swap execute --help
pnpm wallet-cli start -- swap status --help
pnpm wallet-cli start -- earn yields --help
pnpm wallet-cli start -- earn positions --help
pnpm wallet-cli start -- earn deposit --help
pnpm wallet-cli start -- earn withdraw --help
pnpm wallet-cli start -- ring init --help
pnpm wallet-cli start -- ring encrypt --help
pnpm wallet-cli start -- ring decrypt --help
```

From `apps/wallet-cli`, use `pnpm start` in place of `pnpm wallet-cli start` (same args after `--`).

Most commands support `--output human` (default) or `--output json`.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.1.0 (`engines` in `package.json`)
- **pnpm** and this monorepo checked out; install dependencies per [repo commands](../../docs/repo-commands.md) (e.g. `mise install`, `pnpm i`)
- A **Ledger** on USB when using `account discover`, `send`, `swap execute`, `receive --verify`, `earn deposit`/`earn withdraw`, `genuine-check`, or `ring init`
- **Linux:** USB/HID build deps, for example:

  ```bash
  sudo apt-get update && sudo apt-get install libudev-dev libusb-1.0-0-dev
  ```

## Setup and run

From an installed package:

```bash
wallet-cli <command> [args]
```

From the **repository root** (after `pnpm i`):

```bash
pnpm wallet-cli start -- <command> [args]
```

From **this package** (`apps/wallet-cli`):

```bash
pnpm start -- <command> [args]
```

`pnpm start` runs `bun run ./src/cli.ts`. Standalone builds under `dist/` rely on `init-cwd.ts` so Bunli config and native bindings resolve correctly; prefer the package scripts when developing from source.

## Build (optional)

- In `apps/wallet-cli`: `pnpm build` (Bunli native bundle → `dist/`)
- From repo root: `pnpm build:wallet-cli`

## MCP server

`wallet-cli mcp` starts a **stdio [Model Context Protocol](https://modelcontextprotocol.io) server** that exposes every wallet-cli operation as a typed MCP tool. MCP-capable agents (Claude Code, Claude Desktop, Cursor, Codex, …) call the tools directly instead of shelling out to the CLI, and receive the same structured payloads as `--output json`. The server speaks JSON-RPC over **stdout only** (logs go to stderr) and is normally launched by the MCP client, not by hand.

Start it (from an installed binary, or from the repo for dev):

```bash
wallet-cli mcp                        # installed binary
pnpm wallet-cli start -- mcp          # from the repository root
```

### Per-agent config

`wallet-cli mcp --install --agent <claude|cursor|codex>` writes the matching config for you (use `--print-config` to print it instead). The equivalent snippets:

**Claude Code**

```bash
claude mcp add ledger -- wallet-cli mcp
```

**Claude Desktop / Cursor** (`.cursor/mcp.json`, or Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ledger": {
      "command": "wallet-cli",
      "args": ["mcp"]
    }
  }
}
```

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.ledger]
command = "wallet-cli"
args = ["mcp"]
```

### Tools

Each tool mirrors the CLI command of the same name and returns the identical envelope as `--output json`. `<account>` arguments are session labels (e.g. `ethereum-1`).

| Tool                 | CLI equivalent       | Device  | Notes                                                       |
| -------------------- | -------------------- | ------- | ---------------------------------------------------------- |
| `account_discover`   | `account discover`   | Yes     | Discover/import accounts for a network onto the session.   |
| `session_view`       | `session view`       | No      | List saved session accounts.                              |
| `session_reset`      | `session reset`      | No      | Wipe the session.                                         |
| `balances`           | `balances`           | No      | Native + token balances.                                  |
| `operations`         | `operations`         | No      | Operation history (paginate with `limit`/`cursor`).        |
| `receive`            | `receive`            | Yes\*   | \*Device only when verifying the address on screen.        |
| `send`               | `send`               | Yes\*\* | \*\*Device only for a real send; dry-run needs no device.  |
| `swap_quote`         | `swap quote`         | No      | Quotes from the built-in provider list.                    |
| `swap_execute`       | `swap execute`       | Yes     | Full swap flow, then sign + broadcast.                    |
| `swap_status`        | `swap status`        | No      | Read swap status from the partner API.                    |
| `genuine_check`      | `genuine-check`      | Yes     | Verify the connected device is genuine.                   |
| `assets_token`       | `assets token`       | No      | Resolve token metadata by contract address.               |
| `assets_token_by_id` | `assets token-by-id` | No      | Resolve token metadata by token id.                       |

Device-touching tools emit MCP **progress notifications** mapped from the device state (awaiting unlock, awaiting on-device approval, …).

### Safety

The same hardware-wallet rails apply whether a flow runs via the CLI or an MCP tool (see [`ledger-wallet-cli` skills](#agent-guidance) and their `references/safety.md`):

- **USB required.** Device tools drive a physical Ledger over USB — it must be connected and unlocked. There is no remote/network signing.
- **Serialized, never parallel.** The server holds a single device lock, so only one device-touching tool runs at a time; the USB HID channel does not multiplex and concurrent calls would corrupt each other's APDU exchange.
- **On-device confirmation is the source of truth.** The user must verify address/amount/recipient/fees on the Ledger screen; treat any mismatch as a possible compromise.
- **Errors preserve the CLI taxonomy.** A failing device tool returns a structured MCP error with the same `code` and `exitCode` as the equivalent CLI command.

Agents should read the `ledger-wallet-cli-mcp` skill (methodology + tool list) before using the MCP tools — see [Agent guidance](#agent-guidance).

## Environment

If `USER_ID` is unset, it defaults to `wallet-cli` so DMK firmware distribution salt stays stable for this CLI (`env-setup.ts`).

## Relation to `ledger-live` CLI

This package is DMK-focused and is separate from `@ledgerhq/live-cli` ([`apps/cli`](../cli)), which is now an internal, Speculos-only tool used by the monorepo's e2e suites and CI. For human/manual hardware-wallet flows, use this `wallet-cli` (or the Ledger Live desktop/mobile app).

## Agent guidance

AI agents should read the wallet-cli agent skills before running wallet-cli commands. The skill set is split into a thin **umbrella** skill plus five **task** skills, each self-contained for its flow:

- [`ledger-wallet-cli`](../../.agents/skills/ledger-wallet-cli/SKILL.md) — entry/router skill: the informal-request → command intent map and the supporting commands that fit no single task (`session view/reset`, `balances`, `operations`, `assets token/token-by-id`). It points to the task skills and to [`references/business-logic.md`](../../.agents/skills/ledger-wallet-cli/references/business-logic.md).
- [`ledger-wallet-cli-account-discover`](../../.agents/skills/ledger-wallet-cli-account-discover/SKILL.md) — discover/import accounts for a network.
- [`ledger-wallet-cli-receive`](../../.agents/skills/ledger-wallet-cli-receive/SKILL.md) — get and verify a receive address.
- [`ledger-wallet-cli-send`](../../.agents/skills/ledger-wallet-cli-send/SKILL.md) — sign and broadcast a transfer.
- [`ledger-wallet-cli-swap`](../../.agents/skills/ledger-wallet-cli-swap/SKILL.md) — quote → execute → status a swap.
- [`ledger-wallet-cli-genuine-check`](../../.agents/skills/ledger-wallet-cli-genuine-check/SKILL.md) — verify a device is genuine.
- [`ledger-wallet-cli-mcp`](../../.agents/skills/ledger-wallet-cli-mcp/SKILL.md) — run wallet-cli as an [MCP server](#mcp-server) and call the flows as typed MCP tools (setup snippets + tool list).

The cross-cutting hardware-wallet safety rails (USB sandbox requirement, device contention, on-device confirmation, ambiguous→ask, out-of-scope, shared error table) live in a single canonical [`references/safety.md`](../../.agents/skills/ledger-wallet-cli/references/safety.md). Each task skill's `references/safety.md` is a **relative symlink** to that file, so there is one edit point and zero drift; the embed codegen resolves the symlink so every skill ships an identical copy, and a `skill install` materializes a real per-skill copy on disk.

### First-run nudge

On the first real command, wallet-cli prints a one-time hint to **stderr** pointing at `skill install --all` (there is no longer a single skill). When a known agent is detected (Claude Code, Cursor, Codex, …) the hint is tailored to it (e.g. `wallet-cli skill install --all --agent claude`); otherwise it shows the generic `wallet-cli skill install --all`. The nudge:

- shows at most **once per user** — a marker is written under the XDG state dir (`stateDir("ledger-wallet-cli")`, honoring `XDG_STATE_HOME`);
- writes to **stderr only**, so it never pollutes piped stdout, and is **silent under `--output json`**;
- is **not shown for `skill *` commands** (you are already engaging with skills);
- can be disabled entirely with `WALLET_CLI_NO_NUDGE=1`.

It is fully best-effort: it never throws and never changes a command's exit code.

The skills also **ship inside the compiled binary**, so they are available even from an installed npm package with no repo checkout, via the `skill` command group:

```bash
wallet-cli skill list                            # list embedded skills
wallet-cli skill retrieve ledger-wallet-cli      # print a skill's SKILL.md (name is required)
wallet-cli skill retrieve ledger-wallet-cli-send --file references/safety.md  # print a reference file
wallet-cli skill install --all --agent claude    # write every skill into ./.claude/skills (also: cursor, codex, agents)
wallet-cli skill install ledger-wallet-cli-send --dir ./my-skills  # install one skill into an explicit directory
wallet-cli skill doctor                          # check installed skills against this binary
wallet-cli skill doctor --fix                    # reinstall outdated / missing skills
```

`skill retrieve` and `skill install` **require an explicit skill name** — with no name (and, for install, no `--all`) they error and list the available skills with a `skill list` hint. Use `skill install --all` to install the umbrella and all task skills at once.

`skill install` maps `--agent` (`claude`, `cursor`, `codex`, `agents`) to the matching `.<agent>/skills` directory (`agents` → `.agents/skills`) under the current working directory, or the user home directory with `--global`. `--dir` overrides both. Existing files are preserved unless `--force` is passed.

On install, a small provenance sidecar `.wallet-cli-skill.json` is written next to each skill. It records the wallet-cli version and a content hash at install time (it never touches the human-readable `SKILL.md`, and is always refreshed — even under `--force`). This version-locks installed skills to the wallet-cli that wrote them so drift can be detected later.

`skill doctor` scans for installed skills and classifies each one against the skills shipped in the running binary:

- **up-to-date** — on disk matches what this wallet-cli ships. (Also covers installs with no/unreadable provenance sidecar whose files still match the shipped content — e.g. legacy or manually copied installs.)
- **outdated** — installed by an older wallet-cli; the shipped content is newer.
- **modified-locally** — the on-disk files no longer match their provenance sidecar (edited after install), or an install with no/unreadable sidecar whose files don't match what this wallet-cli ships (without provenance we can't tell an old version from local edits, so it's treated conservatively).
- **missing** — a shipped skill is not present in any scanned location.

By default `doctor` scans the agent skill directories under the current working directory. Use `--global` to also scan the user home directory, or `--dir <path>` to scan an explicit directory. It exits non-zero when any drift remains.

`--fix` self-heals conservatively: it reinstalls `outdated` and `missing` skills, but leaves `modified-locally` skills untouched unless you also pass `--force` (`skill doctor --fix --force`), which overwrites local edits.

The embedded content is generated from the canonical `.agents/skills/` directory (`.claude/skills` is just a symlink to it) into `src/skills/manifest.gen.ts` by `pnpm generate:skills`. That file is **generated, not committed** (gitignored like `.bunli/commands.gen.ts`) and is regenerated automatically before `typecheck`, `test`, and `build` via the `pretypecheck` / `pretest` / `prebuild` npm hooks. `pnpm check:skills` validates that generation succeeds (every shipped skill is found in the sources).
