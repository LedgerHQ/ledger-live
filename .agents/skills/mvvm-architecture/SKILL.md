---
name: mvvm-architecture
description: Plan, review, and develop desktop and mobile app features following our MVVM architectural pattern. Applies to all new .ts and .tsx files within /apps/ledger-live-desktop or /apps/ledger-live-mobile
---

# MVVM Architecture

## The new standard for desktop and mobile apps

- New code for `ledger-live-desktop` and `ledger-live-mobile` must go into `src/mvvm/`
- Eventually no feature code within these apps will live outside of `src/mvvm`
- New features, screens, components, hooks, and utilities belong in `src/mvvm/`
- Code changes with `src/mvvm` must conform to these `mvvm` patterns
- Code reviews enforce strict adherence

## Folder Structure

```
src/mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/    ← mandatory integration tests
│       ├── components/          ← reusable UI across screens
│       ├── screens/             ← individual screen folders
│       ├── hooks/               ← feature-specific hooks
│       └── utils/               ← feature-scoped utilities
├── components/                  ← global shared UI
├── hooks/
└── utils/
```

### Feature Folder Responsibilities

- `components/` gathers reusable UI elements across multiple screens.
- `screens/` contains individual screen folders and their private building blocks.
- `hooks/` contains feature-specific reusable hooks.
- `utils/` contains feature-scoped utilities.

### Nesting Guidelines

- Place elements inside the closest folder matching their reuse scope.
- Screen-specific building blocks stay inside the screen folder.
- Feature-level components belong to `FeatureName/components/`.
- Global shared UI belongs to `src/mvvm/components/`.

## Component & File Patterns

- Each component in its own folder with `index.tsx` as entry.
- ViewModel hooks always named `use<ComponentName>ViewModel.ts`.
- Support files alongside: `types.ts`, `styles.ts`.
- Use **List / Detail** naming for multi-view workflows.
- Utilities stay in `utils/`, separate from component folders.

## ViewModel Pattern

Components needing external logic use **Container → ViewModel → View**:

- The ViewModel produces data and handlers.
- The View receives everything via props — no direct hook calls to external systems.

### Violation checklist — flag if any `index.tsx` View under `screens/` or `components/` within `src/mvvm/`:

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
- Never import `index.tsx` explicitly — use folder alias exports.

## Data Fetching

Use RTK Query (`dada-client` and `cal-client` are reference implementations). See [`rtk-query-api`](../rtk-query-api/SKILL.md) skill.

## Design System

New UI in `src/mvvm/` must use Lumen:

- **Desktop**: [`ldls-web`](../ldls-web/SKILL.md) skill
- **Mobile**: [`ldls-native`](../ldls-native/SKILL.md) skill

## Testing

Every new feature under `src/mvvm/` **must have an integration test** in `__integrations__/` — create a minimal test when the folder is first added. See [`testing`](../testing/SKILL.md) skill.
