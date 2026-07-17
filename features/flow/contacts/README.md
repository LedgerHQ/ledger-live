# @features/flow-contacts

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContactsMeContact` hook (`@domain/entity-contact`)
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Empty and populated Contacts list view models and the Desktop Contacts page shell

App layers own routing, screen composition, i18n, and analytics.

## Public API

Consume the package from `@features/flow-contacts`. The root entry point resolves to the
appropriate Web or React Native API. Folders under `src/` are internal implementation details
and are not exported as package subpaths.

Web exports the full `ContactsPage` (with list) via `list/web.ts`. React Native exports the
entry page shell (`ContactsPageContent`) and `ContactsAddContactHeaderButton` via
`list/native.ts`.

## Testing

- **Component behavior**: test in this package (see `features/flow/README.md` for the cross-flow testing strategy).
- **Mobile Jest stub**: `src/jest.native.ts` re-exports logic only (feature flags, hooks, list view models). Mobile Jest maps `@features/flow-contacts` to this entry via `moduleNameMapper`.
- **App wiring**: mobile `__integrations__` tests spread `jest.requireActual("@features/flow-contacts")` and overlay lightweight UI stubs for Lumen RN components.

## Structure

```
src/
├── components/
│   └── ContactsButton/   # My Wallet entry
├── hooks/
├── list/                 # Shared list view models and page shells
│   ├── components/
│   │   ├── ContactsList/         # Web only
│   │   ├── ContactsPage/
│   │   └── ContactsPageLayout/   # Web only
│   ├── web.ts            # Web ContactsPage export
│   └── native.ts         # Native page shell + header button exports
├── jest.native.ts        # Mobile Jest logic-only entry
├── featureFlags.ts
├── index.ts              # Web public API
└── index.native.ts       # React Native public API
```
