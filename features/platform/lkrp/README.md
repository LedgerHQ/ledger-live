# `@features/platform-lkrp`

> [!CAUTION]
> **Status: UNSTABLE** — The Wallet integration is a migration shell and its API may change.

Wallet-owned composition for `@shared/lkrp`.

The package creates an LKRP SDK from injected crypto, storage, backend and optional device
adapters. It must not import or re-export the legacy `@ledgerhq/ledger-key-ring-protocol` package.
Applications remain the composition root while the existing SDK is migrated.

Also exposes unimplemented Wallet adapters: `createHwDeviceLayer` (APDU / Trusted App) and
`createLkrpIdentityProvider` (Keycloak broker `lkrp`). JWT issuance stays in LedgerAuth;
persistence stays in `@domain/entity-trustchain`.

Cloud Sync orchestration remains in `@features/platform-wallet-sync`.
