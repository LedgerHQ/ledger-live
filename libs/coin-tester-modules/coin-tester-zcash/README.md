# coin-tester-zcash

Test harness for the Zcash sync pipeline (`makeGetAccountShape` in `coin-bitcoin`). Enables snapshot-based regression testing without requiring a full rescan on every CI run.

## Overview

### Problem it solves

Zcash shielded sync is expensive: scanning from birth height to chain tip can take several minutes even with the native Rust engine, and hours with a naive JSON-RPC approach. Running a full rescan on every CI run is not practical.

This harness solves that by separating two concerns:
- **Recording** (nightly, ~2 min): run the full sync once, capture snapshots at specific block heights.
- **Replaying** (per-PR, < 5s): restore account state from a snapshot, sync a small delta, assert on the result.

### Three test levels

| Level | Command | Network | Speed | Use case |
|-------|---------|---------|-------|----------|
| **L1** — offline | `verify` | none | < 1s | Sanity check: balances in snapshot match golden values |
| **L2** — live sync | `replay` | Zaino + Blockbook | ~5s | Regression: incremental sync produces expected account state |
| **L3** — fault injection | `proxy` + `replay` | Zaino (via proxy) | ~10s | Resilience: sync survives latency, errors, dropped responses |

### Sync backends

Two backends are available, selected by which URL flag you provide:

| Flag | Backend | Speed | When to use |
|------|---------|-------|-------------|
| `--zainoGrpcUrl` | Native Rust engine (napi-rs + tonic) | ~27 000 bl/s | Record runs, performance-sensitive CI |
| `--zainoUrl` | JSON-RPC (TypeScript) | ~11 bl/s | L3 fault injection (slower, no native dependency) |

The native engine requires the `ledger-zcash-utils` native addon (`.node` binary, platform-specific, not committed to git). The JSON-RPC backend has no native dependency.

---

## Installation

```bash
# From the monorepo root
pnpm --filter @ledgerhq/coin-tester-zcash build:cli
```

The CLI is then available at `dist/index.js` from the package directory:

```bash
node dist/index.js --help
```

---

## Commands

### `record`

**When to use:** Nightly CI job. Run a full sync from birth height and capture snapshots at specific block heights. The resulting snapshots feed `verify` (L1) and `replay` (L2).

```bash
node dist/index.js record \
  --ufvk "uviewtest1eacc7l..." \
  --xpub "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4" \
  --birthHeight 280000 \
  --zainoGrpcUrl "https://testnet.zec.rocks:443" \
  --blockbookUrl "https://zcash1.trezor.io" \
  --checkpoints "285000,295000,3932659" \
  --outputDir ./fixtures/alice-testnet-grpc \
  --accountLabel alice \
  --network testnet \
  --syncType shielded
```

Outputs one `height-<N>.snapshot` per checkpoint plus a `manifest.json`.

| Option | Required | Description |
|--------|----------|-------------|
| `--ufvk` | yes | Unified Full Viewing Key |
| `--xpub` | yes | xpub for transparent sync |
| `--birthHeight` | yes | Account birth height |
| `--zainoGrpcUrl` | cond. | Zaino gRPC URL — native Rust engine (mutually exclusive with `--zainoUrl`) |
| `--zainoUrl` | cond. | Zaino JSON-RPC URL (mutually exclusive with `--zainoGrpcUrl`) |
| `--blockbookUrl` | yes | Blockbook URL |
| `--checkpoints` | yes | Comma-separated block heights to capture |
| `--outputDir` | yes | Directory to write snapshot files |
| `--syncType` | no | `transparent`, `shielded`, or `all` (default: `all`) |
| `--accountLabel` | no | Label stored in snapshot metadata (default: `account`) |
| `--network` | no | `mainnet` or `testnet` (default: `mainnet`) |

`--zainoGrpcUrl` or `--zainoUrl` is required when `--syncType` is `shielded` or `all`. They are mutually exclusive.

---

### `replay`

**When to use:** Per-PR CI job (L2). Restore account state from a snapshot, sync a small block delta against live infrastructure, and assert on balances / operation counts. Fast because it skips the expensive initial scan.

