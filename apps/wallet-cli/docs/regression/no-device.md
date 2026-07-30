# Regression cases — no device required

Runnable unattended by `scripts/regression/run.ts`. Every numbered id below is one the script
prints, in the order it prints it; each suite ends with a **not yet automated** table of cases
that still need a person. Nothing here signs or broadcasts. See [README](./README.md) for
prerequisites and flags.

Suite A uses the repo, B and C are hermetic (throwaway cwd, home and state dir), and D uses
a real session plus live backends.

## Suite A — repo & artifact gates

`run.ts --with-gates` (add `--with-build` for A7–A9). Run these first: a stale
`src/skills/manifest.gen.ts` invalidates every Suite B result.

| ID | Command (in `apps/wallet-cli`) | Expected |
| --- | --- | --- |
| A1 | `pnpm test` | green |
| A2 | `pnpm typecheck` | clean |
| A3 | `pnpm lint:ci` | clean |
| A4 | `pnpm format:check` | clean (separate CI gate from lint) |
| A5 | `pnpm check:skills` | every shipped skill found in `.agents/skills/` |
| A6 | `pnpm check:notices` | `THIRD_PARTY_NOTICES.md` in sync |
| A7 | `pnpm build` | binaries for all four platforms in `dist/` |
| A8 | `pnpm pack:check` | tarball layout (bin/, LICENSE, notices, README, CHANGELOG) |
| A9 | `pnpm smoke:npm` | packs + installs into a temp dir, runs `wallet-cli --version` |

### not yet automated

| Case | Expected |
| --- | --- |
| `git status` after a run | only generated files untracked; nothing else dirty |

## Suite B — `skill` command group

Run against the **binary**: the point of the feature is that skills ship inside it.

### list / retrieve

| ID | Case | Expected |
| --- | --- | --- |
| B1 | `skill list` | names `ledger-wallet-cli` |
| B2 | `skill list --output json` | `status:success`, `command:"skill list"`, `skills[].name/description` |
| B3 | `skill retrieve` | prints `SKILL.md` |
| B4 | `skill retrieve --file references/business-logic.md` | prints the reference doc |
| B5 | `skill retrieve --file no-such.md` | exit 1, lists available files |

### install

| ID | Case | Expected |
| --- | --- | --- |
| B6 | `skill install --agent claude` in an empty dir | `SKILL.md`, `references/business-logic.md`, `.wallet-cli-skill.json` |
| B7 | sidecar contents | `name`, `cliVersion` = binary version, 64-hex `contentHash` matching the files on disk, per-file `files{}`, ISO `installedAt` |
| B8 | install again, no `--force` | exit 1, "Refusing to overwrite", files untouched |
| B9 | `--force` | exit 0, `installedAt` refreshed |
| B10 | delete both skill files, keep the sidecar, install without `--force` | succeeds (sidecar excluded from the clash check) |
| B11 | `--agent cursor` / `codex` / `agents` | `.cursor/skills`, `.codex/skills`, `.agents/skills` |
| B12 | bare `skill install` | defaults to `.claude/skills` |
| B13 | `--dir ./custom` | writes there; no `.claude/` created |
| B14 | `--global` | installs under `$HOME`, not cwd |
| B15 | `--all` | every embedded skill installed |
| B16 | `install --output json` | `cliVersion`, `root`, `skills[]`, `contentHashes{}`, `installed[]` |
| B17 | `--agent bogus` (human + json) | exit 1, lists `claude, cursor, codex, agents`, suggests `--dir`; json → `{ok:false,error:{command,message}}` |
| B18 | unknown skill name | exit 1, "not found", points at `skill list` |

### doctor

| ID | Case | Expected |
| --- | --- | --- |
| B19 | after a fresh install | `up-to-date`, exit 0 |
| B20 | `--output json` | `results[]` with `status`/`installedVersion`/`installedHash`/`diskHash`/`shippedVersion`/`shippedHash`; `fixed` and `remainingDrift` empty |
| B21 | edit the installed `SKILL.md` | `modified-locally`, "still drifting", hints `--fix --force`, exit 1 |
| B22 | `--fix` on that | still drifting, exit 1, **local edit preserved** |
| B23 | `--fix --force` | "Fixed 1 skill(s)", `up-to-date`, exit 0, edit gone |
| B24 | delete a tracked reference file | drift detected; `--fix --force` restores it |
| B25 | nothing installed | `missing`, "installed none", exit 1 |
| B26 | `--fix` on `missing` | installs it **without** `--force`, exit 0 |
| B27 | simulate an older install (content edited, sidecar rewritten to agree with disk but recording an older `cliVersion`) | `outdated`; plain `--fix` heals it and rewrites the sidecar |
| B28 | remove the sidecar, content untouched | `up-to-date`, "installed none" — legacy/manual installs tolerated |
| B29 | remove the sidecar **and** edit content | `modified-locally`; `--fix` alone must not overwrite |
| B30 | `--dir ./elsewhere` | scans only that dir; the default scan then reports `missing` |
| B31 | `--global` | also scans `$HOME` agent dirs; both roots appear in `results[].root` |
| B32 | a regular file named `ledger-wallet-cli` in `.claude/skills` | reported `missing`, not mistaken for an install |

