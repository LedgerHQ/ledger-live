# Hedera generic-bridge non-regression harness

Temporary: remove before merging.

Syncs real mainnet accounts through the real generic sync (`bridge.sync`) twice — once with
develop's Hedera code, once with this branch's — then compares both histories with each other and
with the chain. The recorded edge cases also live as a unit test:
`libs/coin-modules/coin-hedera/src/logic/listOperations.v2.mainnet.test.ts`.

## Run (from `libs/ledger-live-common`)

```sh
hedera-nonreg/run.sh "0.0.8835924,0.0.10608795@1784116370"
```

- `0.0.X` syncs the full history; `0.0.X@<unix seconds>` syncs incrementally from that time (a
  placeholder op makes the generic sync resume there, like a stored account would).
- Reports: `out/report-<account>.txt`; raw dumps: `out/{develop,branch}/<account>.json`.
- Both variants sync in parallel, so a busy batch can hit the mirror node's rate limit (HTTP 429 in
  `out/jest-*.log`): rerun the failed accounts.
- develop's code is the merge base with `origin/develop` (override with `NONREG_BASE=<commit>`),
  extracted with `git archive` to `coin-hedera/node_modules/.nonreg-develop` on first run.

## What each report checks

1. `check_chain.py` — per transaction and asset, the signed sum of live operations must equal the
   account's net movement on the mirror node (HBAR, HTS) / hgraph (ERC20). Mismatches are split into
   **broken by branch**, **fixed by branch** and **wrong in both**, and grouped by cause.
2. `compare.py` — op counts, balance vs ops sum per sub-account, duplicate ids.
3. `presentation.py` — what changed beyond amounts (senders, recipients, op split…), grouped.

## Other files

- `capture.py` records edge cases into the coin-hedera unit test fixture
  (`src/test/fixtures/mainnet-edge-cases.json`); its `CASES` list names each one.
- `cases/*.json` — mainnet accounts and transactions gathered for each edge-case category.
- `proxy-setup.js` only acts behind an HTTPS proxy (sandboxed runs).
