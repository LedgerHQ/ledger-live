---
name: flow-package
description: |
  The anatomy of a `features/flow/<name>` package: MVVM for every screen, flat `src/` or
  `screens/<Screen>/`, flow state versus entity state, local routing, and where `copy/`, `logic/`,
  `model/`, `types.ts` and `exports.ts` go. Use when creating or editing a package under
  `features/flow/**`, or when reviewing its folder layout.
---

# Flow package anatomy

A `@features/flow-<name>` package holds one user-facing flow that both apps compose. Where the
package sits among the layers is [structure-flow](../structure-flow/SKILL.md); how its barrels
work is [package-public-api](../package-public-api/SKILL.md). This skill covers what goes inside
`src/`. Every rule names a package on `develop` to copy from; the full trees are in
[references/examples.md](references/examples.md).

## MVVM is the convention

Every flow package is MVVM, with no exception: each screen, and each component with its own state,
is a `useXViewModel.ts` plus `XView.web.tsx` / `XView.native.tsx`. The View renders its props
only: no store, navigation or query hook. The ViewModel and View rules are the
[mvvm-architecture](../mvvm-architecture/SKILL.md) ones; this skill does not restate them.

What is specific to a flow package:

- The View is split per platform, `XView.web.tsx` and `XView.native.tsx`, on one props type.
  Suffix the ViewModel too (`useXViewModel.web.ts`) only when the two platforms really differ.
- A component exported from a universal entry keeps one props contract on both platforms: see the
  [universal components ADR](../../../docs/adr/universal-components.md).

Example: `useCardViewModel.ts`, `CardView.web.tsx` and `CardView.native.tsx` in
`@features/flow-pay-card`; `useCardAssetsViewModel.ts` and `CardAssetsView.*.tsx` in
`@features/flow-pay-card-assets`. `view.web.tsx` in `@features/flow-fear-and-greed` predates the
naming rule: rename it when you touch it.

## One screen: flat `src/`

A flow with one screen keeps its files at the root of `src/`, with no `screens/` folder.

```text
src/
├── Card.tsx              # entry: wires the ViewModel to the View
├── Card.types.ts         # props of the entry and of the view
├── useCardViewModel.ts   # state, data and callbacks, no JSX
├── CardView.web.tsx      # web rendering
├── CardView.native.tsx   # native rendering
├── index.ts
└── index.native.ts
```

Example: `@features/flow-pay-card`. The entry is one line,
`<CardView {...useCardViewModel(props)} />`, and `./CardView` resolves to the `.web` or `.native`
file per platform.

## Several screens: `screens/<Screen>/`

A flow with several screens gives each one a folder under `screens/`, named after the screen in
PascalCase. A screen folder holds its entry, its ViewModel, its two Views and `types.ts` at its
root, plus a `components/` folder for what only that screen uses.

```text
src/screens/
├── Entry/
├── Review/
│   ├── Review.tsx              # <ReviewView {...useReviewViewModel(props)} />
│   ├── useReviewViewModel.ts
│   ├── ReviewView.web.tsx
│   ├── ReviewView.native.tsx
│   ├── types.ts
│   └── components/             # used by this screen only
└── Flow/                       # switches between the screens above
```

No package on `develop` follows this on both platforms yet. The closest is
`@features/flow-contacts-add-address`: copy its `screens/` and `screens/Flow/` layout, and its web
Review screen (`ContactsAddAddressReview.web.tsx`, `useContactsAddAddressReviewViewModel.web.ts`,
`ContactsAddAddressReviewView.web.tsx`). Known deviations, do not copy:

- `screens/Review/` and `screens/AddressName/` have no native MVVM split: the native screen is one
  file (`ContactsAddAddressReview.native.tsx`, `ContactsAddAddressName.native.tsx`) that calls its
  hooks and renders.
- `screens/AddressEntry/` keeps its ViewModel in a `viewModel/` subfolder and its entry and View in
  `components/`, instead of at the root of the screen folder.

`@features/flow-contacts-introduction` has no ViewModel at all; do not use it as an example.

Do not add `steps/`. Some older packages still have one (`@features/flow-app-unlock`,
`@features/flow-app-password-setup`): rename it to `screens/` when you touch the package.

## Flow state versus entity state

