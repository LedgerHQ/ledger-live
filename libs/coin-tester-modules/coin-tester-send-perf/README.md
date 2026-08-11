# Send Performance Reproduction Harness

Controlled node rejections for Tier 1 send performance regression testing. Replicates the Guillaume BTC reproduction **method** (inject chain state, broadcast signed tx, assert literal reject string), extended to ETH and SOL.

## Architecture

| Layer | Proves | Device? | CI default |
|---|---|---|---|
| L1 | Node returns expected reject string | No | ETH yes, SOL manual |
| L2 | Bridge broadcast path maps reject correctly | No | ETH (2); SOL (2) |
| L3 | Scenario set covers production errors | No | Offline report |

BTC Layer 1 runs on local regtest bitcoind without Guillaume fixtures. Guillaume's corpus is optional enrichment. See [BLOCKERS.md](./BLOCKERS.md).

## Repeat tests (local)

**Prerequisites:** Docker running, repo at `ledger-live` root with `pnpm install` done.

```bash
cd libs/coin-tester-modules/coin-tester-send-perf
cp .env.example .env   # first time only

pnpm start:eth         # ETH L1 + L2 (~6s, Anvil)
pnpm start:sol         # SOL L1 (~5s, Agave)
pnpm start:btc         # BTC L1 (~5s, regtest bitcoind)
pnpm start             # all 15 tests (~14s)
pnpm weighting         # Layer 3 catalog report
```

From repo root:

```bash
pnpm send-perf:eth
pnpm send-perf:sol
pnpm send-perf:btc
pnpm send-perf weighting
```

| Chain | Docker image | Compose file |
|---|---|---|
| ETH | `ghcr.io/foundry-rs/foundry:latest` | package `docker-compose.yml` |
| SOL | `ghcr.io/zeta-chain/solana-docker:2.0.24` | `coin-tester-solana/docker-compose.yml` |
| BTC | `bitcoin/bitcoin:28.0` | package `docker-compose.btc.yml` |

## Repeat tests (CI, after PR merge)

Workflow: `.github/workflows/test-send-perf-harness.yml`

- **ETH:** runs on PRs touching harness paths + weekday schedule
- **SOL:** manual dispatch only (`chain=sol`)
- **BTC:** not wired yet

ETH L1 only (skip L2 bridge): `pnpm fixtures-only` or `pnpm send-perf:eth:fixtures`

## Fixture format

JSON metadata lives in `fixtures/<chain>/`. Runtime txs are built programmatically in `src/scenarios/` so chain state stays reproducible.

```json
{
  "id": "eth-nonce-too-low-after-mined",
  "chain": "ethereum",
  "layer": 1,
  "description": "Resubmit with stale nonce after original tx mined",
  "expectReject": "nonce too low",
  "productionWeight": { "source": "Errors/ETH.md", "count_14d": 47 }
}
```

## Adding a scenario

1. Add metadata to `fixtures/<chain>/index.json` (or a new JSON file in that folder).
2. Implement `buildSignedTx` or `run()` in `src/scenarios/<chain>/`.
3. Register in the scenario array used by the chain test file.
4. Run `pnpm weighting` and confirm Layer 3 coverage.

## Related vault notes

- `02 Working/Tier 1 Send Performance/BTC missingorspent Reproduction — Research Review.md`
- `02 Working/Tier 1 Send Performance/Errors/{BTC,ETH,Solana}.md`

## Ownership

Coin Integration (Send Performance workstream). PI 26.6 proposed item: reproduction harness, ETH first then Solana.
