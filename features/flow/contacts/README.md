# @features/flow-contacts

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContactsMeContact` hook (`@domain/entity-contact`)
- Shared UI components (`.web.tsx` / `.native.tsx`)

App layers own routing, screen composition, i18n, and analytics.

## Structure

```
src/
├── components/
│   ├── ContactsButton/   # My Wallet entry
│   └── ContactsPage/     # Page content + platform-specific actions
├── hooks/
├── featureFlags.ts
└── index.ts
```
