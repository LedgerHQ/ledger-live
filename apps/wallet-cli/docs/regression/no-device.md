# Regression cases — no device required

Runnable unattended by `scripts/regression/run.sh`; ids match the script output. Nothing
here signs or broadcasts. See [README](./README.md) for prerequisites and flags.

Suite A uses the repo, B and C are hermetic (throwaway cwd, `HOME`, `XDG_STATE_HOME`), and
D uses your real session plus live backends.

## Suite A — repo & artifact gates

`./run.sh --with-gates` (add `--with-build` for A7–A9). Run these first: a stale
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
| A10 | `git status` afterwards | only generated files untracked; nothing else dirty |

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
| B19 | `--dir` on an unwritable path | clean error, non-zero, no partial write |

### doctor

| ID | Case | Expected |
| --- | --- | --- |
| B20 | after a fresh install | `up-to-date`, exit 0 |
| B21 | `--output json` | `results[]` with `status`/`installedVersion`/`installedHash`/`diskHash`/`shippedVersion`/`shippedHash`; `fixed` and `remainingDrift` empty |
| B22 | edit the installed `SKILL.md` | `modified-locally`, "still drifting", hints `--fix --force`, exit 1 |
| B23 | `--fix` on that | still drifting, exit 1, **local edit preserved** |
| B24 | `--fix --force` | "Fixed 1 skill(s)", `up-to-date`, exit 0, edit gone |
| B25 | delete a tracked reference file | drift detected; `--fix --force` restores it |
| B26 | nothing installed | `missing`, "installed none", exit 1 |
| B27 | `--fix` on `missing` | installs it **without** `--force`, exit 0 |
| B28 | simulate an older install (content edited, sidecar rewritten to agree with disk but recording an older `cliVersion`) | `outdated`; plain `--fix` heals it and rewrites the sidecar |
| B29 | remove the sidecar, content untouched | `up-to-date`, "installed none" — legacy/manual installs tolerated |
| B30 | remove the sidecar **and** edit content | `modified-locally`; `--fix` alone must not overwrite |
| B31 | `--dir ./elsewhere` | scans only that dir; the default scan then reports `missing` |
| B32 | `--global` | also scans `$HOME` agent dirs; both roots appear in `results[].root` |
| B33 | a regular file named `ledger-wallet-cli` in `.claude/skills` | reported `missing`, not mistaken for an install |
| B34 | `--global` run from `$HOME` | roots de-duplicated; no skill listed or fixed twice |
| B35 | installed for two agents, then `doctor` | one diagnosis per (root, skill), each with its own `root` |
| B36 | binary copied outside the repo, `skill install --agent claude` | works with no repo and no prior setup |
| B37 | `skill retrieve` vs `.agents/skills/ledger-wallet-cli/SKILL.md` | byte-identical — the shipped skill can't drift from source |

## Suite C — first-run nudge

Each case needs a pristine `XDG_STATE_HOME`; `session view` is the cheapest real command.

| ID | Case | Expected |
| --- | --- | --- |
| C1 | fresh state, `CLAUDECODE=1` | stderr shows `skill install --agent claude` + "Claude Code"; stdout untouched |
| C2 | run again | silent |
| C3 | marker | `$XDG_STATE_HOME/ledger-wallet-cli/first-run.json`, dir `0700`, file `0600`, `version` = CLI version |
| C4 | `--output json` on fresh state | stderr empty, marker **not** written; a later human run still shows the hint |
| C5 | `WALLET_CLI_NO_NUDGE=1` | silent, no marker |
| C6 | no agent env, stderr not a TTY | silent, no marker |
| C7 | `CURSOR_AGENT` → cursor; `CODEX_ENABLED` → codex; `GEMINI_CLI` / `OPENCODE` / `AMP_CURRENT_THREAD_ID` → `agents` | each hint names the right agent and label |
| C8 | `--help`, `--version`, bare invocation | no hint, marker not consumed; next real command shows it |
| C9 | any `skill *` command | no hint, marker not consumed |
| C10 | a failing command on fresh state | hint shown **and** the exit code unchanged |
| C11 | read-only state dir | command succeeds, no crash |
| C12 | corrupt marker file | never crashes (shown once more at worst) |
| C13 | no agent env, real interactive TTY | generic `wallet-cli skill install`, no `--agent` — **needs a terminal, so run by hand** |

## Suite D — commands that need no device

Uses discovered session accounts. `send`/`earn` cases are `--dry-run` only.

### session, balances, operations, assets