```bash
node dist/index.js replay \
  --snapshot ./fixtures/alice-testnet-grpc/height-285000.snapshot \
  --syncTo +1000 \
  --zainoGrpcUrl "https://testnet.zec.rocks:443" \
  --blockbookUrl "https://zcash1.trezor.io" \
  --syncType shielded \
  --assertShieldedBalance "0.00000000" \
  --assertOperationsCount 0
```

`--syncTo` accepts an absolute height (`286000`) or a relative delta (`+1000`).

| Option | Required | Description |
|--------|----------|-------------|
| `--snapshot` | yes | Path to snapshot file |
| `--syncTo` | yes | Target block height (absolute or `+N` delta from snapshot height) |
| `--zainoGrpcUrl` | cond. | Zaino gRPC URL — native Rust engine (mutually exclusive with `--zainoUrl`) |
| `--zainoUrl` | cond. | Zaino JSON-RPC URL (mutually exclusive with `--zainoGrpcUrl`) |
| `--blockbookUrl` | yes | Blockbook URL |
| `--syncType` | no | `transparent`, `shielded`, or `all` (default: `all`) |
| `--assertShieldedBalance` | no | Expected shielded balance in ZEC (8 decimal places) |
| `--assertTransparentBalance` | no | Expected transparent balance in ZEC |
| `--assertAvailableBalance` | no | Expected total available balance in ZEC |
| `--assertOperationsCount` | no | Expected total operation count |
| `--assertShieldedTxCount` | no | Expected shielded transaction count |
| `--timeout` | no | Timeout in ms (default: `120000`) |
| `--outputReport` | no | Write JSON report to this path |

Exits with code `1` if any assertion fails.

---

### `verify`

**When to use:** L1 offline check. Read stored snapshots from disk and compare their derived data against a `golden-values.yaml` file. No network access required — ideal for fast pre-merge validation or sanity checks after editing snapshot files.

```bash
node dist/index.js verify \
  --fixturesDir ./fixtures \
  --goldenValues ./golden-values.yaml \
  --mode quick
```

Outputs a table with `PASS / FAIL / SKIP` for each (account, height, assertion) combination.

| Option | Required | Description |
|--------|----------|-------------|
| `--fixturesDir` | yes | Root directory containing `<label>/height-<N>.snapshot` files |
| `--goldenValues` | yes | Path to `golden-values.yaml` |
| `--mode` | no | `quick` (L1, offline, default) — `full` reserved for future live-sync mode |

Exits with code `1` if any assertion fails.

#### `golden-values.yaml` format

```yaml
accounts:
  - label: alice-testnet-grpc          # must match the subdirectory name in fixturesDir
    ufvkFingerprint: "sha256:6b886d99b3466751"
    birthHeight: 280000
    network: testnet
    checkpoints:
      - height: 285000
        expectedShieldedBalance: "0.00000000"    # ZEC, 8 decimal places
        expectedTransparentBalance: "0.00000000"
        expectedAvailableBalance: "0.00000000"
        expectedOperationsCount: 0
        expectedShieldedTxCount: 0
        comment: "5000 blocks after birth, no transactions yet"
      - height: 295000
        expectedShieldedBalance: "0.00000000"
        # omit fields to skip that assertion
```

All assertion fields are optional — omit a field to skip that check.

---

### `bench`

**When to use:** Performance measurement. Run multiple sync iterations from a snapshot and compute latency statistics (avg / p50 / p95 / p99). Use this to measure the impact of sync engine changes or to compare backends.

```bash
node dist/index.js bench \
  --snapshot ./fixtures/alice-testnet-grpc/height-285000.snapshot \
  --syncBlocks 500 \
  --iterations 5 \
  --parallelAccounts 1 \
  --zainoGrpcUrl "https://testnet.zec.rocks:443" \
  --blockbookUrl "https://zcash1.trezor.io" \
  --syncType shielded \
  --output ./bench-results.json
```

Prints `avg / p50 / p95 / p99` latency and average blocks/sec.

