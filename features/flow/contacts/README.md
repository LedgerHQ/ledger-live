# @features/flow-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Contacts orchestration through `ContactsView`. On Web it composes List, Detail, and
  Introduction. On Mobile it renders List, and the app mounts Contact Detail on its own screen.
- Cross-journey ports and analytics that connect Contact Detail to edit, delete, and add-address
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Contacts analytics contract: typed event/page names, payloads, and
  `createContactsAnalyticsHelper()` for apps to inject their `track` functions

App layers own routing, screen composition, i18n, and analytics adapters (`track` /
`trackPage`). Flow-specific tracking contracts and helpers live in this package; shared global
analytics properties come from `@features/platform-contacts`.

## Public API

Consume the complete Contacts aggregate from `@features/flow-contacts`. Both Desktop and Mobile use
the root `ContactsView` export; the package resolves its Web or React Native implementation.
Folders under `src/` are internal implementation details and are not exported as package subpaths.

`@features/flow-contacts-list` remains a public leaf flow for consumers that only need a contact
list. It never imports this orchestrator. `ContactsView` is the appropriate API when the screen
also needs Contact Detail or introductions.

`@features/flow-contacts-detail` owns the Contact Detail journey. Desktop and Mobile import that
leaf directly. This aggregate composes `ContactDetailView` on Web and keeps the ports and analytics
that connect Detail to the other journeys.

`@features/flow-contacts-introduction` owns the Feature Introduction and Ledger Sync Introduction
journeys. Applications that mount their hooks, helpers, or native content directly import that leaf
instead of this orchestrator.

`@features/flow-contacts-add-address` owns the Add address journey. Applications import this leaf
directly when they mount its dialog or drawer content. Contacts feature configuration and eligible
network resolution are provided by `@features/platform-contacts`.

`@features/flow-contacts-edit-contact` owns the Edit contact journey. Applications import its Web
dialog or Native drawer directly; the aggregate composes its state with Contact Detail.

`@features/flow-contacts-edit-address` owns the Edit address journey. Applications import its Web
dialog or Native drawer directly; the aggregate composes its state with Contact Detail.

`@features/flow-contacts-delete-contact` owns Contact deletion. Applications import its Web dialog
or Native drawer directly; the aggregate coordinates its invocation from Contact Detail.

`@features/flow-contacts-delete-address` owns address deletion. Applications import its Web dialog
or Native drawer directly; Contact Detail coordinates when the journey opens.

Web and React Native export `ContactsView` through the root entry point. Mobile imports
`ContactsAddContactHeaderButton` from `@features/flow-contacts-list/native`. Contact Detail
rendering lives in `@features/flow-contacts-detail`.

## Testing

- **Component behavior**: test in this package (see `features/flow/README.md` for the cross-flow testing strategy).
- **Mobile Jest entry**: `src/jest.native.ts` re-exports the native Flow API used by Mobile integration tests. Mobile Jest maps `@features/flow-contacts` to this entry via `moduleNameMapper`.
- **App wiring**: mobile `__integrations__` tests render the Flow components and mock only app-owned external wiring when required.

## Structure

Journey screens live in their own flow packages. This package composes those leaves and keeps the
hooks that connect them.

```
src/
├── ContactsView.web.tsx                 # orchestrates List, Detail, and Introduction
├── ContactsView.native.tsx              # renders List
├── ContactsView.types.ts
├── components/                          # Cross-journey shared UI
│   └── ContactsButton/                  # My Wallet entry (web + native)
├── hooks/                               # Orchestration hooks
├── analytics/                           # Typed tracking contract + helper
├── jest.native.ts                       # Mobile Jest entry (re-exports ./index.native)
├── index.ts                             # Web public API
└── index.native.ts                      # React Native public API
```

`@features/flow-contacts-add-contact` owns the Add contact journey. Applications import this leaf
directly when they mount its dialog or drawer content.

`@features/flow-contacts-introduction` owns both introduction journeys and is composed by
`ContactsView` on Web.

`@features/platform-contacts` owns `ContactAvatar`: flows and applications consume it from the
package root for a Me profile image or a saved-contact avatar with deterministic color and Unicode
initial. The target platform configuration resolves its implementation.
