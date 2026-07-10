# @features/platform-contacts

Scenario-oriented platform contracts for Contacts.

This package defines the dependency-injection boundary consumed by shared Contacts flows. It is intentionally not a generic CRUD service and it is not shaped after WalletSync, device, Redux, or analytics internals. Real adapters will map these ports to those systems later.

## Scope

- Contacts list and search loading.
- Contact detail loading.
- Contact creation without address validation.
- Add-address supported currency ids, candidate validation, preparation, and confirmed-result application.
- Contact and address edit confirmation boundaries.
- Ledger Sync gating boundary.
- Contacts tracking dispatch boundary.

Asset and network selection UI stays owned by MAD. Contacts should pass supported currency ids to MAD when filtering is needed, then consume the selected currency id returned by the app/flow wiring.

It does not implement mock adapters, tests, UI, app routing, Redux slices, WalletSync persistence, real device actions, signer payloads, or analytics transport.