### not yet automated

| Case | Expected |
| --- | --- |
| `--dir` on an unwritable path | clean error, non-zero, no partial write |
| `--global` run from `$HOME` | roots de-duplicated; no skill listed or fixed twice |
| installed for two agents, then `doctor` | one diagnosis per (root, skill), each with its own `root` |
| binary copied outside the repo, `skill install --agent claude` | works with no repo and no prior setup |
| `skill retrieve` vs `.agents/skills/ledger-wallet-cli/SKILL.md` | byte-identical — the shipped skill can't drift from source |

## Suite C — first-run nudge

Each case needs a pristine state dir; `session view` is the cheapest real command. C3 and C11
assert POSIX file modes and are skipped on Windows and as root. C8 runs once per non-command
invocation, so it prints two ids.

| ID | Case | Expected |
| --- | --- | --- |
| C1 | fresh state, `CLAUDECODE=1` | stderr shows `skill install --agent claude` + "Claude Code"; stdout untouched |
| C2 | run again | silent |
| C3 | marker | `first-run.json` under the state dir, dir `0700`, file `0600`, `version` = CLI version |
| C4 | `--output json` on fresh state | stderr empty, marker **not** written; a later human run still shows the hint |
| C5 | `WALLET_CLI_NO_NUDGE=1` | silent, no marker |
| C6 | no agent env, stderr not a TTY | silent, no marker |
| C7 | `CURSOR_AGENT` → cursor; `CODEX_ENABLED` → codex; `GEMINI_CLI` / `OPENCODE` / `AMP_CURRENT_THREAD_ID` → `agents` | each hint names the right agent and label |
| C8help | `--help` | no hint, marker not consumed; next real command shows it |
| C8version | `--version` | no hint, marker not consumed; next real command shows it |
| C9 | any `skill *` command | no hint, marker not consumed |
| C10 | a failing command on fresh state | hint shown **and** the exit code unchanged |
| C11 | read-only state dir | command succeeds, no crash |

### not yet automated

| Case | Expected |
| --- | --- |
| bare invocation (no args) on fresh state | no hint, marker not consumed |
| corrupt marker file | never crashes (shown once more at worst) |
| no agent env, real interactive TTY | generic `wallet-cli skill install`, no `--agent` — needs a terminal |

## Suite D — commands that need no device

Uses discovered session accounts. `send`/`earn` cases are `--dry-run` only. Account lookup is
mainnet-only (`ethereum-<n>`, `solana-<n>`, `bitcoin-<derivation>-<n>`), so a session holding
only testnet accounts skips the cases that need them rather than asserting mainnet
expectations against testnet.

### session, balances, operations, assets

| ID | Case | Expected |
| --- | --- | --- |
| D1 | `session view` | labels + descriptors |
| D2 | `session view --output json` | `accounts[].label/descriptor`; no xprv anywhere |
| D3 | `balances <eth>` | native + token rows, `ETH` present |
| D4 | `balances <eth> --output json` | `{asset, amount}` rows, `network:"ethereum:main"`, exactly one native ETH row |
| D5 | `balances <sol> --output json` | exactly one SOL-denominated row |
| D6 | `balances <btc> --output json` | exactly one BTC-denominated row |
| D7 | unknown label | exit 1, "No account labeled …", points at `account discover` |
| D8 | a raw descriptor as an argument | rejected |
| D9 | `operations <eth> --limit 3` | rows printed |
| D10 | `operations <eth> --limit 3 --output json` | `command:"operations"`, `operations` is an array |
| D11 | `operations --cursor <cursor>` | page advances — skipped unless a session account has >1 page of history |
| D12 | `assets token ethereum 0xdac17f95…` | USDT, id `ethereum/erc20/usd_tether__erc20_` |
| D13 | `assets token-by-id` with that id | same token (`ticker:"USDT"` in the envelope) |
| D14 | unknown contract | non-zero, "not found" |
| D15 | `assets token solana <SPL mint>` | resolved — the mint is the **positional** address |
| D15b | `assets token solana` (no address) | `Usage: assets token <network> <address>`, non-zero, no stack trace |

