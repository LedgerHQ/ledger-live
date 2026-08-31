# @features/flow-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Contacts orchestration through `ContactsView`, which composes List, Detail, and Introduction
  journeys
- Detail/Edit contact and Detail/Edit address orchestration bindings
- Shared entry UI and typed analytics contract
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
also needs Contacts Detail or introductions.

`@features/flow-contacts-detail` owns the reusable Contact Detail journey. Applications import its
views, Detail hooks, types, and dialog or drawer content directly when they mount Detail outside
the aggregate. This package owns only the bindings that coordinate Detail with the independent Edit
contact and Edit address leaf flows.

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

The aggregate exposes `ContactsView` for the complete screen. The native entry also exports
`ContactsAddContactHeaderButton` via the List leaf flow.

## Testing

- **Component behavior**: test in this package (see `features/flow/README.md` for the cross-flow testing strategy).
- **Mobile Jest entry**: `src/jest.native.ts` re-exports the native Flow API used by Mobile integration tests. Mobile Jest maps `@features/flow-contacts` to this entry via `moduleNameMapper`.
- **App wiring**: mobile `__integrations__` tests render the Flow components and mock only app-owned external wiring when required.

## Structure

Each `steps/<Step>/` is an MVVM screen: `index.ts` (neutral barrel) + `web.ts` / `native.ts`
(platform Views) + `XxxView.web/.native.tsx` (dumb View) + `types.ts` + colocated `components/`,
mirroring the app `mvvm/features/*` folders. View-model logic lives at the step root for small
steps or is grouped into `model/` (pure builders) and `hooks/` (React hooks)
for larger steps (e.g. `List`). Every folder under `components/` is a PascalCase UI concept; a
"block" owns its sub-parts as nested folders.

```
src/
├── ContactsView.web/.native.tsx         # orchestrates List, Detail and introductions
├── ContactsView.types.ts
├── detailOrchestration/                 # coordinates Detail with independent Edit leaf flows
├── components/                          # Aggregate entry UI
│   ├── ContactsButton/                  # My Wallet entry (web + native)
├── hooks/                               # Contacts flow-only hooks
├── utils/                               # Contacts flow-only utilities
├── analytics/                           # Typed tracking contract + helper
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
