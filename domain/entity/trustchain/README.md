# `@domain/entity-trustchain`

> [!CAUTION]
> **Status: UNSTABLE** — Persisted Trustchain instance state is being extracted from the legacy LKRP SDK.

Canonical Wallet state for a local Trustchain membership: the protocol identity (`rootId`,
`applicationPath`) and an opaque member key handle (`id`, compressed public key). Private keys and
Ledger Sync encryption secrets are not stored here.

This replaces `libs/ledger-key-ring-protocol/src/store.ts`. Apps remain the composition root for the
reducer and persistence. The LKRP SDK in `@shared/lkrp` produces Trustchain values; this entity
stores them.
