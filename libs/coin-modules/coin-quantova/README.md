# @ledgerhq/coin-quantova

Coin module for **Quantova** — a post-quantum Layer-1 blockchain (Substrate-based,
`stable2506-pq`). Native asset **QTOV** (18 decimals); testnet asset **TQTOV**.

> **Status: proposal / work-in-progress.** This module implements the host-side
> integration (accounts, address codec, the `q_` JSON-RPC client, transaction model,
> and the device-signer contract). It is opened as a **draft** because it depends on a
> device-side capability Ledger does not ship yet — **post-quantum signing** (see
> "Open requirement" below). We are raising it to start that conversation, not to merge
> as-is.

## Why Quantova is different

Quantova removes the elliptic curve from the trust base. Accounts are **not** secured
by Ed25519/secp256k1; every account is secured by one of three NIST post-quantum
signature schemes, and a fourth PQ algorithm secures the encrypted lane:

| Algorithm | NIST std | Role |
| --- | --- | --- |
| CRYSTALS-Dilithium | ML-DSA (FIPS 204) | account signatures |
| Falcon | FN-DSA (FIPS 206) | account signatures |
| SPHINCS+ | SLH-DSA (FIPS 205) | account signatures |
| ML-KEM-768 | FIPS 203 | QTE encrypted-lane key encapsulation |

Hashing is SHA3-256 throughout.

## Address format

A Quantova address is derived from the account's PQ public key:

```
pubkey --SHA3-256--> digest[0..20]            (20-byte H160 body)
body[0] = 0x40                                 ("Q" brand byte)
AccountId32 = body[0..20] || 0xEE * 12         (0xEE = QVM account-mapping marker)
display     = Bech32m("q", body)  ->  "Q1..."  (canonical user-facing form)
```

So every valid address begins with `Q`. The canonical user-facing form is the
**Q-branded Bech32m** string (`Q1…`); the hex H160 body (`Q<40-hex>` / `0x<40-hex>`)
is also accepted on the wire. This module's `logic/address.ts` implements both.

> **Important for Ledger Live display:** Quantova advertises `ss58Format = 42` for
> compatibility, but the canonical address is the `Q1…` Bech32m form, **not** a generic
> `5…` SS58 string. A device/host must render `Q1…` so a user can match what their
> wallet shows.

## Architecture

```
src/
  pq/                     ← post-quantum primitives
    schemes.ts            scheme registry (SPHINCS+=0, Falcon=1, Dilithium=2; sizes, NIST ids)
    qsignature.ts         on-chain QSignature envelope codec (+ SCALE compact) — tested
    keygen.ts             PQ key-gen + signing via qweb3.js (adapter)
  logic/
    address.ts            Q-branded Bech32m + hex H160 codec — tested
    transaction/
      signTransaction.ts  craft payload (CheckMetadataHash enabled) → sign → serialize
  network/node.ts         q_ JSON-RPC client
  signer/
    softwareSigner.ts     reference signer (qweb3.js) — produces REAL valid signatures
    deviceSigner.ts       device contract + APDU placeholder (the app-quantova target)
  config.ts / constants.ts  QTOV/TQTOV, 18 decimals, ss58, metadata-hash params
```

### Key-gen & signing flow (qweb3.js)

Quantova's **qweb3.js** SDK (`@quantova/keyring`, `@quantova/util-crypto`,
`@quantova/falcon-wasm`) provides the audited PQ keyring and primitives used by every
Quantova signer. `pq/keygen.ts` wraps it behind a `QPair` contract; `signer/softwareSigner.ts`
implements the full `QuantovaSigner` with it, producing **valid `QSignature` envelopes the
chain accepts** — i.e. the byte-exact spec an on-device app must reproduce. Both the software
reference and a future device app are interchangeable behind the one `QuantovaSigner`
interface.

### Will it affect other Ledger assets? No.

The integration is purely additive and isolated at both layers (a new host package + a
sandboxed BOLOS device app). Full detail — including the device-app isolation model — is in
**[`docs/DEVICE-INTEGRATION.md`](./docs/DEVICE-INTEGRATION.md)**.

## Clear-signing readiness (RFC-78 / merkleized metadata)

Quantova's runtime integrates the `frame_metadata_hash_extension::CheckMetadataHash`
transaction extension (RFC-78), and release builds bake a metadata digest
(`enable_metadata_hash("QTOV", 18)`). This is the prerequisite the generic Polkadot
Ledger app uses to clear-sign Substrate extrinsics against a metadata hash. On Quantova
this extension is currently constructed in **disabled** mode for native transactions; it
would be set to **enabled** for the device-signed path so the device can verify
amount/asset/recipient instead of blind-signing.

## Open requirement — device-side post-quantum signing

The host module is functional, but the **signature itself must be produced on the Ledger
device**, and no Ledger device app today can produce a Dilithium / Falcon / SPHINCS+
signature. The `signer` contract here (`types/signer.ts`) defines exactly what the device
app must return:

```ts
getAddress(path):  { publicKey /* PQ pubkey */, address /* Q1… */ }
signTransaction(path, payload):  QSignature   // SPHINCS | FALCON | DILITHIUM
```

We understand from Ledger's published research that PQ signing on the current Secure
Element is constrained (RAM, signing time, side-channel hardening) and that Ledger's
direction is **hybrid (classical + PQ) signing**. We are flexible on the path and would
value Ledger's guidance:

1. a dedicated `app-quantova` device app implementing one or more PQ schemes (Dilithium
   is the most SE-friendly of the three), and/or
2. a **hybrid** account option, where the chain accepts a classical Ledger signature
   alongside a PQ co-signature, aligned with Ledger's hybrid roadmap, and/or
3. extending the generic Polkadot app once a PQ scheme is available on-device.

Until one of those exists, this module cannot complete an end-to-end signature; it is
intentionally a draft and a starting point for that collaboration.

## References

- Quantova runtime `CheckMetadataHash` wiring: `runtime/src/lib.rs`,
  `runtime/build.rs`, `runtime/src/qvm_tx.rs`.
- Quantova address derivation: `primitives/account` (`QSigner`, `QSignature`).
- RFC-78 merkleized metadata: paritytech/polkadot-sdk #4274.
