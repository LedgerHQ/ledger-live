# @features/flow-contacts

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContactsMeContact` hook (`@domain/entity-contact`)
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Empty Contacts list view model

App layers own routing, screen composition, i18n, and analytics.

## Public API

Consume the package from `@features/flow-contacts`. The root entry point resolves to the
appropriate Web or React Native API. Folders under `src/` are internal implementation details
and are not exported as package subpaths.

## Structure

```
src/
├── components/
│   ├── ContactsButton/   # My Wallet entry
│   └── ContactsPage/     # Add contact button, Me row
├── hooks/
├── list/                 # Shared list view models
├── featureFlags.ts
└── index.ts
```
