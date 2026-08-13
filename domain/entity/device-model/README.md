# @domain/entity-device-model

> [!CAUTION]
> **Status: UNSTABLE** — Canonical device-model vocabulary introduced for the DDD migration.

Defines the canonical `DeviceModelId` schema and type used by new-architecture packages.

## Why this is a domain entity

A Ledger device model is central product vocabulary, not a transport implementation detail. Its
identity drives UI choices such as device animations and illustrations, and UX behaviour such as
available features, onboarding paths, and device-flow steps. The concept is shared by multiple
features and remains meaningful independently of any specific connection transport, so it belongs
in the canonical domain layer.
