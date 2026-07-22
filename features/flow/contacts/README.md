# @features/flow-contacts

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContacts` and `useContactsMeContact` hooks (`@domain/entity-contact`)
- `useAddContactViewModel` and `useContactsFeatureIntroductionState` (app wiring injects ports)
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
- **Mobile Jest entry**: `src/jest.native.ts` re-exports the native Flow API used by Mobile integration tests. Mobile Jest maps `@features/flow-contacts` to this entry via `moduleNameMapper`.
- **App wiring**: mobile `__integrations__` tests spread `jest.requireActual("@features/flow-contacts")` and overlay lightweight UI stubs for Lumen RN components.

## Structure

```
src/
├── components/
│   ├── ContactsButton/                  # My Wallet entry
│   └── ContactsLedgerSyncIntroduction/  # Shared Ledger Sync introduction content
├── add/
│   ├── model/            # Contact-name validation and creation contract
│   └── drawer/           # Native drawer state and presentation
├── featureIntroduction/  # One-time feature intro preference + Ledger Sync priority
├── hooks/
├── list/                 # Shared list view models and page shells
│   ├── components/
│   │   ├── ContactsList/         # Web only
│   │   ├── ContactsPage/         # Web page and Ledger Sync loading variants
│   │   └── ContactsPageLayout/   # Web only
│   ├── web.ts            # Web ContactsPage export
│   └── native.ts         # Native ContactsPage + header button exports
├── jest.native.ts        # Mobile Jest logic-only entry
├── featureFlags.ts
├── index.ts              # Web public API
└── index.native.ts       # React Native public API
```
