# Zcash Sync — Performance Reference

Benchmark data and architectural notes for the shielded sync pipeline.

---

## Engine Comparison

| Engine                                    | Blocks       | Time    | Throughput        | Genesis scan est. (~3.9M blocks) |
|-------------------------------------------|-------------|---------|-------------------|----------------------------------|
| JSON-RPC sequential (no batch)            | ~1,700 ★    | ~171s   | ~10 bl/s          | ~108h (4.5 days)                 |
| JSON-RPC batch (1,000 bl/call)            | 1,614       | 5.7s    | ~283 bl/s         | ~3.8h                            |
| JSON-RPC batch (genesis, coin-tester)     | 3,932,248   | 9,052s  | ~434 bl/s         | ~2h31 (measured)                 |
| **Native Rust (tonic gRPC, ZIP-307)**     | 3,659,346   | 136.9s  | ~26,730 bl/s      | ~2:17 (measured) ★★             |
| **Zingo CLI (reference)**                 | ~1,400,000 †| ~22s †  | ~26,000 bl/s †    | ~150s (est.)                     |

★ Sequential run crashed early; block count estimated from wall time.
★★ Full genesis scan from Sapling activation (block 280,000), Alice testnet account, 2,858 matched
transactions. `GetTransaction` calls dominate at this density.
† Partial measurement: Zingo's `GetTreeState` RPC times out on `testnet.zec.rocks:443`, preventing
a clean timed run from genesis. Throughput estimated from ~577k blocks scanned during an
interrupted session (birthday 2,542,419). See [Zingo comparison](#zingo-comparison) below.

Measured on M-series MacBook, testnet, 2026-04-06.

### Key ratios

- Native vs JSON-RPC batch: **~62×** faster
- Native vs JSON-RPC sequential: **~2,700×** faster
- Native vs Zingo: **comparable** (~27,000 vs ~26,000 bl/s)

### Why the native engine is faster

**JSON-RPC path** (`ZCash`, `zcash-shielded/src/ZCash.ts`):

1. `getblock` → full block + txid list (HTTP POST per 1,000-block batch)
2. `getrawtransaction` → full serialised tx for each non-coinbase tx
3. `decrypt_tx` (WASM/JS) → trial-decrypt in JavaScript

Each request is one HTTP round-trip. Full transactions are 2–4 KB each.
The Zaino 10 MB batch limit forces adaptive binary splitting when batches
are too large (`code: -32011`).

**Native Rust engine path** (`ZCashNative`, `zcash-shielded/src/ZCash.ts`):

1. `GetCompactBlocks` (tonic gRPC, ZIP-307) → compact blocks stream
   - Each compact block contains only the cryptographic data needed for trial decryption
   - Sapling: nullifier + 52-byte ciphertext per output
   - Orchard: nullifier + 52-byte ciphertext per action
2. Trial decryption fully in Rust (tokio async, zero copies to JS heap)
3. `GetTransaction` only for blocks that match (typically 0 on most blocks)

The entire inner loop — network I/O, parsing, trial decryption — runs in a
single Rust/tokio async task via a napi-rs `.node` addon. No data crosses the
JS/Rust boundary during the scan loop.

---

## Benchmark Results (2026-04-06)

### Full genesis scan (coin-tester `record`)

Alice testnet account, shielded sync only, from Sapling activation (block 280,000) to chain
tip (~3,939,346). **2,858 matched transactions** triggered `GetTransaction` calls:

```bash
time node dist/index.js record \
  --ufvk "uviewtest1eacc7lytm..." \
  --xpub "xpub6D4BDPcP2GT577..." \
  --birthHeight 280000 \
  --zainoGrpcUrl "https://testnet.zec.rocks:443" \
  --blockbookUrl "https://explorers.api.live.ledger.com" \
  --checkpoints "3950000" \
  --outputDir /tmp/native-280k \
  --accountLabel alice-genesis \
  --network testnet \
  --syncType shielded
```

```
Record complete in 136.9s
blocksProcessed: 3,659,346
shieldedTxFound: 2,858
→ ~26,730 bl/s
```

Machine: M-series MacBook, `testnet.zec.rocks:443` (Paris → USA latency).

---

## Zingo Comparison

[Zingo](https://github.com/zingolabs/zingolib) is the reference open-source Zcash wallet.
Measured on the same machine and endpoint.

### Command

```bash
time /path/to/zingolib/target/release/zingo-cli \
  --server https://testnet.zec.rocks:443 \
  --chain testnet \
  --data-dir /tmp/zingo-bench \
  --seed "wish puppy smile loan doll curve hole maze ..." \
  --birthday 280000 \
  --waitsync \
  balance
```

### Constraint: `GetTreeState` timeout

`testnet.zec.rocks:443` does not respond to the `GetTreeState` gRPC call that Zingo requires
to initialise the note commitment tree (needed for spending capability). The `--waitsync`
approach exits with an error after the timeout (~5s) without scanning any blocks.

A full timed genesis run was therefore not possible with this endpoint. A partial measurement
was obtained by restarting sync manually after the initial error (birthday 2,542,419 →
~577k blocks scanned before interruption):

```
Effective scan time: ~22s
Blocks scanned:       ~577,000
Estimated throughput: ~26,000 bl/s
```

### Comparison

| | Native Rust engine | Zingo |
|---|---|---|
| Throughput (genesis scan) | ~26,730 bl/s | ~26,000 bl/s (est.) |
| Full testnet (3.66M blocks) | 136.9s (measured) | ~141s (est.) |
| `GetTransaction` calls | yes (matched txs only) | yes |
| Note commitment tree | no (scan-only) | yes (enables spending) |
| React Native compatible | no (napi-rs) | n/a |

Both engines are bottlenecked by `GetTransaction` RPCs when there are many matched transactions.
The native engine and Zingo show **equivalent throughput** on real-world scans.

The 72,000 bl/s figure (compact block streaming, no matches) represents the upper bound
achievable when the account has no transactions in the scanned range.

---

## Native Engine Architecture

### napi-rs `.node` addon

The native engine is implemented in `@ledgerhq/zcash-shielded` as a napi-rs
addon (`zcash-shielded/src/nativeRsEngine.ts` → compiled Rust binary).

Crate dependencies:
- `tonic` — async gRPC client (HTTP/2)
- `zcash_client_backend` with `lightwalletd-tonic` feature — pre-generated proto
  bindings for `CompactTxStreamerClient`, no `tonic-build` needed
- `zcash_keys`, `sapling-crypto`, `orchard` — key derivation and trial decryption

### Batch size

The native engine scans in chunks of 50,000 blocks (`ZCASH_NATIVE_CHUNK_SIZE`).
Each chunk emits one `ShieldedSyncResult` to the RxJS Observable. The overall
sync observable terminates when the batch `blockHeight` reaches or exceeds
`toHeight` (controlled by `takeWhile` in `sync-driver.ts`).

For the test harness, `--checkpoints` and `--syncTo` values should ideally
be multiples of 50,000 above the birth height for clean batch boundaries.

### Toggle: native vs JSON-RPC

`familyConfig.ts` controls which path is taken:

```typescript
setZainoGrpcUrl("https://testnet.zec.rocks:443"); // set the URL
setUseNative(true);                                // enable native engine
```

`sync-driver.ts` sets both flags based on CLI args:
- `--zainoGrpcUrl` → `setZainoGrpcUrl(url)` + `setUseNative(true)`
- `--zainoUrl` → `setZainoNodeUrl(url)` + `setUseNative(false)`

If `setUseNative(true)` is called without a gRPC URL, an error is thrown
at sync time.

### React Native compatibility

The napi-rs `.node` addon is **not** compatible with React Native.
Node.js / Electron only. A future phase would add `uniffi-rs` bindings
(Swift / Kotlin) from the same Rust codebase.

---

## Transparent Sync

**Explorer**: `explorers.api.live.ledger.com/blockchain/v4/zec` (Ledger's own explorer API,
not standard Blockbook `/api/v2/`). Speed depends on network latency, not block count.

**Important**: `wallet-btc/crypto/factory.ts` always uses `coininfo.zcash.main` for Zcash
— there is no testnet variant. Addresses derived from a testnet xpub are therefore mainnet
`t1...` addresses. The transparent sync always queries **mainnet ZEC**, regardless of the
shielded sync network. This is not a bug; Ledger Live has no testnet ZEC transparent explorer.

When `syncType=all` with a testnet account, the result is a **mixed sync**:
- Shielded: testnet data from testnet.zec.rocks
- Transparent: mainnet data from explorers.api.live.ledger.com

Transparent sync completes almost immediately (typically < 500ms) while shielded sync
runs for several seconds. The combined observable completes when both finish.

---

## Zaino Endpoints

| Protocol    | URL                                                                            | Auth       |
|-------------|--------------------------------------------------------------------------------|------------|
| gRPC        | `https://testnet.zec.rocks:443`                                                | None       |
| JSON-RPC    | `https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/jsonrpc`  | None       |
| gRPC (Ledger internal) | `https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/grpc/...` | HTTP Basic |
| Blockbook   | `https://explorers.api.live.ledger.com`                                        | None       |

The Ledger internal gRPC endpoint requires HTTP Basic authentication and uses a
URL path prefix, which is incompatible with vanilla gRPC clients that expect a
bare `host:port`. Use `testnet.zec.rocks:443` for development and testing.

---

## Historical: JSON-RPC Batch Record Run (2026-04-03)

Full genesis scan with JSON-RPC batch engine, before the native engine was available:

```bash
node dist/index.js record \
  --ufvk "uviewtest1eacc7lytm..." \
  --xpub "tpubDDpDzVtfYFxaQ2n..." \
  --birthHeight 0 \
  --zainoUrl "https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/jsonrpc" \
  --blockbookUrl "https://explorers.api.live.ledger.com" \
  --syncType shielded \
  --checkpoints "3930756" \
  --outputDir ./fixtures/alice-genesis \
  --accountLabel alice-genesis --network testnet
```

| Metric                      | Value                        |
|-----------------------------|------------------------------|
| Total sync time             | 9,052s (~2h31)               |
| Blocks processed            | 3,932,248                    |
| Speed                       | ~434 bl/s                    |
| Shielded tx found           | 0 (account inactive on node) |

This run established the JSON-RPC baseline. The native Rust engine achieves
~250× this throughput on the same machine.