| ID | Case | Expected |
| --- | --- | --- |
| D1 | `session view` | labels + descriptors |
| D2 | `session view --output json` | `accounts[].label/descriptor`; no xprv anywhere |
| D3 | unknown label | exit 1, "No account labeled …", points at `account discover` |
| D4 | a raw descriptor as an argument | rejected |
| D5 | `balances <eth>` (human + json) | native + token rows; json rows are `{asset, amount}`, `network: "ethereum:main"` |
| D6 | `balances` for solana and each bitcoin derivation | correct native ticker per family |
| D7 | `operations <eth> --limit 3` (human + json) | typed rows; `nextCursor` when more pages exist |
| D8 | `operations --cursor <cursor>` | page advances — needs an account with >1 page of history |
| D9 | `assets token ethereum 0xdac17f95…` | USDT, id `ethereum/erc20/usd_tether__erc20_`, 6 decimals |
| D10 | `assets token-by-id` with that id | same token |
| D11 | unknown contract | non-zero, "Token not found" |
| D12 | `assets token solana <SPL mint>` | resolved — the mint is the **positional** address |
| D13 | `assets token solana` (no address) | usage message, non-zero, no stack trace |

### earn read paths

| ID | Case | Expected |
| --- | --- | --- |
| D14 | `earn yields` | only CLI-supported networks, narrowed to discovered accounts, `ledgerlive://` deeplinks |
| D15 | `earn yields --all` | account filter bypassed |
| D16 | `earn yields -n solana` | "Deposit targets" with `→ --product <voteAccount>`, Ledger validators surfaced, Net APY |
| D17 | `earn yields -n ethereum` | ERC-4626 vault ids as `--product` (`vaultId` in json) |
| D18 | `earn yields -n solana --limit 3` | limit honoured |
| D19 | `earn positions <sol>` | positions array; `stakes[]` with `→ --stake-account`, `state`, `withdrawable` when stakes exist; `(stale)` markers |
| D20 | `earn positions <sol> --fresh` | accepted, non-blocking; refreshed data appears on a re-run |
| D21 | `earn positions <eth>` | vault positions or empty, valid envelope |
| D22 | deeplink shape | ERC-20 grow rows target the token sub-account id; SOL rows use `earn?action=stake-account` |

### send / earn dry runs

| ID | Case | Expected |
| --- | --- | --- |
| D23 | `send <eth> --to <own addr> --amount '0.0001 ETH' --dry-run` | To/Amount/Fees shown, no `hash:` line |
| D24 | same with a funded ERC-20 ticker | token resolved by ticker, fees in ETH |
| D25 | `--amount '0.0001'` (no ticker) | "Amount must include a ticker" |
| D26 | `--amount '1 UNKN'` | "Ticker … not found in account. Available: …" |
| D27 | amount above balance | `NotEnoughBalance` |
| D28 | invalid recipient, ethereum | `InvalidAddress` |
| D29 | invalid recipient, bitcoin (also with `--fee-per-byte`/`--rbf`) | `InvalidAddress`, flags parse |
| D30 | invalid recipient, solana | `InvalidAddress` |
| D31 | `send <sol> --to <own addr> --memo …` | memo accepted, nothing broadcast |
| D32 | `earn deposit <sol> --product <validator> --amount '0.5 SOL' --dry-run` | validated, no signature |
| D33 | `earn deposit <eth> --product <vaultId> --amount '1 USDC' --dry-run`, first ever deposit | approve validated, deposit `not-simulated` with the documented reason — **not** a balance error |
| D34 | same once an allowance exists | deposit leg simulates |
| D35 | `earn withdraw` missing `--product` / `--stake-account` | clean validation error |
| D36 | `earn withdraw <eth> --product <vaultId> --dry-run`, no `--amount` | full exit (`amount:"max"`) |

D28–D30 are the coverage for address validation going through the `CoinModuleApi` instance:
keep one case per family.

### swap quote / status

| ID | Case | Expected |
| --- | --- | --- |
| D37 | `swap quote` ETH→BTC, sensible amount (human + json) | provider fan-out; rates, or "No quotes available" with a reason per provider |
| D38 | token id as `--from` | accepted |
| D39 | amount below provider minimums | `amount_off_limits` per provider, exit 0, no crash |
| D40 | missing `--to-account` | clean validation error, never `[object Object]` |
| D41 | `--from not-a-currency` | clean error |
| D42 | a session label passed to `--from` | rejected, message points at `--from-account` |
| D43 | `swap status --swap-id <unknown> --provider changelly` | `[?] UNKNOWN <id>`, exit 0 |
| D44 | `swap status` without `--provider` | clean validation error |

### cross-cutting

| ID | Case | Expected |
| --- | --- | --- |
| D45 | `--version` | matches `package.json` |
| D46 | `--help` and `<group> --help` | all groups documented, incl. `skill`, `earn`, `ring` |
| D47 | every `--output json` command piped to `jq` | valid JSON (or NDJSON), never mixed with human text |
| D48 | human mode with stdout piped | progress on stderr, payload on stdout |
| D49 | two no-device commands in parallel | both succeed |