| State                                                     | Home                                | Example                                                       |
| --------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Business data several flows read (contacts, accounts)     | `domain/entity/<name>` slice        | `@domain/entity-contact`: `slice.ts`, `selectors.ts`          |
| Flow UI state the app registers or persists (a filter)    | `src/state/slice.ts`, `selectors.ts` | `@features/flow-pay-balance`: `state/`, exported as `./state` |
| Flow UI state that lives while the flow is open (a step)  | `src/state/` reducer used by React   | `@features/flow-contacts-add-address`: `state/addAddressFlowReducer.ts` |

- A flow slice holds what the flow alone decides, never a copy of entity data. Read entities
  through their selectors.
- Selectors live beside the slice and type their root as `{ <sliceName>: State }`, as in
  `@features/flow-pay-balance` `state/selectors.ts`.
- The app registers the reducer: `apps/ledger-live-desktop/src/renderer/reducers/index.ts` imports
  `payCardBalanceSlice` from `@features/flow-pay-balance/state`.

## Local routing

The flow owns moving between its own screens; the app owns navigation to and from the flow.

- Keep the current screen in flow state and switch on it in one component, as
  `screens/Flow/ContactsAddAddressFlowContent.native.tsx` does on the `step` from
  `state/addAddressFlowReducer.ts` in `@features/flow-contacts-add-address`.
- Take app navigation as callbacks or ports (`onClose`, `onSuccess`), never as a router import.
  External links the flow opens go in `urls.ts`, one value per platform
  (`@features/flow-contacts-add-address`).

## Where the other files go

| Path              | Holds                                                                                   | Example                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `copy/`           | Hooks that turn i18n keys into labels (`useXLabels`, `useXCopy`); no other logic         | `@features/flow-contacts-delete-address` `copy/useDeleteAddressLabels.ts` |
| `logic/`          | Pure functions: business rules, no React, no store                                      | `@features/flow-pay-balance` `logic/aggregateBalance.ts`                 |
| `model/`          | The lifecycle model (see below): pure state constructors, a controller and `ports.ts`, the dependencies the app injects | `@features/flow-contacts-delete-address` `model/`                         |
| `components/`     | UI pieces of the package's views; in a `screens/` package, UI one screen uses goes in `screens/<Screen>/components/` | `@features/flow-pay-balance` `components/`; `@features/flow-contacts-add-address` `screens/AddressEntry/components/` |
| `hooks/`          | React hooks shared by several screens or exported                                       | `@features/flow-pay-balance` `hooks/useBalanceData.ts`                   |
| `types.ts`        | Types shared across the package or exported; screen-only types stay in the screen      | `@features/flow-contacts-delete-address` `types.ts`                       |
| `exports.ts`      | The platform-agnostic public API, re-exported by both `index.ts` and `index.native.ts`  | `@features/flow-contacts-delete-address` `exports.ts`                     |
| `index.ts`        | Web entry: `export * from "./exports"` plus the `.web` components                       | `@features/flow-contacts-delete-address` `index.ts`                       |
| `index.native.ts` | Native entry: `export * from "./exports"` plus the `.native` components                 | `@features/flow-contacts-delete-address` `index.native.ts`                |

- `logic/` and `model/` import no React, so their tests run without rendering.
- The lifecycle model is not a ViewModel. The ViewModel is the `useXViewModel` hook every screen
  has; the lifecycle model is optional and framework-free. Add one when a screen runs an async
  action through an injected port and moves through states (`idle`, `open`, `success`, `error`):
  the controller calls the port and returns the next state, and the screen's `useXViewModel` hook
  holds that state in React and hands it to the View. A screen without such an action needs only
  its hook. In `@features/flow-contacts-delete-address`, `useDeleteAddressFlowViewModel.ts` wraps
  `model/addressDeleteController.ts`; `model/addressDeleteViewModel.ts` predates the term and holds
  the lifecycle constructors.
- Add a folder only when it groups several files; a single helper stays at the root of `src/`
  or of its screen.
- `exports.ts` and the `index.*` files are pure barrels: see
  [package-public-api](../package-public-api/SKILL.md).
- Wording keys follow [i18n-keys](../i18n-keys/SKILL.md).

## Review

- One screen: flat `src/`. Several: `screens/<Screen>/`. No `steps/`.
- MVVM everywhere: each screen is a `useXViewModel.ts` plus `XView.web.tsx` / `XView.native.tsx`,
  and the View renders props only, per [mvvm-architecture](../mvvm-architecture/SKILL.md).
- Flow state holds only what the flow decides; entity data stays in `domain/entity`.
- Screen changes live in flow state; app navigation comes in as callbacks.
- `copy/`, `logic/`, `model/`, `types.ts` and `exports.ts` hold what the table says, no more.