### earn read paths

| ID | Case | Expected |
| --- | --- | --- |
| D16 | `earn yields` | supported networks with `ledgerlive://` deeplinks |
| D17 | `earn yields -n solana` | "Deposit targets" with `--product`, Ledger validators surfaced |
| D18 | `earn yields -n ethereum --output json` | ERC-4626 vault ids as `--product` (`vaultId` in json) |
| D19 | `earn yields -n solana --limit 3`, then `earn yields --all` | both accepted |
| D20 | `earn positions <sol> --output json` | `command:"earn positions"`, `positions` is an array |
| D21 | `earn positions <sol> --fresh` | accepted, non-blocking |
| D22 | `earn positions <eth> --output json` | vault positions or empty, valid envelope |

### send / earn dry runs

| ID | Case | Expected |
| --- | --- | --- |
| D23 | `send <eth> --to <own addr> --amount '0.0001 ETH' --dry-run` | amount + Fees shown, no `hash:` line |
| D24 | same with a funded ERC-20 ticker | token resolved by ticker |
| D25 | `--amount '0.0001'` (no ticker) | "must include a ticker" |
| D26 | `--amount '1 UNKN'` | "not found in account. Available: …" |
| D27 | amount above balance | `NotEnoughBalance` |
| D28 | invalid recipient, ethereum | `InvalidAddress` |
| D29 | invalid recipient, bitcoin (also with `--fee-per-byte`/`--rbf`) | `InvalidAddress`, flags parse |
| D30 | invalid recipient, solana, then `send <sol> --to <own addr> --memo …` | `InvalidAddress`; memo accepted, nothing broadcast |
| D31 | `earn deposit <sol> --product <validator> --amount '0.5 SOL' --dry-run` | validated, no signature, nothing broadcast |
| D32 | `earn deposit <eth> --product <vaultId> --amount '1 USDC' --dry-run` | flags parse, nothing broadcast |
| D33 | `earn withdraw <eth> --dry-run` with no target | non-zero validation error |

D28–D30 are the coverage for address validation going through the `CoinModuleApi` instance:
keep one case per family.

### swap quote / status

| ID | Case | Expected |
| --- | --- | --- |
| D34 | `swap quote` ETH→BTC, sensible amount | provider fan-out; rates, or "No quotes available" |
| D35 | the same quote `--output json` | `command:"swap quote"` |
| D36 | token id as `--from` | accepted |
| D37 | missing `--to-account` | clean validation error, never `[object Object]` |
| D38 | `--from not-a-currency` | clean error, never `[object Object]` |
| D39 | `swap status --swap-id <unknown> --provider changelly` | `UNKNOWN`, exit 0, never `[object Object]` |
| D39b | `swap status` without `--provider` | clean validation error |

### cross-cutting

| ID | Case | Expected |
| --- | --- | --- |
| D40 | `--version`, then `--help` | version matches `package.json`; `--help` lists every command group, incl. `skill`, `earn`, `ring` |

### not yet automated

| Area | Case | Expected |
| --- | --- | --- |
| earn | deeplink shape | ERC-20 grow rows target the token sub-account id; SOL rows use `earn?action=stake-account` |
| earn | `earn positions <sol>` detail | `stakes[]` with `→ --stake-account`, `state`, `withdrawable`; `(stale)` markers |
| earn | `earn deposit <eth>` first ever deposit, then once an allowance exists | approve validated, deposit `not-simulated` with the documented reason; the deposit leg simulates on the second run |
| earn | `earn withdraw <eth> --product <vaultId> --dry-run`, no `--amount` | full exit (`amount:"max"`) |
| swap | amount below provider minimums | `amount_off_limits` per provider, exit 0, no crash |
| swap | a session label passed to `--from` | rejected, message points at `--from-account` |
| help | `<group> --help` for each group | every group documents its own sub-commands |
| streams | every `--output json` command piped to `jq` | valid JSON (or NDJSON), never mixed with human text |
| streams | human mode with stdout piped | progress on stderr, payload on stdout |
| concurrency | two no-device commands in parallel | both succeed |
