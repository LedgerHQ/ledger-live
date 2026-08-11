# Send Performance Reproduction Harness

## Problem

Tier 1 send failures (BTC, ETH, SOL) are diagnosed from production logs after the fact. When a user hits `broadcast_failure`, teams debate whether the root cause is:

- the **node** rejecting a bad transaction,
- the **app** misclassifying a simulation error, or
- **infra** (RPC, timing, stale state).

Guillaume's BTC reproduction study proved you can inject controlled chain state and assert literal reject strings. That method was not codified, not extended to ETH/SOL, and not wired to Ledger Live's broadcast path.

The MS team SOL report (Aug 2026, ~1,107 logs / 15d) sharpened this: **406 simulation failures** were logged as `broadcast_failure` when many are app-side classification issues, not backend outages.

## What this tool does

A **three-layer regression harness** in `ledger-live` that answers different questions:

| Layer | Question | How |
|---|---|---|
| **L1** | Does the node return the expected reject string? | Docker chain (Anvil / Agave / regtest bitcoind), inject bad state, broadcast signed tx |
| **L2** | Does the coin module map the reject to the right error class? | Same txs through `coin-evm` or `coin-solana` `broadcastWithAPI` |
| **L3** | Do our scenarios cover production error patterns? | Offline weighting report vs `Errors/*.md` and cycle data |

**What it is not:** paste a Datadog log, get automatic root cause. Root cause is inferred from **which layer fails**:

- L1 fails, L2 not run → node/state issue (or bad fixture)
- L1 passes, L2 fails → app bridge mapping bug
- L1 + L2 pass in harness, prod still fails → infra, telemetry, or untested parameter

## How we do it

```
Production error catalog (Errors/*.md, Datadog, MS reports)
        │
        ▼
  Fixture metadata (fixtures/<chain>/index.json)
        │
        ▼
  Scenario builder (src/scenarios/<chain>/)
        │
   ┌────┴────┐
   ▼         ▼
  L1         L2
  raw RPC    coin module broadcast
   │         │
   └────┬────┘
        ▼
  Jest assert: reject string + optional error class
        │
        ▼
  Layer 3 weighting: gaps vs production catalog
```

### Example: MS report `SolanaTxSimulationFailedWhilePendingOp`

1. **L1** (`sol-insufficient-funds-for-rent`): Agave returns `simulation failed` / insufficient lamports on empty payer.
2. **L2a** (`sol-simulation-failed-while-pending-op`): same tx through `broadcastWithAPI` with `pendingOperations.length > 0` → expect `SolanaTxSimulationFailedWhilePendingOp`.
3. **L2b** (`sol-simulation-failed-no-pending-op`): same tx, no pending ops → expect raw `simulation failed`, **not** the pending-op class.

L2a + L2b together prove the app **classifies** simulation errors differently based on account state. That is exactly the MS report's taxonomy question.

## Coverage today

| Chain | L1 | L2 |
|---|---|---|
| ETH | 5 scenarios | 2 (nonce too low, insufficient funds) |
| SOL | 3 scenarios | 2 (simulation + pending op discrimination) |
| BTC | 3 scenarios (regtest, no Guillaume fixtures) | not yet (Atlas path needs JC) |

Run: `pnpm start` in `coin-tester-send-perf` (~15s, Docker required).

## Presenting to stakeholders

**One-liner:** Controlled reproduction of send rejection paths, from node verdict through Ledger Live error mapping, weighted against production.

**For MS / platform:** L2 scenarios directly test whether simulation failures are classified correctly vs logged as generic broadcast failures.

**For Pablo / PI 26.6:** Extends Guillaume's method into CI-ready scaffolding; Guillaume's 1000-scenario corpus is optional enrichment.

**For QA:** Repeatable local + CI runs; add a scenario when a new production error class appears in `/send-perf-cycle`.

## Next builds

1. SOL L2: pre-broadcast path (LIVE-32551 simulation before broadcast)
2. BTC L2: Atlas `atlas-btc-mainnet-pending` (JC confirmation)
3. Parameter matrix runner (fee, timing, pending op count)
4. Commit + PR so CI repeats ETH/SOL on schedule

## Related

- Vault: `02 Working/Tier 1 Send Performance/Comms/2026-08-07 MS SOL report vs harness crosswalk.md`
- Package README: [README.md](./README.md)
