---
"@domain/entity-currency": minor
"@domain/entity-currency-crypto": minor
"@domain/entity-currency-fiat": minor
"@domain/entity-currency-token": minor
"@domain/entity-currency-unit": minor
"@shared/feature-flags": minor
"@shared/schema-primitives": minor
"@features/market-banner": minor
---

Enforce module boundaries on the new architecture (`domain/`, `shared/`, `features/`) via a pure Nx project-graph validator (LIVE-29780). The project-tags plugin now infers `scope:domain`, `scope:shared`, `type:domain-entity`, and `type:domain-api`; a cacheable `lint:boundaries` Nx target walks the graph and fails CI on any workspace→workspace edge that violates the layered rules (shared leaf, domain depends on shared, features depend on domain+shared, entities cannot import APIs). No ESLint involvement — stays aligned with the ongoing oxlint migration; config ports verbatim to `.oxlintrc.json` when `@nx/oxlint` publishes stable.
