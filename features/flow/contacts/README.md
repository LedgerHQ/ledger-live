# @features/flow-contacts

> [!CAUTION] > **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Contacts flow package for Desktop and Mobile.

## Scope

- Feature-flag configuration (`useContactsFeature`, resolvers)
- `useContacts` and `useContactsMeContact` hooks (`@domain/entity-contact`)
- Empty contact detail selection and native presentation
- `useAddContactViewModel` and `useContactsFeatureIntroductionState` (app wiring injects ports)
- Add Address session state
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

## Public API

Consume the package from `@features/flow-contacts`. The root entry point resolves to the
appropriate Web or React Native API. Folders under `src/` are internal implementation details
and are not exported as package subpaths.

Each user-facing screen lives under `src/steps/` and follows the MVVM split used by the app
features (View + ViewModel + types + colocated components). Web and React Native export their
respective `ContactsListView` implementations through the root entry point. The native entry also
exports `ContactsAddContactHeaderButton` and `ContactDetailView` via the step `native.ts` barrels.

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
│   ├── AddAddress/                      # Shared eligible-network resolution and selection state
│   │   ├── model/                       # Production network resolver and MAD selection port
│   │   └── useAddAddressCurrencySelectionViewModel.ts / index.ts
│   ├── Introduction/                    # Feature intro + Ledger Sync intro (ex featureIntroduction)
│   │   ├── Feature/ (web dialog + native content) / LedgerSync/ (web dialog + native content)
│   │   ├── useContactsFeatureIntroductionState.ts / resolver.ts / ports.ts / constants.ts / types.ts
│   │   ├── internals/useSingleFireDismiss.ts
│   │   └── index.ts / web.ts / native.ts
│   └── Detail/                          # Native detail screen (consumed by Mobile)
│       ├── ContactDetailView.native.tsx / useEmptyContactDetail.ts / types.ts
│       ├── components/                  # Header, EmptyState, Avatar (native)
│       └── index.ts / native.ts
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
