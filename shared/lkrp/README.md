# `@shared/lkrp`

> [!CAUTION]
> **Status: UNSTABLE** — Contracts only; no protocol implementation yet.

Ledger Key Ring Protocol SDK (ADR [Solution 2](https://github.com/LedgerHQ/architecture-as-code/pull/380)): one client entry point, optional injected device layer.

> [!IMPORTANT]
> **`shared/*` is temporary.** `@shared/lkrp` is a private monorepo home while the API is unstable. It is **not** the long-term package. Once the contracts settle, this SDK becomes a **public library in Ledger `ts-libs`**. Do not treat the `shared/` path or the `@shared/lkrp` name as the published surface.

## Layers

```mermaid
flowchart TB
  apps[apps wallet-cli web-tools]
  glue["@features/platform-lkrp"]
  qr["@features/platform-lkrp-qr"]
  entity["@domain/entity-trustchain"]
  ws["@features/platform-wallet-sync"]
  cloud["@shared/cloud-sync"]
  sdk["@shared/lkrp then ts-libs public"]
  crypto[LkrpCrypto KeyStore]
  http[TrustchainBackend]
  device[LkrpDeviceLayer optional]
  auth[LkrpAuthorization JWT out of SDK]
  apps --> glue
  apps --> qr
  apps --> entity
  glue --> sdk
  qr --> sdk
  entity -.->|stores SDK identity| sdk
  ws --> cloud
  cloud -.->|protocol identity only| sdk
  sdk --> crypto
  sdk --> http
  http --> auth
  sdk --> device
```

```mermaid
flowchart LR
  subgraph inScope [SDK]
    tree[Nodes Streams Blocks]
    backend[Trustchain HTTP]
    keys[Opaque local keys]
  end
  subgraph outScope [Not SDK]
    jwt[JWT OIDC]
    apdu[APDU TLV DMK]
    qrPair[QR pairing]
    sync[Cloud Sync datamodel]
    redux[Redux entity]
  end
```

## Shell

Instantiable today: `LkrpSdk`, `createTrustchainHttpBackend`, `createCommandStreamCodec`, `createSoftwareDeviceLayer`, `createMockLkrpSdk`. Protocol methods reject with `LkrpNotImplementedError`. Private keys never leave `LkrpKeyStore`.

```ts
const sdk = new LkrpSdk({ crypto, keyStore, backend, device: trustedApp });
```

Wallet glue: `@features/platform-lkrp`. QR: `@features/platform-lkrp-qr`. Persisted instance: `@domain/entity-trustchain`.
