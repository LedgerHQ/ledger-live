# @features/flow-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Empty contact detail selection and presentation
- Populated contact detail view model (address rows, count, and open-detail intents)
- Contact detail edit/delete scenario state (edit intent, delete intent, and delete lifecycle)
- Contact address detail view model (selected address payload, QR payload string, and not-found state)
- Contact address detail quick-action scenario state (send, edit, and delete intents with delete lifecycle)
- Contacts orchestration through `ContactsView`, which composes List, Detail, and Introduction
  journeys
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Contact detail composition; Platform Contacts owns the reusable Contact avatar, including the
  app-owned "Me" profile image
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

Each user-facing screen owned by this package lives under `src/steps/` and follows the MVVM split
used by the app features (View + ViewModel + types + colocated components). Web and React Native
export their respective `ContactsView` and `ContactDetailView` implementations through the root
entry point. The native entry also exports `ContactsAddContactHeaderButton` via the List leaf flow.

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
├── ContactsView.web/.native.tsx         # orchestrates List with parent-owned journeys
├── ContactsView.types.ts
├── steps/
│   └── Detail/                          # Contact detail (web + native)
│       ├── ContactDetailView.web/.native.tsx / useEmptyContactDetail.ts / usePopulatedContactDetail.ts / useContactAddressDetail.ts / useContactAddressDetailActionsViewModel.ts / types.ts
│       ├── model/                       # empty + populated + address detail + quick-action builders
│       ├── components/                  # Header, EmptyState and detail-specific UI
│       └── index.ts / web.ts / native.ts
├── components/                          # Cross-step shared UI
│   ├── ContactsButton/                  # My Wallet entry (web + native)
├── hooks/                               # Contacts flow-only hooks
├── utils/                               # Contacts flow-only utilities
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
