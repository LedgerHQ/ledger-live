# wallet-cli (`@ledgerhq/wallet-cli`)

Command-line tool for Ledger Wallet flows over **USB**, built on the **Device Management Kit (DMK)** and [Bunli](https://www.npmjs.com/package/bunli). Version **2.1.0**.

## Status (v2)

wallet-cli is the stable CLI for USB-based Ledger Wallet flows. Its scope is intentionally focused: it does not aim for full Ledger Live desktop or mobile feature parity. The `2.0.0` release adds the **`earn`** (staking & DeFi yield) and **`ring`** (Ledger Key Ring / LKRP encryption) command groups. The `2.1.0` release adds the **`skill`** command group, which installs the Ledger wallet-cli agent skill — embedded in the compiled binary — into your coding agent.

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
| `skill list` / `skill retrieve`       | List the agent skills shipped inside the binary, or print one to stdout. **No device** required.                                                                                                                |
| `skill install`                       | Install the embedded agent skill for `--agent` (`claude`, `cursor`, `codex`, or generic `agents` → `.agents/skills`), with `--global` and `--dir` overrides. **No device** required.                             |
| `skill doctor`                        | Detect drift between installed skills and those shipped in the running binary (`up-to-date`, `outdated`, `modified-locally`, `missing`); `--fix` self-heals, `--force` also overwrites local edits.              |

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
pnpm wallet-cli start -- skill install --help
pnpm wallet-cli start -- skill doctor --help
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

## Environment

If `USER_ID` is unset, it defaults to `wallet-cli` so DMK firmware distribution salt stays stable for this CLI (`env-setup.ts`).

## Relation to `ledger-live` CLI

This package is DMK-focused and is separate from `@ledgerhq/live-cli` ([`apps/cli`](../cli)), which is now an internal, Speculos-only tool used by the monorepo's e2e suites and CI. For human/manual hardware-wallet flows, use this `wallet-cli` (or the Ledger Live desktop/mobile app).

## Agent guidance

AI agents should read the [ledger-wallet-cli agent skill](../../.claude/skills/ledger-wallet-cli/SKILL.md) before running wallet-cli commands. It maps informal user requests to commands and documents hardware-wallet safety rules, session labels, USB sandbox requirements, and device-contention constraints.

### First-run nudge

On the first real command, wallet-cli prints a one-time hint to **stderr** pointing at `skill install`. When a known agent is detected (Claude Code, Cursor, Codex, …) the hint is tailored to it (e.g. `wallet-cli skill install --agent claude`); otherwise it shows the generic `wallet-cli skill install`. The nudge:

- shows at most **once per user** — a marker is written under the XDG state dir (`stateDir("ledger-wallet-cli")`, honoring `XDG_STATE_HOME`);
- writes to **stderr only**, so it never pollutes piped stdout, and is **silent under `--output json`**;
- is **not shown for `skill *` commands** (you are already engaging with skills);
- can be disabled entirely with `WALLET_CLI_NO_NUDGE=1`.

It is fully best-effort: it never throws and never changes a command's exit code.

The skill also **ships inside the compiled binary**, so it is available even from an installed npm package with no repo checkout, via the `skill` command group:

```bash
wallet-cli skill list                       # list embedded skills
wallet-cli skill retrieve ledger-wallet-cli # print SKILL.md (or --file references/business-logic.md)
wallet-cli skill install --agent claude     # write into ./.claude/skills (also: cursor, codex, agents)
wallet-cli skill install --dir ./my-skills  # write into an explicit directory
wallet-cli skill doctor                     # check installed skills against this binary
wallet-cli skill doctor --fix               # reinstall outdated / missing skills
```

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
