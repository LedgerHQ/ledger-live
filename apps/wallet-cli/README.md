# wallet-cli (`@ledgerhq/wallet-cli`)

Command-line tool for Ledger Wallet flows over USB, built on the Device Management Kit (DMK) and [Bunli](https://www.npmjs.com/package/bunli). It covers a focused set of flows and does not aim for parity with Ledger Wallet desktop or mobile.

Supported networks: **bitcoin**, **ethereum** and **solana**, including their tokens.

## Usage

```bash
wallet-cli account discover ethereum        # needs a Ledger on USB; saves accounts as ethereum-1, ethereum-2…
wallet-cli balances --account ethereum-1    # session label from discover
wallet-cli send --account ethereum-1 --to 0x… --amount "0.01 ETH" --dry-run
wallet-cli <command> --help                 # exact flags and defaults
```

Most commands accept `--output json`. `send`, `earn deposit`, `earn withdraw`, `agent-intent send` and `agent-intent swap` accept `--dry-run`, which validates without signing or submitting and needs no device. On a first deposit into an Ethereum vault, it validates only the `approve` step: the deposit itself can't be simulated until the allowance is on-chain.

## Commands

| Group | Commands | Device |
| --- | --- | --- |
| Accounts | `account discover`, `session view`, `session reset` | discover only |
| Read | `balances`, `operations`, `assets token`, `assets token-by-id` | no |
| Transfer | `receive`, `send` | yes, except `receive --no-verify` and `send --dry-run` |
| Swap | `swap quote`, `swap status`, `swap execute` | execute only |
| Earn | `earn yields`, `earn positions`, `earn deposit`, `earn withdraw` | deposit / withdraw, except with `--dry-run` |
| Device | `genuine-check` | yes |
| Key Ring | `ring init`, `ring encrypt`, `ring decrypt`, `ring keys`, `ring destroy` | init only |
| Agent Intent | `agent-intent enroll`, `recover`, `list`, `show`, `sync`, `send`, `swap`, `intents`, `status`, `cancel` | no |
| Agent skill | `skill list`, `skill retrieve`, `skill install`, `skill doctor` | no |

- **Key Ring** encrypts files or text (AES-256-GCM) under named keys backed by Ledger Key Ring (LKRP). After `ring init`, it needs network access but no device.
- **Agent Intent** gives a remote agent its own software identity. The agent proposes Ethereum and Solana sends and Ethereum swaps, and a human reviews them in the Agent Intent frontend. It needs no device or signer and never broadcasts, and its trust model is separate from `ring`. It stores the agent key in the OS keychain (on Linux, a Secret Service provider such as gnome-keyring); without one, or (on Linux) when it refuses the write, e.g. a locked collection, `agent-intent enroll` fails with `keychain_unavailable`. `--allow-plaintext-key` stores the key in an unencrypted file instead, only after the human explicitly agrees, and is ignored when a keychain is available and accepts the key. A profile enrolled that way needs wallet-cli 2.12.0 or later.

The wallet-cli skill documents each command, the safety rules and the Agent Intent flow in detail. Print it with `wallet-cli skill retrieve wallet-cli-usage`, or read the [source on GitHub](https://github.com/LedgerHQ/ledger-live/blob/develop/.agents/skills/ledger-wallet-cli/SKILL.md).

## Agent skill

AI agents should load the wallet-cli skill before running commands. The skill ships inside the binary as `wallet-cli-usage` (the old name `ledger-wallet-cli` still resolves):

```bash
wallet-cli skill install --agent claude   # also cursor, codex, agents; --global or --dir <path>
wallet-cli skill doctor --fix             # reinstall outdated or missing skills
```

- `skill install` keeps existing files unless you pass `--force`. It writes a `.wallet-cli-skill.json` sidecar with the version and content hash.
- `skill doctor` reports each install as `up-to-date`, `outdated`, `modified-locally` or `missing`, and exits non-zero on drift. `--fix` leaves local edits alone unless you add `--force`.
- On the first command, wallet-cli prints a one-time hint to stderr that suggests `skill install`. The hint is silent with `--output json`. Set `WALLET_CLI_NO_NUDGE=1` to turn it off.

## Prerequisites

- A Ledger on USB for the commands marked in the Device column
- On Linux, the USB/HID libraries: `sudo apt-get install libudev-dev libusb-1.0-0-dev`

## Environment and storage

- `USER_ID` defaults to `wallet-cli`, so the DMK firmware distribution salt stays stable.
- `swap quote`, `swap execute` and `agent-intent swap` authenticate their quote requests to the Ledger API with a dedicated key. The key is stored in the OS keychain as `api-auth-key-<hash>` (service `ledger-wallet-cli`). Without a usable OS keychain (on Linux: no Secret Service), or when the key can't be saved there, quote requests are sent without a token and a warning is printed on stderr; no throwaway key is generated. It is not the Key Ring key, and `session reset` and `ring destroy` do not remove it. If authentication fails or takes more than 10 s (not counting a keychain dialog waiting for the user), the request is sent without a token.
- `LEDGER_AUTH_KEYCLOAK_BASE_URL`, `LEDGER_AUTH_KEYCLOAK_REALM` and `LEDGER_AUTH_CLIENT_ID` override the Keycloak defaults for development. The swap API stays on production.

## Development

Running from source needs [Bun](https://bun.sh) ≥ 1.1.0 and the monorepo (see [repo commands](../../docs/repo-commands.md) for setup):

```bash
pnpm wallet-cli start -- <command> [args]   # from the repo root
pnpm start -- <command> [args]              # from apps/wallet-cli
pnpm test                                   # see src/testing/README.md
pnpm build                                  # scripts/build.mjs: dist/<target>/cli
```

- `pnpm build` compiles your own platform only. With `CI=true`, it compiles every release target, which needs every platform's native optional packages, such as `@napi-rs/keyring`. `prepare:npm`, `pack:check` and `smoke:npm` need that full build.
- The embedded skill is generated from [`.agents/skills/`](../../.agents/skills) into `src/skills/manifest.gen.ts`. The file is gitignored and regenerated before `typecheck`, `test` and `build`. `pnpm check:skills` validates it.
- The binary's copy and the copy published to [LedgerHQ/agent-skills](https://github.com/LedgerHQ/agent-skills) go through one transform, [`scripts/standalone-skill-transform.mjs`](./scripts/standalone-skill-transform.mjs). Don't add a second copy of its rules.

`@ledgerhq/live-cli` ([`apps/cli`](../cli)) is a separate tool. It is internal and Speculos-only, and is used by e2e suites and CI.

### Adding a command

Top-level commands are listed in [`src/commands/registry.ts`](src/commands/registry.ts) with their name, description, subcommand names and a loader. `src/cli.ts` loads only the modules of the commands named on the command line. Root help, unknown-command suggestions and analytics read the registry. A command module takes its description from the registry with `commandDescription("<name>")`, and `registry.test.ts` fails when a command module is missing from the registry or its subcommands no longer match.
