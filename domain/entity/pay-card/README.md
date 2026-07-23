# @domain/entity-pay-card

Domain entity package for Ledger Pay Card data and Redux state.

- `schema.ts` — canonical Pay Card schemas for providers, pre-auth data, sessions, users, logout results, and flow params.
- `types.ts` — inferred Pay Card entity and slice types.
- `slice.ts` — Redux slice for opening and closing the Pay Card flow.
- `schema.mock.ts` — reusable mock factories for tests.

This is the app-facing model. Raw Pay Card API wire-format schemas, endpoint definitions, and mock transport live in `@domain/api-pay-card`.
