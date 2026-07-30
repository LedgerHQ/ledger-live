# wallet-cli regression plan

A living regression plan for `@ledgerhq/wallet-cli`. It is kept next to the code so it
evolves with it: **when you add or change a command, add or update its cases here in the
same PR.**

Cases are split by one thing only — whether the command needs a Ledger on USB:

| Where | What | Who runs it |
| --- | --- | --- |
| [`no-device.md`](./no-device.md) | Repo gates, `skill`, the first-run nudge, and every command that reads or dry-runs without a device | `scripts/regression/run.sh`, unattended |
| [`with-device.md`](./with-device.md) | `account discover`, `receive`, `send`, `genuine-check`, `swap execute`, `earn deposit/withdraw`, `ring` | a person, device connected and unlocked |

There is no way to automate the second file: the harness drives the real CLI, so a command
that talks to the device needs the device. wallet-cli has **no Speculos support** — the
transport is USB/DMK only.

Per-release focus lives in [`releases/`](./releases/) — one short file per version listing
what changed and which cases it puts at risk. Start there when planning a campaign.

## What CI already covers (don't re-test by hand)

`pnpm test` (bun, in `apps/wallet-cli`) runs on every PR and already covers a lot that
looks device-shaped, using an in-process mock DMK (`src/test/helpers/cli-runner.ts`, driven
by `WALLET_CLI_MOCK_DMK*`) plus HTTP interception:

- device-state → message → exit-code mapping (`src/device/device-state.test.ts`,
  `classify-device-error.test.ts`, `wallet-cli-device-error.test.ts`);
- `genuine-check`: genuine, locked, timeout, non-genuine, truncated stream;
- `receive`: `--verify` / `--verify=false` / `--no-verify` equivalence;
- `swap execute`: envelope shape, provider validation, currency/chain mismatches, the DIE
  pipeline incl. legacy fallback — and the display-unit conversion of `amountExpectedTo`
  (`src/commands/swap/cli-swap-pipeline.test.ts`);
- `earn deposit/withdraw`: dry-run envelopes, guard errors, the ETH vault approve→deposit
  pipeline and its Kiln app dependency.

That mock is **only reachable in-process from bun tests**, never from the shipped binary,
so it can't be used by the harness. Its value here is negative scope: if a behaviour is
covered there, the device pass only needs one confirmation on real hardware rather than a
matrix. Gaps worth closing as tests rather than as manual steps are listed at the end of
[`with-device.md`](./with-device.md).

## Prerequisites

| Item | Notes |
| --- | --- |
| Build | `pnpm build` in `apps/wallet-cli`, then test `dist/<platform>/cli` — required for anything `skill`-related, since skills are embedded in the binary |
| From source | `pnpm --silent wallet-cli start <cmd>` from the repo root (`run.sh --source`) |
| Device | Unlocked Ledger on USB; Ethereum, Bitcoin, Solana, Exchange and Kiln apps installed; firmware current |
| Funds | A dedicated regression wallet: ETH (gas) + a funded ERC-20, BTC, ≥2 SOL, and a small swap budget |
| Network | Unrestricted egress. Sandboxed shells must be bypassed for USB and OS-keychain commands |
| Tools | `bash`, `jq`, `node`, `timeout` (coreutils) for the harness |
| Isolation | `XDG_STATE_HOME=<tmp>` gives a throwaway session + first-run marker; `HOME=<tmp>` for `--global` cases |

## Running the no-device cases

```bash
cd apps/wallet-cli
pnpm build                        # skill cases must run against the binary
./scripts/regression/run.sh       # skill, nudge and device-free command cases
./scripts/regression/run.sh --suite b            # one area
./scripts/regression/run.sh --with-gates --with-build   # + repo gates, build, pack, npm smoke
./scripts/regression/run.sh --source             # run from source instead of the binary
```

Case ids printed by the script match the tables in [`no-device.md`](./no-device.md). Every
invocation, stdout, stderr and exit code is logged; the path is printed at the end.

The script never signs and never broadcasts. It uses your **real session** for read cases
(so `account discover` must have run at least once) and throwaway state for `skill` and
nudge cases.

## Running the device cases

Read [`with-device.md`](./with-device.md) — it defines the protocol (one command per case,
`--output json` so the exit code and device-state stream are the oracle, and what evidence
to record), then work through the tables. Start the Solana undelegate case on day one: its
`--finalize` step can only run after the deactivation epoch boundary (~2–3 days).

## Priorities

1. **Blocking:** repo gates; `skill` and nudge cases; every `--dry-run` and validation case;
   `genuine-check`; `receive` address verification; one real `send`; one real `swap execute`.
2. **Release quality:** the rest of the no-device tables, remaining `send`/`swap`/`earn`
   device cases, packaging and npm smoke.
3. **Opportunistic:** `ring` edge cases (rotation, ejection), the platform matrix, and the
   multi-day Solana finalize.
