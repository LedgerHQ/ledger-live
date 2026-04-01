# coin-tester-zcash — Usage Reference

Snapshot-based test harness for the Zcash sync pipeline.
Covers the full `makeGetAccountShape()` path in `@ledgerhq/coin-bitcoin`
including both transparent (Blockbook) and shielded (native Rust gRPC) sync.

All commands and examples below were validated on 2026-04-06 against
`testnet.zec.rocks:443` (native engine) and `explorers.api.live.ledger.com` (transparent explorer).

> **Note on transparent sync with testnet accounts**: `coin-bitcoin`'s
> `wallet-btc/crypto/factory.ts` always uses `coininfo.zcash.main` (no testnet
> variant). Addresses derived from a testnet `tpub` are therefore mainnet `t1...`
> addresses queried against `explorers.api.live.ledger.com/blockchain/v4/zec`
> (Ledger's mainnet ZEC explorer). `syncType=all` with a testnet account is a mixed
> setup: testnet shielded + mainnet transparent. Ledger Live has no testnet ZEC
> transparent explorer.

---

## Test Account — Alice (public testnet key)

**Never use with real funds.** All keys are public test vectors.

```
Seed: wish puppy smile loan doll curve hole maze file ginger hair nose
      key relax knife witness cannon grab despair throw review deal slush frame

UFVK (testnet):
  uviewtest1eacc7lytmvgp0sshwjjv4qsg9fnewq00s6zye8hqwndpdsg0tum2ft4k96t86eapddpq56exf
  ycnxnlds75vvpydv8fgj4cecczkmt3rjat8qjfqrk2cdlm9alep2z04785sx6yekqjk6wywkttlthld4c3x
  mg8fvneg4p97vzxwu9xtuh0xrgfy90p6uuxf8cwl8nxfq6hlte0nnylk59xceldrkx9vge3k4utkue2txu5
  kpp60aw07q0f0jgp0pv2c0gr7jdm6273uxyskt72jehte5jf2dg94d84le08h2t5rhd93j2d98ja59h46es
  t69f3a7rav7k6744p2u8dxasc7nr9p2k95x7uaknahj0kw7mu5zq9nllj7x2qswq3jswsuzwms7shv7dhx
  z9s4yudatwu3u3v3wqznkhu6jt7xt8whjh3dkzvsf28p6mj8tya009gwzgszz2at8alquu8y0fmqt7klayr
  jx7n3ulml5q00fgdr

xpub (testnet):
  tpubDDpDzVtfYFxaQ2nz9EpgviZ2wwezS1oFBDVDNUdZsmmACrgt3rnqxxLeq6JSi4w3pnmFaSVMGbpcH
  2oard5QfY8RpNK3qPXqAKfwRhShZFA

Birth height: 2,542,419
```

### Known shielded transactions (testnet.zec.rocks, observed 2026-04-06)

| Block     | TXID (prefix)  | Type                 | Notes / amounts                                          |
|-----------|----------------|----------------------|----------------------------------------------------------|
| 2,546,324 | `36c4681a…`    | z→t unshielding      | **Invisible to shielded sync** — no shielded outputs     |
| 2,546,396 | `474d547a…`    | t→z shielding        | 1 internal note 15,768,768 zat; fee paid transparent     |
| 2,560,774 | `534325eb…`    | z→z incoming         | 1 incoming note 50,000 zat; fee 10,000 zat               |
| 2,700,549 | `79adebf5…`    | z→z outgoing         | 1 outgoing note 10,000 zat + 1 internal change 1,790,960 zat; fee 10,000 zat |

The z→t unshielding at block 2,546,324 produces no shielded output notes and is therefore
invisible to `syncShielded` trial decryption. It is only observable via transparent address
lookup (Blockbook / `GetTaddressTxids`).

**Shielded balance at height 2,750,000**: 0.17692173 ZEC (Sapling pool only)

---

## Fixtures Structure

```
fixtures/
  alice-testnet/                     # shielded-only sync (syncType=shielded)
    height-2560000.snapshot          # after first 50k-block native batch
    height-2700000.snapshot          # all shielded txs visible
    height-2750000.snapshot          # final anchor
    manifest.json
  alice-testnet-all/                 # transparent + shielded (syncType=all)
    height-2750000.snapshot          # 31 transparent + 12 shielded ops
    manifest.json
  golden-values.yaml                 # assertions for verify command
```

Snapshots are gzip-compressed JSON. They store `accountShapeRaw` (without the
full operations array — trimmed for size) and `derivedData` (computed balances
and counts). The `operations` array is always `[]` in stored snapshots; only
`operationsCount` (total count) is preserved.

---

## CLI Reference

All examples use these shell variables:

```bash
UFVK="uviewtest1eacc7lytmvgp0sshwjjv4qsg9fnewq00s6zye8hqwndpdsg0tum2ft4k96t86eapddpq56exfycnxnlds75vvpydv8fgj4cecczkmt3rjat8qjfqrk2cdlm9alep2z04785sx6yekqjk6wywkttlthld4c3xmg8fvneg4p97vzxwu9xtuh0xrgfy90p6uuxf8cwl8nxfq6hlte0nnylk59xceldrkx9vge3k4utkue2txu5kpp60aw07q0f0jgp0pv2c0gr7jdm6273uxyskt72jehte5jf2dg94d84le08h2t5rhd93j2d98ja59h46est69f3a7rav7k6744p2u8dxasc7nr9p2k95x7uaknahj0kw7mu5zq9nllj7x2qswq3jswsuzwms7shv7dhxz9s4yudatwu3u3v3wqznkhu6jt7xt8whjh3dkzvsf28p6mj8tya009gwzgszz2at8alquu8y0fmqt7klayrjx7n3ulml5q00fgdr"
XPUB="tpubDDpDzVtfYFxaQ2nz9EpgviZ2wwezS1oFBDVDNUdZsmmACrgt3rnqxxLeq6JSi4w3pnmFaSVMGbpcH2oard5QfY8RpNK3qPXqAKfwRhShZFA"
GRPC="https://testnet.zec.rocks:443"
BLOCKBOOK="https://explorers.api.live.ledger.com"
FIXTURES="libs/coin-tester-modules/coin-tester-zcash/fixtures"
CLI="node libs/coin-tester-modules/coin-tester-zcash/dist/index.js"
```

---

### `record` — Full sync + snapshot capture

Runs `makeGetAccountShape()` from `birthHeight` to the last checkpoint, capturing
snapshots at each intermediate height. Intended as the nightly CI job to refresh
fixtures when on-chain state changes.

**Options:**

| Option           | Required | Description                                                    |
|------------------|----------|----------------------------------------------------------------|
| `--ufvk`         | yes      | Unified Full Viewing Key                                       |
| `--xpub`         | yes      | xpub for transparent sync                                      |
| `--birthHeight`  | yes      | Account birth height (sync starts here)                        |
| `--checkpoints`  | yes      | Comma-separated block heights to capture snapshots             |
| `--outputDir`    | yes      | Directory to write snapshot files + manifest.json              |
| `--blockbookUrl` | yes      | Blockbook base URL for transparent sync                        |
| `--zainoUrl`     | cond.    | Zaino JSON-RPC URL (mutually exclusive with `--zainoGrpcUrl`)  |
| `--zainoGrpcUrl` | cond.    | Zaino gRPC URL — enables native Rust engine (~72k bl/s)        |
| `--accountLabel` | no       | Human-readable label (default: `account`)                      |
| `--network`      | no       | `mainnet` or `testnet` (default: `mainnet`)                    |
| `--syncType`     | no       | `shielded`, `transparent`, or `all` (default: `all`)           |

Either `--zainoUrl` or `--zainoGrpcUrl` is required when `--syncType` is `shielded` or `all`.

**Example — shielded only, 3 checkpoints (native engine):**

```bash
$CLI record \
  --ufvk "$UFVK" --xpub "$XPUB" --birthHeight 2542419 \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --checkpoints "2560000,2700000,2750000" \
  --outputDir "$FIXTURES/alice-testnet" \
  --accountLabel "alice-testnet" --network testnet --syncType shielded
```

Output (2026-04-06, ~3s, native engine):
```
✔ Record complete in 3.0s
  totalSyncTimeMs: 3001
  blocksProcessed: 250000
  shieldedTxFound: 36   ← cumulative across all batch emissions
  captured: 3 snapshots
```

> Note: `shieldedTxFound` in record metrics is cumulative across all Observable
> emissions (each batch re-emits the accumulated transaction count), not the
> number of unique transactions discovered.

**Example — transparent + shielded (syncType=all):**

```bash
$CLI record \
  --ufvk "$UFVK" --xpub "$XPUB" --birthHeight 2542419 \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --checkpoints "2750000" \
  --outputDir "$FIXTURES/alice-testnet-all" \
  --accountLabel "alice-testnet-all" --network testnet --syncType all
```

Output (2026-04-06, ~10s):
```
✔ Record complete in 10.4s
  blocksProcessed: 756342   ← transparent sync (mainnet tip - birthHeight)
  shieldedTxFound: 36
  captured: 1 snapshot
```

**Example — transparent only:**

```bash
$CLI record \
  --ufvk "$UFVK" --xpub "$XPUB" --birthHeight 2542419 \
  --blockbookUrl "$BLOCKBOOK" \
  --checkpoints "2750000" \
  --outputDir "$FIXTURES/alice-testnet-transparent" \
  --accountLabel "alice-testnet-transparent" --network testnet --syncType transparent
```

#### syncType=all — checkpoint timing

When `syncType=all`, checkpoints are only triggered by shielded-origin emissions
(identified by `privateInfo` being set). The transparent sync emits a far-future
mainnet blockHeight (e.g. 3.3M) almost immediately, which would otherwise capture
an empty snapshot before shielded data has accumulated. This is intentional.

---

### `inspect` — Dump or diff snapshot metadata

Prints snapshot metadata and derived data. With `--diff`, shows field-level changes
between two snapshots (useful for checking what a replay introduced).

```bash
# Inspect a single snapshot
$CLI inspect "$FIXTURES/alice-testnet/height-2750000.snapshot"

# Diff two snapshots
$CLI inspect "$FIXTURES/alice-testnet/height-2560000.snapshot" \
  --diff "$FIXTURES/alice-testnet/height-2750000.snapshot"
```

Example diff output:
```
=== Diff ===
  shieldedBalance: 0.00050000 → 0.17692173  <<< CHANGED
  availableBalance: 0.00050000 → 0.17692173 <<< CHANGED
  operationsCount: 3 → 12                   <<< CHANGED
  shieldedTxCount: 3 → 12                   <<< CHANGED
```

---

### `replay` — Incremental sync from snapshot + assertions

Loads a snapshot, reconstructs the account, and runs an incremental sync
to `syncTo`. Useful for the developer feedback loop (fast) and for CI
assertions on known-good heights.

**Options:**

| Option                     | Required | Description                                                    |
|----------------------------|----------|----------------------------------------------------------------|
| `--snapshot`               | yes      | Path to snapshot file                                          |
| `--syncTo`                 | yes      | Absolute height (`2800000`) or relative delta (`+50000`)       |
| `--blockbookUrl`           | yes      | Blockbook URL                                                  |
| `--zainoUrl` / `--zainoGrpcUrl` | cond. | Required for shielded or all sync                            |
| `--syncType`               | no       | `shielded`, `transparent`, `all` (default: `all`)             |
| `--assertShieldedBalance`  | no       | Expected shielded balance (ZEC, 8 decimals)                    |
| `--assertTransparentBalance` | no     | Expected transparent balance                                   |
| `--assertAvailableBalance` | no       | Expected total available balance                               |
| `--assertOperationsCount`  | no       | Expected operations count (see note below)                     |
| `--assertShieldedTxCount`  | no       | Expected shielded transaction count                            |
| `--timeout`                | no       | Timeout in ms (default: 120000)                                |
| `--outputReport`           | no       | Write JSON report to this path                                 |

> **`--assertOperationsCount` caveat**: in shielded-only replay, this asserts
> the count of operations found **in this replay session**, not the cumulative
> total from the snapshot (operations are stripped from stored snapshots).
> For cumulative history assertions, use `verify --mode quick`.

**Example — shielded, advance 50k blocks, assert stable balance:**

```bash
$CLI replay \
  --snapshot "$FIXTURES/alice-testnet/height-2750000.snapshot" \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --syncTo "+50000" --syncType shielded \
  --assertShieldedBalance "0.17692173" \
  --assertShieldedTxCount 12
```

Output:
```
✔ Replay complete in 0.7s | blocks=50000
Assertions:
  ✓ shieldedBalance: expected=0.17692173 actual=0.17692173
  ✓ shieldedTxCount: expected=12 actual=12
```

**Example — transparent only, assert stable balance and op count:**

```bash
$CLI replay \
  --snapshot "$FIXTURES/alice-testnet-all/height-2750000.snapshot" \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --syncTo "+500" --syncType transparent \
  --assertTransparentBalance "0.00000000" \
  --assertOperationsCount 31
```

**Example — advance to absolute height:**

```bash
$CLI replay \
  --snapshot "$FIXTURES/alice-testnet/height-2560000.snapshot" \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --syncTo "2800000" --syncType shielded \
  --assertShieldedBalance "0.17692173" --assertShieldedTxCount 12
```

**Example — write JSON report for CI integration:**

```bash
$CLI replay \
  --snapshot "$FIXTURES/alice-testnet/height-2750000.snapshot" \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --syncTo "+50000" --syncType shielded \
  --assertShieldedBalance "0.17692173" \
  --outputReport /tmp/replay-report.json
```

The JSON report includes `metrics`, `assertions`, `allPassed`, and `finalState`.

#### Height granularity in shielded replay

The native engine scans in batches of 50,000 blocks. When `syncTo = "+200"`,
`toHeight = snapshotHeight + 200`. The engine starts from the snapshot's
`chainTipAtCapture` (not `snapshotHeight`) and scans in 50k chunks. The
`takeWhile` terminates the observable after the first batch where
`blockHeight >= toHeight`, so the effective scan range is often a full 50k-block
batch. Plan assertions accordingly.

---

### `verify` — Golden value assertions (L1 offline / L2 live)

Reads `golden-values.yaml` and verifies snapshots in `fixturesDir` against the
expected values. Two modes:

- **`quick` (L1)** — offline, reads derived data from stored snapshots (sub-second)
- **`full` (L2)** — live resync from each snapshot's stored state, then asserts

```bash
# L1 quick (CI default — no network required)
$CLI verify \
  --fixturesDir "$FIXTURES" \
  --goldenValues "$FIXTURES/golden-values.yaml" \
  --mode quick

# L2 full (nightly — requires network access to Zaino + Blockbook)
$CLI verify \
  --fixturesDir "$FIXTURES" \
  --goldenValues "$FIXTURES/golden-values.yaml" \
  --mode full
```

Example output (all 20 assertions, PASS):
```
╔═══════════════════╤═════════╤════════════════════╤════════════╤════════════╤════════╗
║ Account           │ Height  │ Check              │ Expected   │ Actual     │ Status ║
╟───────────────────┼─────────┼────────────────────┼────────────┼────────────┼────────╢
║ alice-testnet     │ 2560000 │ shieldedBalance    │ 0.00050000 │ 0.00050000 │ PASS   ║
║ alice-testnet     │ 2560000 │ operationsCount    │ 3          │ 3          │ PASS   ║
║ alice-testnet     │ 2560000 │ shieldedTxCount    │ 3          │ 3          │ PASS   ║
║ alice-testnet     │ 2700000 │ shieldedBalance    │ 0.17692173 │ 0.17692173 │ PASS   ║
║ alice-testnet     │ 2700000 │ operationsCount    │ 12         │ 12         │ PASS   ║
...
║ alice-testnet-all │ 2750000 │ operationsCount    │ 43         │ 43         │ PASS   ║
║ alice-testnet-all │ 2750000 │ shieldedTxCount    │ 12         │ 12         │ PASS   ║
╚═══════════════════╧═════════╧════════════════════╧════════════╧════════════╧════════╝
```

#### `golden-values.yaml` structure

```yaml
accounts:
  - label: alice-testnet              # must match --accountLabel used in record
    ufvkFingerprint: sha256:6b886d99b3466751
    birthHeight: 2542419
    network: testnet
    checkpoints:
      - height: 2750000
        expectedShieldedBalance: "0.17692173"
        expectedTransparentBalance: "0.00000000"
        expectedAvailableBalance: "0.17692173"
        expectedOperationsCount: 12
        expectedShieldedTxCount: 12
        comment: "optional human-readable note"
```

All assertion fields are optional. Missing fields are skipped (shown as `—`).

---

### `bench` — Performance benchmarking

Runs repeated sync iterations over a fixed block range, then reports
percentile stats. Useful for tracking throughput regressions.

**Options:**

| Option               | Description                                              |
|----------------------|----------------------------------------------------------|
| `--snapshot`         | Starting snapshot                                        |
| `--syncBlocks`       | Blocks to advance per iteration (default: 500)           |
| `--iterations`       | Number of runs (default: 3)                              |
| `--parallelAccounts` | Parallel account syncs (default: 1, max 2–3)             |
| `--syncType`         | `shielded`, `transparent`, or `all`                      |
| `--output`           | Write JSON results to this path                          |

```bash
$CLI bench \
  --snapshot "$FIXTURES/alice-testnet/height-2750000.snapshot" \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --syncBlocks 50000 --iterations 3 --syncType shielded
```

Output:
```
✔ Bench complete
Bench results (3 runs):
  avg=688ms  p50=688ms  p95=688ms  p99=688ms
  avg throughput: 72940 blocks/s
```

> The native engine scans in 50k-block batches; use `--syncBlocks` as a multiple
> of 50000 for clean measurements with the native engine.

---

### `proxy` — Fault-injecting proxy (L3 resilience tests)

Starts a unified fault-injecting proxy for Zaino calls. A single `--upstream`
option replaces the old `--zainoUrl`/`--zainoGrpcUrl` pair. The proxy detects
the protocol automatically via the HTTP/2 client preface — HTTP/2 streams (gRPC,
native engine) and HTTP/1.1 requests (JSON-RPC) are both handled on the same
port. The proxy logs stats every 10s and prints a final summary on `Ctrl+C`.

**Options:**

| Option            | Description                                                      |
|-------------------|------------------------------------------------------------------|
| `--upstream`      | Zaino URL to forward to (JSON-RPC or gRPC, required)            |
| `--latency`       | Added latency per request/stream in ms (default: `0`)            |
| `--errorRate`     | Probability of injecting an error, `0..1` (default: `0`)         |
| `--dropResponses` | Randomly drop responses/streams to simulate timeouts (default: `false`) |

**Example — 200ms latency, native engine:**

```bash
# Terminal 1
$CLI proxy --upstream "$GRPC" --latency 200
# → proxy server listening  port: 57187

# Terminal 2 — native engine through the proxy
$CLI bench \
  --snapshot "$FIXTURES/alice-testnet/height-2750000.snapshot" \
  --zainoGrpcUrl "http://localhost:57187" \
  --blockbookUrl "$BLOCKBOOK" \
  --syncBlocks 500 --iterations 3 --syncType shielded
```

**Example — 5% error rate, JSON-RPC engine:**

```bash
# Terminal 1
ZAINO_JSONRPC="https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/jsonrpc"
$CLI proxy --upstream "$ZAINO_JSONRPC" --errorRate 0.05
# → proxy server listening  port: 57188

# Terminal 2 — JSON-RPC engine through the same proxy
$CLI replay \
  --snapshot "$FIXTURES/alice-testnet/height-2750000.snapshot" \
  --zainoUrl "http://localhost:57188" \
  --blockbookUrl "$BLOCKBOOK" \
  --syncTo "+500" --syncType shielded
```

---

## Endpoints

| Service       | URL                                              | Notes                              |
|---------------|--------------------------------------------------|------------------------------------|
| Zaino gRPC    | `https://testnet.zec.rocks:443`                  | Public testnet, no auth            |
| Zaino JSON-RPC | `https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/jsonrpc` | Ledger internal |
| Blockbook     | `https://explorers.api.live.ledger.com`          | Ledger mainnet; returns 0 t-ops for testnet xpubs |

For testnet transparent sync to return meaningful results, use a testnet-aware
Blockbook instance. The Ledger mainnet Blockbook is used here for integration
testing only; testnet transparent balances will read as 0.

---

## Sync Architecture

### Transparent sync

- Single async request to Blockbook (`/api/v2/xpub/{xpub}`)
- Emits one `Partial<ZcashAccount>` with `{ operations, operationsCount, blockHeight, balance, bitcoinResources }`
- `blockHeight` = mainnet chain tip (regardless of testnet network param)
- No `privateInfo` field in emission

### Shielded sync

- Uses `familyConfig.ts` → `ZCashNative` (native Rust engine, tonic gRPC) or `ZCash` (JSON-RPC fallback)
- Toggle: `setUseNative(true)` enables native; `setZainoGrpcUrl(url)` sets the endpoint
- Native engine scans in 50,000-block batches, emitting one `ShieldedSyncResult` per batch
- Each emission contains `privateInfo` with accumulated `transactions[]`, balances, and sync state
- `blockHeight` in each emission = last block processed in that batch

### Combined sync (syncType=all)

When `syncType=all`, both observables are merged via RxJS `merge()`:
- Both start concurrently; the merged observable completes when both complete
- Transparent typically completes first (~0.5s), shielded runs for several seconds
- `sync-driver.ts` accumulates operations from both sources separately and merges them
- The `toHeight` stopping predicate only applies to shielded emissions; transparent
  emissions (which report the mainnet tip immediately) never trigger early termination

### `toHeight` behaviour

The `toHeight` parameter (set to `checkpoints[last]` in record, to `syncTo` in replay)
is enforced via `takeWhile` on the merged observable. For shielded sync, termination
occurs after the first batch whose `blockHeight >= toHeight`. Since batches are 50k blocks,
the effective scan may extend up to `toHeight + 50000 - 1`.

---

## Re-recording Fixtures

When the on-chain test account changes or the sync logic is updated, re-record
all fixtures from scratch:

```bash
# Wipe and re-record
rm -rf libs/coin-tester-modules/coin-tester-zcash/fixtures/alice-testnet
rm -rf libs/coin-tester-modules/coin-tester-zcash/fixtures/alice-testnet-all

# Shielded-only (3 checkpoints)
node libs/coin-tester-modules/coin-tester-zcash/dist/index.js record \
  --ufvk "$UFVK" --xpub "$XPUB" --birthHeight 2542419 \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --checkpoints "2560000,2700000,2750000" \
  --outputDir libs/coin-tester-modules/coin-tester-zcash/fixtures/alice-testnet \
  --accountLabel "alice-testnet" --network testnet --syncType shielded

# Transparent + shielded combined
node libs/coin-tester-modules/coin-tester-zcash/dist/index.js record \
  --ufvk "$UFVK" --xpub "$XPUB" --birthHeight 2542419 \
  --zainoGrpcUrl "$GRPC" --blockbookUrl "$BLOCKBOOK" \
  --checkpoints "2750000" \
  --outputDir libs/coin-tester-modules/coin-tester-zcash/fixtures/alice-testnet-all \
  --accountLabel "alice-testnet-all" --network testnet --syncType all

# Verify golden values still hold
node libs/coin-tester-modules/coin-tester-zcash/dist/index.js verify \
  --fixturesDir libs/coin-tester-modules/coin-tester-zcash/fixtures \
  --goldenValues libs/coin-tester-modules/coin-tester-zcash/fixtures/golden-values.yaml \
  --mode quick
```

After re-recording, update `golden-values.yaml` if any expected values changed,
then commit both the new snapshots and the updated golden values.

---

## Building the CLI

```bash
# Build dist/ (CLI binary)
pnpm --filter @ledgerhq/coin-tester-zcash build:cli

# Build lib/ and lib-es/ (for programmatic use by other packages)
pnpm --filter @ledgerhq/coin-tester-zcash build

# Type-check without emitting
pnpm --filter @ledgerhq/coin-tester-zcash typecheck

# Run unit tests
pnpm --filter @ledgerhq/coin-tester-zcash test

# Run integration tests (requires network access)
pnpm --filter @ledgerhq/coin-tester-zcash test:integ
```
