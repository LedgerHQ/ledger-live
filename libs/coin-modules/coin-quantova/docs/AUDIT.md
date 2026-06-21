# coin-quantova - correctness audit and benchmark

Scope: the host-side `coin-quantova` module (post-quantum integration for Ledger Live).
This report covers the deterministic, security-relevant logic that runs in the host:

- the Q-branded Bech32m / hex H160 address codec (`src/logic/address.ts`),
- the on-chain `QSignature` envelope codec and the SCALE compact codec
  (`src/pq/qsignature.ts`),
- the post-quantum scheme registry (`src/pq/schemes.ts`),
- the signer contracts and signing flow (`src/signer/*`, `src/logic/transaction/*`).

Out of scope (and not claimed): the on-device post-quantum signing itself, which does not
exist on any Ledger device today and is the open requirement this PR raises with Ledger
(see `README.md` and `DEVICE-INTEGRATION.md`). The cryptographic primitives are not
re-implemented here; signing delegates to Quantova's audited qweb3.js SDK.

## Method

1. Line-by-line review of every codec for integer-width, sign-extension, bounds and
   edge-case handling (JavaScript bitwise operations are 32-bit signed, which is the main
   correctness hazard in SCALE/Bech32 codecs).
2. A standalone verification harness exercising 2,015 cases: 2,000 randomised address
   round-trips, address rejection cases (bad checksum, junk, missing 0x40 brand byte), all
   three `QSignature` schemes at their maximum signature length, and SCALE compact values
   across every encoding mode including the 4-byte boundary.
3. A throughput benchmark of each codec, retained as a CI performance test
   (`src/pq/performance.test.ts`).

## Findings

| ID | Severity | Component | Status |
| --- | --- | --- | --- |
| F-1 | Low (correctness) | `qsignature.ts` SCALE compact | Fixed |
| O-1 | Optimisation | `address.ts` decode | Applied |
| O-2 | Optimisation | `address.ts` polymod | Applied |

### F-1 - signed right shift in SCALE compact decode (fixed)

`compactDecode` decoded the 4-byte mode with a signed `>> 2`. For compact values at or
above 2^31 the reconstructed 32-bit word is negative in JavaScript's signed integer view,
so the arithmetic shift produced a wrong (negative) result. The 2-byte mode and the encoder
shared the same hazard.

- Impact in practice: none for current usage - every Quantova signature length (SPHINCS+
  7856, Falcon 754, Dilithium 2420) is below 16,384 and uses the 2-byte mode, which is
  unaffected. The bug only manifested for 4-byte-mode values >= 2^31, which the module never
  produces today.
- Fix: all compact shifts use the unsigned `>>>` operator, and the encoder masks with
  `>>> 0` before extracting bytes. Verified across 0, 63, 64, 16383, 16384, 2^29,
  2^30-1, 2^30 and 2e9 (the 2^29 and 2^30-1 cases are now regression-tested in
  `qsignature.test.ts`).

### O-1 - O(1) reverse charset lookup in address decode

`decodeQAddress` used `CHARSET.indexOf` (a linear scan over 32 characters) per data
character. Replaced with a precomputed `Int8Array(128)` reverse table. Address decode
throughput roughly doubled (see below).

### O-2 - hoisted Bech32m generator constants

The `GEN` polynomial array was reallocated on every `polymod` call. Hoisted to a module-level
constant.

No other defects were found. The codecs perform no I/O, allocate bounded buffers sized
from the scheme registry, validate all lengths before copying, and reject malformed input
by returning `null` / throwing rather than producing partial output.

## Correctness verification

```
correctness: 2015 passed, 0 failed
```

Covered: address round-trip (2,000 random bodies), address rejection (bad checksum, junk,
non-0x40 brand byte), `QSignature` round-trip with correct variant byte for SPHINCS+(0),
Falcon(1) and Dilithium(2) at maximum signature length, and SCALE compact across all modes.

## Benchmark

Measured on Node v26 (developer machine; CI numbers will differ, hence the generous 50
us/op budget in the performance test). All codecs are sub-microsecond to ~1.3 us/op,
including the 7,856-byte SPHINCS+ signature.

| Operation | Throughput | Per op |
| --- | --- | --- |
| address encode | 738,000 ops/s | 1.35 us |
| address decode | 1,620,000 ops/s | 0.62 us |
| QSignature encode (SPHINCS+) | 1,020,000 ops/s | 0.98 us |
| QSignature decode (SPHINCS+) | 1,103,000 ops/s | 0.91 us |
| QSignature encode (Falcon) | 1,999,000 ops/s | 0.50 us |
| QSignature decode (Falcon) | 900,000 ops/s | 1.11 us |
| QSignature encode (Dilithium) | 1,371,000 ops/s | 0.73 us |
| QSignature decode (Dilithium) | 776,000 ops/s | 1.29 us |
| SCALE compact encode+decode | 18,656,000 ops/s | 0.05 us |

## Notes for reviewers

- The software signer (`signer/softwareSigner.ts`) holds key material in process memory by
  design; it is a reference and CI/bot signer, not a wallet. Production signing is the
  device signer (`signer/deviceSigner.ts`), which is the integration point for Ledger.
- All source and docs are plain ASCII.
- The module re-implements only the deterministic envelope/address codecs; the post-quantum
  signature math comes from the qweb3.js SDK, so it is not duplicated or re-audited here.
