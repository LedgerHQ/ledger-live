# @features/flow-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Contacts orchestration through `ContactsView`. On Web it composes List and Detail. On Mobile it
  renders List, and the app mounts Contact Detail on its own screen.
- Cross-journey ports and analytics that connect Contact Detail to edit, delete, and add-address
- Shared UI components (`ContactsView`, `ContactsButton`) with platform implementations resolved
  from the single `.` entry
- Contacts analytics contract: typed event/page names, payloads, and
  `createContactsAnalyticsHelper()` for apps to inject their `track` functions

App layers own routing, screen composition, i18n, analytics adapters (`track` / `trackPage`), and
mounting of Feature Introduction and Ledger Sync Introduction UI (outside `ContactsView`, as on
Mobile today). Flow-specific tracking contracts and helpers live in this package; shared global
analytics properties come from `@features/platform-contacts`.

## Public API

Import from `@features/flow-contacts` only through the `.` entry (`src/index.ts`). TypeScript and
bundlers resolve `ContactsView` and `ContactsButton` to the matching `.web.tsx` or `.native.tsx`
implementation.

| Export | Contract |
| --- | --- |
| `ContactsView` | `ContactsViewProps` in `ContactsView.types.ts` |
| `ContactsButton` | `ContactsButtonProps` in `components/ContactsButton/ContactsButton.types.ts` |

Folders under `src/` are internal unless re-exported by the root barrel.

`@features/flow-contacts-list` remains a public leaf for list view models and list UI. Consumers
that only need list logic import it directly. `ContactsView` is the API when the screen also needs
Contact Detail composition on Web.

`@features/flow-contacts-detail` owns the Contact Detail journey. Desktop and Mobile import that
leaf directly. This package composes `ContactDetailView` on Web and keeps the ports and analytics
that connect Detail to the other journeys.

`@features/flow-contacts-introduction` owns the Feature Introduction and Ledger Sync Introduction
journeys. Applications mount those dialogs or sheets at the screen layer; they are not props on
`ContactsView`.

`@features/flow-contacts-add-address` owns the Add address journey. Applications import this leaf
directly when they mount its dialog or drawer content. Contacts feature configuration and eligible
network resolution are provided by `@features/platform-contacts`.

`@features/platform-contacts` provides `useContacts`, `useContactsMeContact`, and related hooks.
This package no longer re-exports them.

## Testing

- **Component behavior**: Jest in this package (see `features/flow/README.md`).
- **App wiring**: app `__integrations__` tests cover navigation, feature flags, and screen
  composition. Mobile resolves `@features/flow-contacts` through the package export map like other
  dual-platform flow packages.

## Structure

```
src/
├── index.ts                             # single public entry
├── ContactsView.web.tsx                 # List + Detail on Web
├── ContactsView.native.tsx              # List on Native
├── ContactsView.types.ts                # ContactsViewProps
├── components/
│   └── ContactsButton/                  # My Wallet entry + ContactsButtonProps
├── hooks/                               # Orchestration hooks
├── analytics/                           # Typed tracking contract + helper
└── ledgerSync/
```

Journey screens live in their own flow packages. This package composes those leaves and keeps the
hooks that connect them.
