# @domain/api-pay-card

Domain API client for the Ledger Pay Card authentication and session endpoints.

The package owns the Pay Card API wire contracts, RTK Query endpoints, transforms, and mock
transport used by local feature development. Runtime configuration is injected through the Redux
thunk `extraArgument` with `payCardApiExtra`, so the domain package does not depend on app
environment or configuration modules.

The app-facing Pay Card entities live in `@domain/entity-pay-card`; this package validates raw API
payloads and maps them to those canonical types.

## Exports

- `payCardApi` and its generated authentication/session hooks
- `payCardApiExtra` and `PayCardApiExtra` for app-side store configuration
- Pay Card request, wire response, transform, and error contract types