| Option | Required | Description |
|--------|----------|-------------|
| `--snapshot` | yes | Path to snapshot file |
| `--zainoGrpcUrl` | cond. | Zaino gRPC URL — native Rust engine (mutually exclusive with `--zainoUrl`) |
| `--zainoUrl` | cond. | Zaino JSON-RPC URL (mutually exclusive with `--zainoGrpcUrl`) |
| `--blockbookUrl` | yes | Blockbook URL |
| `--syncType` | no | `transparent`, `shielded`, or `all` (default: `all`) |
| `--syncBlocks` | no | Blocks to sync per iteration (default: `500`) |
| `--iterations` | no | Number of iterations (default: `3`) |
| `--parallelAccounts` | no | Parallel account syncs per iteration, max 3 (default: `1`) |
| `--output` | no | Write JSON results to this path |

---

### `inspect`

**When to use:** Debugging and exploration. Display metadata and derived data from a snapshot file (balances, operation counts, birth height, chain tip at capture). Use `--diff` to compare two snapshots and highlight what changed between two checkpoints.

```bash
# Inspect a single snapshot
node dist/index.js inspect ./fixtures/alice-testnet-grpc/height-285000.snapshot

# Diff two snapshots (e.g. before and after a sync)
node dist/index.js inspect ./fixtures/alice-testnet-grpc/height-285000.snapshot \
  --diff ./fixtures/alice-testnet-grpc/height-295000.snapshot
```

No network access required.

---

### `proxy`

**When to use:** L3 fault injection. Start a unified fault-injecting proxy for Zaino calls. Handles both HTTP/2 (gRPC, native engine) and HTTP/1.1 (JSON-RPC) on the same port — protocol is detected automatically via the HTTP/2 client preface.

Run in one terminal, then point `bench` / `replay` / `record` at `http://localhost:{port}` using either `--zainoGrpcUrl` or `--zainoUrl`.

```bash
# Terminal 1 — start proxy with 200ms latency
node dist/index.js proxy \
  --upstream "https://testnet.zec.rocks:443" \
  --latency 200

# Terminal 2 — native engine through the proxy
node dist/index.js bench \
  --snapshot ./fixtures/alice-testnet/height-2750000.snapshot \
  --zainoGrpcUrl "http://localhost:{port}" \
  --blockbookUrl "https://explorers.api.live.ledger.com" \
  --syncBlocks 500 --iterations 3 --syncType shielded

# Terminal 2 (alternative) — JSON-RPC engine through the same proxy
node dist/index.js replay \
  --snapshot ./fixtures/alice-testnet/height-2750000.snapshot \
  --zainoUrl "http://localhost:{port}" \
  --blockbookUrl "https://explorers.api.live.ledger.com" \
  --syncTo +500 --syncType shielded
```

Logs proxy stats every 10s. Stop with `Ctrl+C`.

| Option | Required | Description |
|--------|----------|-------------|
| `--upstream` | yes | Zaino URL to forward requests to (JSON-RPC or gRPC) |
| `--latency` | no | Added latency per request/stream in ms (default: `0`) |
| `--errorRate` | no | Probability of injecting an error, `0..1` (default: `0`) |
| `--dropResponses` | no | Randomly drop responses/streams to simulate timeouts (default: `false`) |

---

## Fixtures layout

```
fixtures/
  alice-testnet-grpc/         ← account label (used by verify --fixturesDir)
    manifest.json
    height-285000.snapshot
    height-295000.snapshot
    height-3932659.snapshot
  bob-testnet/
    manifest.json
    height-700000.snapshot
golden-values.yaml
```

Snapshots are gzip-compressed JSON. They store the full serialised `ZcashAccountRaw` (including UFVK encoded in the account id and sync state) plus pre-computed derived data (balances, operation counts). No raw private keys are stored — the UFVK fingerprint in metadata is a truncated SHA-256.

Large snapshot sets should be tracked with **Git LFS**.

---

## Running tests

```bash
# Unit tests (no network)
pnpm --filter @ledgerhq/coin-tester-zcash test

# Integration tests (requires live Zaino + Blockbook)
ZCASH_UFVK=uviewtest1... \
ZCASH_XPUB=xpub6... \
ZCASH_BIRTH_HEIGHT=280000 \
ZAINO_URL=https://testnet.zec.rocks:443 \
BLOCKBOOK_URL=https://zcash1.trezor.io \
pnpm --filter @ledgerhq/coin-tester-zcash test:integ
```

