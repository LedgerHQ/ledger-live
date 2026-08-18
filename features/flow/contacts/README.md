# @features/flow-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContacts` and `useContactsMeContact` hooks (`@domain/entity-contact`)
- Empty contact detail selection and presentation
- Populated contact detail view model (address rows, count, and open-detail intents)
- Contact detail edit/delete scenario state (edit intent, delete intent, and delete lifecycle)
- Contact address detail view model (selected address payload, QR payload string, and not-found state)
- Contact address detail quick-action scenario state (send, edit, and delete intents with delete lifecycle)
- Contacts orchestration through `ContactsView`, which composes List, Detail, and Introduction
  journeys
- Add Address session, address-entry validation state, and address-label state
- Prefill Add Address entry (`startWithPrefilled` / `OpenPrefillAddAddressParams`) that bypasses
  MAD and address entry and starts on the naming screen
- Add Address network eligibility and final currency selection state (MAD integration uses an
  injected selection port)
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Contact detail composition; Platform Contacts owns the reusable Contact avatar, including the
  app-owned "Me" profile image
- Contacts analytics contract: typed event/page names, payloads, and
  `createContactsAnalyticsHelper()` for apps to inject their `track` functions
- Compatibility exports for `@features/flow-contacts-add-contact`

App layers own routing, screen composition, i18n, and analytics adapters (`track` /
`trackPage`). Flow-specific tracking contracts and helpers live in this package; shared global
analytics properties come from `@features/platform-contacts`.

For Add Address, the Flow resolves ordered production network IDs from
`eligibleAddressFamilies` and sends only those IDs to MAD. The consuming adapter filters MAD content
by native network ID or token parent network ID. The Flow stores the final crypto-or-token
`currencyId` and uses its display name as the default address label after asset and optional network
selection. MAD is not opened when no production network matches the feature-flag families.

After a successful selection, the session retains the selected contact and final currency
identifiers and moves to `enteringAddress`. It also retains the selected contact's existing address
labels so the naming step can reject a duplicate for that contact. Labels are compared after
trimming, Unicode normalization, and case folding, while the user's casing is preserved for the
saved value. Native address-label input is limited to 32 characters. An empty label has no validation error but cannot continue. The `AddAddress` step owns
its injected validation port, currency and token resolution, domain orchestration, input methods,
asynchronous validation state, resolved-address storage, and stale-result protection. Consuming
apps adapt coin bridges, domain services, token stores, and other app-owned or platform-specific
integrations.

The native Add Address views render the shared address-entry and address-name states plus temporary
Validation and Success steps as composable Lumen bottom-sheet content. The Flow owns their order,
back transitions, resolved-address session and valid-only confirmation. Mobile owns the single
queued bottom-sheet container, currency-selection adapter, translations, keyboard behavior, scanner
routing and safe-area inset. Native paste events are classified without reading the clipboard
proactively, while manual validation can be debounced without delaying paste or QR validation.

## Public API

Consume the complete Contacts page from `@features/flow-contacts`. Both Desktop and Mobile use
the root `ContactsView` export; the package resolves its Web or React Native implementation.
Folders under `src/` are internal implementation details and are not exported as package subpaths.

`@features/flow-contacts-list` remains a public leaf flow for consumers that only need a contact
list. It never imports this orchestrator. `ContactsView` is the appropriate API when the screen
also needs Contacts Detail or introductions.

`@features/flow-contacts-introduction` owns the Feature Introduction and Ledger Sync Introduction
journeys. Applications that mount their hooks, helpers, or native content directly import that leaf
instead of this orchestrator.

Each user-facing screen owned by this package lives under `src/steps/` and follows the MVVM split used by the app
features (View + ViewModel + types + colocated components). Web and React Native export their
respective `ContactsView` and `ContactDetailView` implementations through the root entry point.
The native entry also exports `ContactsAddContactHeaderButton` via the List leaf flow.

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
│   ├── AddAddress/                      # Shared address-entry flow and native step content
│   │   ├── model/                       # Network resolver, MAD port and address validation
│   │   └── ContactsAddAddressEntry.native.tsx / ContactsAddAddressPlaceholderView.native.tsx / useAddAddressFlowViewModel.ts / types.ts / index.ts
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
├── featureFlags.ts
├── index.ts                             # Web public API
└── index.native.ts                      # React Native public API
```

`@features/flow-contacts-add-contact` owns the Add contact step. This package re-exports its
public API as a compatibility façade while the remaining Contacts journeys are extracted.

`@features/flow-contacts-introduction` owns both introduction journeys and is composed by
`ContactsView` on Web.

`@features/platform-contacts` owns `ContactAvatar`: flows and applications can consume it directly
for a Me profile image or a saved-contact avatar with deterministic color and Unicode initial.
