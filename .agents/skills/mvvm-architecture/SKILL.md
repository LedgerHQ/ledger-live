---
name: mvvm-architecture
description: Organize and review app composition code under apps/*/src/mvvm/** in ledger-live-desktop and ledger-live-mobile, with the Container, ViewModel, View pattern. Read when creating, editing or reviewing files in apps/*/src/mvvm/**. Decide where new code goes with structure-flow first.
---

# MVVM Architecture

## Scope

`apps/<app>/src/mvvm/` holds two kinds of code:

- **App screens composing `@features/*`**: the screen, its routing, store and analytics wiring, and
  the adapters that connect a feature package to app internals.
- **App-only features**: code that depends on app internals and that no other app or flow reuses.

`src/mvvm` is not the default home of new code. Decide placement with
[structure-flow](../structure-flow/SKILL.md) first: business-aware UI and journeys go to
`features/`, data access to `domain/`, generic code to `shared/`. The app folder keeps only what
composes them.

Example: desktop `src/mvvm/features/Contacts/` renders `@features/flow-contacts` and passes it
app-side adapters (`useContactsCurrencySelectionAdapter`, `useContactsAddressValidationAdapter`).
The contacts journey itself lives in the flow package.

## Folder Structure

```
src/mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/    ← mandatory integration tests
│       ├── components/          ← UI reused across this feature's screens
│       ├── screens/             ← individual screen folders
│       ├── hooks/               ← feature-scoped hooks, adapters to app internals
│       └── utils/               ← feature-scoped utilities
├── components/                  ← UI shared by several app features
├── hooks/
└── utils/
```

Place each element in the closest folder matching its reuse scope: screen-specific building blocks
stay in the screen folder, feature-level ones in `FeatureName/components/`, app-wide ones in
`src/mvvm/components/`. An element several apps need belongs in a package, not here.

## Component & File Patterns

- Each component in its own folder with `index.tsx` as entry.
- ViewModel hooks always named `use<ComponentName>ViewModel.ts`.
- Support files alongside: `types.ts`, `styles.ts`.
- Use **List / Detail** naming for multi-view workflows.
- Utilities stay in `utils/`, separate from component folders.

## ViewModel Pattern

Components needing external logic use **Container → ViewModel → View**:

- The ViewModel produces data and handlers.
- The View receives everything via props, with no direct hook calls to external systems.

### Violation checklist: flag any `index.tsx` View under `screens/` or `components/` in `src/mvvm/` that

- Imports `useSelector` or `useDispatch` from `react-redux`
- Imports `useNavigation` or `useRoute` from `@react-navigation/*`
- Calls any RTK Query hook (`useGet*Query`, `use*Mutation`)
- Has no corresponding `use<Name>ViewModel.ts` in the same directory

```
❌ screens/UserProfileScreen/
     index.tsx   ← imports useSelector, useNavigation directly

✅ screens/UserProfileScreen/
     index.tsx                         ← props only
     useUserProfileScreenViewModel.ts  ← useSelector, useNavigation, RTK Query
```

## Import Rules

- Keep relative imports shallow (within one directory level).
- Use TypeScript path aliases for broader access.
- Never import `index.tsx` explicitly; use folder alias exports.
- Import packages through their public entry (`@features/flow-contacts`), never a relative path
  into them.

## Data Fetching

API calls and RTK Query endpoints live in a `domain/api` package such as `@domain/api-push-devices`.
A ViewModel in `src/mvvm` calls their hooks; it does not define endpoints.

## Design System

New UI in `src/mvvm/` must use Lumen:

- **Desktop**: [`ldls-web`](../ldls-web/SKILL.md) skill
- **Mobile**: [`ldls-native`](../ldls-native/SKILL.md) skill

## Testing

Every feature folder under `src/mvvm/features/` **must have an integration test** in
`__integrations__/`; create a minimal test when the folder is first added. See
[`testing`](../testing/SKILL.md) skill.
