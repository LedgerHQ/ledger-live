# @features/flow-contacts

> [!CAUTION] > **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContacts` and `useContactsMeContact` hooks (`@domain/entity-contact`)
- Empty contact detail selection and presentation
- Populated contact detail view model (address rows, count, and open-detail intents)
- Contact detail edit/delete scenario state (edit intent, delete intent, and delete lifecycle)
- Contact address detail view model (selected address payload, QR payload string, and not-found state)
- Contact address detail quick-action scenario state (send, edit, and delete intents with delete lifecycle)
- `useAddContactViewModel` and `useContactsFeatureIntroductionState` (app wiring injects ports)
- Add Address session and address-entry validation state
- Add Address network eligibility and final currency selection state (MAD integration uses an
  injected selection port)
- Shared UI components (`.web.tsx` / `.native.tsx`)
- Empty, populated, and search Contacts list view models and their Desktop and Mobile page shells

App layers own routing, screen composition, i18n, and analytics.

For Add Address, the Flow resolves ordered production network IDs from
`eligibleAddressFamilies` and sends only those IDs to MAD. The consuming adapter filters MAD content
by native network ID or token parent network ID. The Flow stores only the final crypto-or-token
`currencyId` returned after asset and optional network selection. MAD is not opened when no
production network matches the feature-flag families.

After a successful selection, the session retains the selected contact and final currency
identifiers and moves to `enteringAddress`. The `AddAddress` step owns its injected validation
port, currency and token resolution, domain orchestration, input methods, asynchronous validation
state, resolved-address storage, and stale-result protection. Consuming apps adapt coin bridges,
domain services, token stores, and other app-owned or platform-specific integrations.

The native Add Address views render the shared address-entry states and temporary Name, Validation,
and Success steps as composable Lumen bottom-sheet content. The Flow owns their order, back
transitions, resolved-address session and valid-only confirmation. Mobile owns the single queued
bottom-sheet container, currency-selection adapter, translations, keyboard behavior, scanner
routing and safe-area inset. Native paste events are classified without reading the clipboard
proactively, while manual validation can be debounced without delaying paste or QR validation.

## Public API

Consume the package from `@features/flow-contacts`. The root entry point resolves to the
appropriate Web or React Native API. Folders under `src/` are internal implementation details
and are not exported as package subpaths.

Each user-facing screen lives under `src/steps/` and follows the MVVM split used by the app
features (View + ViewModel + types + colocated components). Web and React Native export their
respective `ContactsListView` and `ContactDetailView` implementations through the root entry point. The native entry also
exports `ContactsAddContactHeaderButton` via the step `native.ts` barrels.

## Testing

- **Component behavior**: test in this package (see `features/flow/README.md` for the cross-flow testing strategy).
- **Mobile Jest entry**: `src/jest.native.ts` re-exports the native Flow API used by Mobile integration tests. Mobile Jest maps `@features/flow-contacts` to this entry via `moduleNameMapper`.
- **App wiring**: mobile `__integrations__` tests render the Flow components and mock only app-owned external wiring when required.

## Structure

Each `steps/<Step>/` is an MVVM screen: `index.ts` (neutral barrel) + `web.ts` / `native.ts`
(platform Views) + `XxxView.web/.native.tsx` (dumb View) + `types.ts` + colocated `components/`,
mirroring the app `mvvm/features/*` folders. View-model logic lives at the step root for small
steps (e.g. `AddContact`) or is grouped into `model/` (pure builders) and `hooks/` (React hooks)
for larger steps (e.g. `List`). Every folder under `components/` is a PascalCase UI concept; a
"block" owns its sub-parts as nested folders.

```
src/
├── steps/
│   ├── List/                            # Contacts home screen (ex list/ + page/)
│   │   ├── ContactsListView.web/.native.tsx  # dumb Views + types.ts
│   │   ├── model/                       # viewModel.ts (pure list/search view-model builders)
│   │   ├── hooks/                       # useContactsListViewModel / useContactsSearchViewModel
│   │   ├── components/                  # one PascalCase folder per UI concept
│   │   │   ├── ContactsList/            # list block: ListItems/ + Search/ + Section/
│   │   │   ├── ListHeader/              # native header + add-contact button
│   │   │   ├── LedgerSyncLoadingPane/   # web loading pane
│   │   │   └── PageLayout/              # web page layout (Header, ListPane, DetailPane)
│   │   ├── utils/                       # createContactsListSections, getContactAvatarColorClass
│   │   └── index.ts / web.ts / native.ts
│   ├── AddContact/                      # Web dialog + native drawer
│   │   ├── ContactsAddContactDialog.web.tsx / ContactsAddContactDrawer.native.tsx
│   │   ├── useAddContactViewModel.ts / useAddContactDrawerViewModel.ts / types.ts
│   │   ├── components/ContactNameInput/ (web + native)
│   │   ├── model/                       # Contact-name validation and creation contract
│   │   └── index.ts / web.ts / native.ts
│   ├── AddAddress/                      # Shared address-entry flow and native step content
│   │   ├── model/                       # Network resolver, MAD port and address validation
│   │   └── ContactsAddAddressEntry.native.tsx / ContactsAddAddressPlaceholderView.native.tsx / useAddAddressFlowViewModel.ts / types.ts / index.ts
│   ├── Introduction/                    # Feature intro + Ledger Sync intro (ex featureIntroduction)
│   │   ├── Feature/ (web dialog + native content) / LedgerSync/ (web dialog + native content)
│   │   ├── useContactsFeatureIntroductionState.ts / resolver.ts / ports.ts / constants.ts / types.ts
│   │   ├── internals/useSingleFireDismiss.ts
│   │   └── index.ts / web.ts / native.ts
│   └── Detail/                          # Contact detail (web + native)
│       ├── ContactDetailView.web/.native.tsx / useEmptyContactDetail.ts / usePopulatedContactDetail.ts / useContactAddressDetail.ts / useContactAddressDetailActionsViewModel.ts / types.ts
│       ├── model/                       # empty + populated + address detail + quick-action builders
│       ├── components/                  # Header, EmptyState, Avatar (web + native)
│       └── index.ts / web.ts / native.ts
├── components/                          # Cross-step shared UI
│   ├── ContactsButton/                  # My Wallet entry (web + native)
│   └── ContactAvatar/                   # Shared native list and detail avatar
├── hooks/                               # useContacts, useContactsMeContact
├── utils/                               # getContactInitial (shared List + AddContact)
├── jest.native.ts                       # Mobile Jest entry (re-exports ./index.native)
├── featureFlags.ts
├── index.ts                             # Web public API
└── index.native.ts                      # React Native public API
```
