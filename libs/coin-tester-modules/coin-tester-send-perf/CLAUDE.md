# Send perf harness — Claude Code terminal

**Repo:** `~/Documents/ledger-live` · **Status Aug 11:** 17/17 green locally, **uncommitted**

## Run

```bash
cd ~/Documents/ledger-live
pnpm --filter @ledgerhq/coin-solana build && pnpm --filter @ledgerhq/coin-evm build
cd libs/coin-tester-modules/coin-tester-send-perf
cp -n .env.example .env
pnpm start && pnpm weighting   # Docker required, ~25s
```

## PR scope (when Oscar approves)

- `libs/coin-tester-modules/coin-tester-send-perf/`
- `libs/coin-tester/src/rejection.ts`, `main.ts`
- `.github/workflows/test-send-perf-harness.yml`
- Root `package.json` + `pnpm-lock.yaml`

## Vault

`02 Working/Tier 1 Send Performance/Send Perf Harness — Critical Roadmap W33.md`
