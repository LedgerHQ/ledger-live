# Send Performance Harness Blockers

## Guillaume fixture share (optional enrichment)

Guillaume's 1000-scenario BTC corpus can extend coverage once shared. **BTC Layer 1 runs without it** on local regtest bitcoind (`docker-compose.btc.yml`).

Open questions from the reproduction review remain useful for weighting and Atlas Layer 2, not for running L1 today.

## PI 26.6 commitment

Harness is proposed in Steerco W32 deck data (2026-08-03), not yet committed in Jira. ETH/SOL implementation proceeds as in-house scaffolding; confirm scope with Pablo when back.

## Atlas/regtest for BTC Layer 2

Server-side `missingorspent` runs through Atlas `atlas-btc-mainnet-pending`. Wiring full Atlas rejection through Layer 2 needs JC confirmation before BTC Layer 2 goes live.
