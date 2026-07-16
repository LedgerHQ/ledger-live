# @features/flow-contacts

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContactsMeContact` hook (`@domain/entity-contact`)
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Empty, populated, and search Contacts list view models and their Desktop and Mobile page shells

App layers own routing, screen composition, i18n, and analytics.

## Public API

Consume the package from `@features/flow-contacts`. The root entry point resolves to the
appropriate Web or React Native API. Folders under `src/` are internal implementation details
and are not exported as package subpaths.

Web and React Native export their respective `ContactsPage` implementations through the root
entry point. The native entry also exports `ContactsAddContactHeaderButton` via `list/native.ts`.

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
│   └── native.ts         # Native ContactsPage + header button exports
├── jest.native.ts        # Mobile Jest logic-only entry
├── featureFlags.ts
├── index.ts              # Web public API
└── index.native.ts       # React Native public API
```
