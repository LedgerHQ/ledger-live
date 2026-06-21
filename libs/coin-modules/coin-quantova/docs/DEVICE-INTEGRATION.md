# Adding Quantova to Ledger — without touching any other asset

A common (and correct) concern when adding a novel, **post-quantum** chain is: *does this
change anything for Bitcoin, Ethereum, Polkadot, or any existing coin?* The answer is
**no** — and that is by construction, at both layers of the stack. This document explains
the isolation guarantees so the integration can be reviewed and shipped with confidence.

## Two layers, both isolated

```
┌────────────────────────────── Ledger Live (host) ──────────────────────────────┐
│  libs/coin-modules/coin-quantova   ← THIS PR. A self-contained package.         │
│  - no edits to any other coin-module; no shared file touched.                   │
│  - talks to a Quantova node over the q_ JSON-RPC namespace only.                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   │  APDU (per-app channel)
┌──────────────────────────────── Ledger device ─────────────────────────────────┐
│  BOLOS OS  →  isolates every app: separate memory, keys, and crypto.            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────────────────┐   │
│  │ app-bitcoin│ │app-ethereum│ │app-polkadot│ │ app-quantova  (NEW, PQ)     │   │
│  │ secp256k1  │ │ secp256k1  │ │ ed25519    │ │ Dilithium / Falcon / SPHINCS+│   │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────────────────────┘   │
│      ▲ unchanged    ▲ unchanged    ▲ unchanged        ▲ all PQ code lives here   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Host side (this PR) — additive only

- `coin-quantova` is a **new package** under `libs/coin-modules/`. It adds files; it edits
  none belonging to another coin. Ledger Live loads coin-modules independently, so an
  unknown/disabled Quantova currency has zero effect on existing flows.
- The only network surface is Quantova's `q_` JSON-RPC namespace (`network/node.ts`).
- The post-quantum code (key handling, the `QSignature` envelope) is confined to
  `coin-quantova/src/pq/**`; nothing in `coin-framework` or other coins references it.

## Device side — BOLOS app isolation

Ledger devices run **one embedded app per blockchain**, and BOLOS (the device OS) sandboxes
each app: an app cannot read another app's memory, keys, or code. A new `app-quantova`
therefore:

1. **Carries its own crypto.** Dilithium / Falcon / SPHINCS+ live **only inside
   app-quantova**. The OS/SE crypto library used by app-bitcoin, app-ethereum, etc. is
   **not modified** — no PQ code is added to the shared path, so no existing app's signing
   changes in any way.
2. **Derives its own keys.** Quantova uses its own **SLIP-44 coin type**, so its BIP-44
   derivation paths are namespaced. The seed is shared (as for every app), but each app
   derives independently and never exposes private material across the BOLOS boundary.
3. **Installs/uninstalls independently.** A user adds app-quantova like any other app; it
   occupies its own flash slot and can be removed without affecting other apps. Devices
   short on space simply don't install it — existing assets are untouched either way.
4. **Clear-signs via the metadata hash.** Quantova's runtime ships the `CheckMetadataHash`
   (RFC-78) extension, and release builds bake `enable_metadata_hash("QTOV", 18)`. With the
   extension **enabled** in the signing payload, app-quantova verifies the digest and
   displays amount / asset / recipient — no blind-signing.

**Net effect:** adding Quantova is purely additive. No existing coin-module, no shared
device crypto, and no other app's keys or behaviour are changed.

## What this PR delivers vs. what Ledger builds next

| Layer | Status |
| --- | --- |
| Host coin-module (`coin-quantova`) | ✅ in this PR — address codec, `q_` RPC, tx + signing flow, `QSignature` envelope, config |
| PQ key-gen & signing reference (qweb3.js) | ✅ in this PR — a **software** signer producing valid signatures (the byte-exact spec) |
| `QuantovaSigner` device contract + APDU placeholder | ✅ in this PR — `signer/deviceSigner.ts` |
| `app-quantova` device app (PQ on the Secure Element) | ⬜ Ledger — the open requirement |

The software reference proves the whole flow and gives `app-quantova` an exact target. The
remaining work — running a PQ scheme on the Secure Element (Dilithium is the most tractable;
or a hybrid classical+PQ signature, aligned with Ledger's published roadmap) — is the part
we are asking Ledger to take on. Everything else is done and isolated.