## Logging

Set `LOG_LEVEL` to control pino output: `trace`, `debug`, `info` (default), `warn`, `error`.

```bash
LOG_LEVEL=debug node dist/index.js replay ...
```

---

## Appendix — Test accounts

These are the standard SDK test accounts from `zcash-android-wallet-sdk` (`sdk-incubator-lib`). Keys were derived with `zcash_keys v0.4` (ZIP-32 / BIP-44) at account index 0.

> **Never use these seeds with real funds.** They are public test vectors.

### Alice

**Seed phrase**
```
wish puppy smile loan doll curve hole maze file ginger hair nose key relax knife witness cannon grab despair throw review deal slush frame
```

**UFVK (testnet)**
```
uviewtest1eacc7lytmvgp0sshwjjv4qsg9fnewq00s6zye8hqwndpdsg0tum2ft4k96t86eapddpq56exfycnxnlds75vvpydv8fgj4cecczkmt3rjat8qjfqrk2cdlm9alep2z04785sx6yekqjk6wywkttlthld4c3xmg8fvneg4p97vzxwu9xtuh0xrgfy90p6uuxf8cwl8nxfq6hlte0nnylk59xceldrkx9vge3k4utkue2txu5kpp60aw07q0f0jgp0pv2c0gr7jdm6273uxyskt72jehte5jf2dg94d84le08h2t5rhd93j2d98ja59h46est69f3a7rav7k6744p2u8dxasc7nr9p2k95x7uaknahj0kw7mu5zq9nllj7x2qswq3jswsuzwms7shv7dhxz9s4yudatwu3u3v3wqznkhu6jt7xt8whjh3dkzvsf28p6mj8tya009gwzgszz2at8alquu8y0fmqt7klayrjx7n3ulml5q00fgdr
```

**xpub for transparent sync (BIP-44 m/44'/133'/0')**
```
xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4
```

**UFVK fingerprint** (SHA-256 prefix stored in snapshots): `sha256:6b886d99b3466751`

---

### Ben

**Seed phrase**
```
kitchen renew wide common vague fold vacuum tilt amazing pear square gossip jewel month tree shock scan alpha just spot fluid toilet view dinner
```

**UFVK (testnet)**
```
uviewtest18la5rss83ypen8qsnk79vwef270fffs50d302da2vjrv2guy3amz4kj66vx2rys8ytwk7rzfy2znykq4273q70q9nzsftjh8x4urejszpv2rn2rrh7thggc340m2vwxqgykypt2tcgkfp28y6yt7gtq4qc59lsssvxlma0jem7l4q7gh2jc6l2nag53t7neffpwhr626gr9zcnkfne87fltkrt4s6c76ez4u70e4sld4wtww7hrv508lch0dnqpysguhdjrn40rcjwj8aln22xeu7p75ted5nnpzyatlz25gu0t69vqtv8er774qqapmm0222q2pl5h84zpuhz5c0eg08pxkmtr7jlurxsw5c20urafl2acx3hm9w2uzz0exju66xksu9pplujr8trgnsjyfgrmqknrp2n5w6k899qjx2jrmxnrggg528s9pe694zvhec8vy6ussyr33nzsltz7y3zzlafypp54g39l6u79e0cgqf5cnpf9v
```

---

### Re-deriving these keys

Keys can be re-derived using `zcash_keys` (Rust):

```rust
use bip39::Mnemonic;
use zcash_keys::keys::UnifiedSpendingKey;
use zcash_protocol::consensus::Network;
use zip32::AccountId;

let mnemonic: Mnemonic = SEED_PHRASE.parse().unwrap();
let seed = mnemonic.to_seed("");
let usk = UnifiedSpendingKey::from_seed(
    &Network::TestNetwork,
    &seed,
    AccountId::try_from(0u32).unwrap(),
).unwrap();
let ufvk = usk.to_unified_full_viewing_key().encode(&Network::TestNetwork);
```

The xpub is derived at BIP-44 path `m/44'/133'/0'` using any standard BIP-32 library.
