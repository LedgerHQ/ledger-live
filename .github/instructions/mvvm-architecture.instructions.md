---
applyTo: "**/src/mvvm/**"
---

<!-- Source: .cursor/rules/react-mvvm.mdc, .cursor/rules/ldls-web.mdc, .cursor/rules/ldls-native.mdc -->
<!-- Last synced: 2026-02-13 -->

# MVVM Architecture

All code inside `src/mvvm/` must follow these rules strictly. Code reviews enforce strict adherence. Upon completion, `src/mvvm/` replaces `src/` entirely. These rules apply equally to `ledger-live-mobile` and `ledger-live-desktop`.

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

- Place elements inside the closest folder matching their reuse scope.
- Screen-specific building blocks stay inside the screen folder.
- Feature-level components go in `FeatureName/components/`.
- Global shared UI belongs to `src/mvvm/components/`.

## Component & File Patterns

- Each component resides in its own folder with `index.tsx` as the entry file.
- Support files live alongside: `use<ComponentName>ViewModel.ts`, `types.ts`, `styles.ts`.
- ViewModel hooks always follow the naming: `use<ComponentName>ViewModel.ts`.
- Use the **List / Detail** naming pattern for multi-view workflows.

## ViewModel Pattern

Components needing external logic must use **Container → ViewModel → View**:

- The ViewModel produces data and handlers.
- The View receives everything via props.
- **The View must not directly call hooks that connect to external systems** (Redux, RTK Query, navigation, etc.).

```typescript
// ✅ Correct: View receives props from ViewModel
const MyView = ({ items, onPress }: MyViewProps) => { ... };

// ❌ Wrong: View directly calls external hooks
const MyView = () => {
  const { data } = useGetItemsQuery();  // violation
};
```

## Import Rules

- Keep relative imports shallow (within one directory level).
- Use TypeScript path aliases for broader access.
- Do not import `index.tsx` explicitly — rely on folder alias exports.

## Data Fetching & State Management

- Use RTK Query — `dada-client` and `cal-client` are reference implementations.
- Use consistent loading, retry, and error states.
- Prefer optimistic UI when appropriate.
- Apply caching and stale-time strategies.

## Lumen Design System

New UI code in `src/mvvm/` must use the Lumen design system:

- **Desktop** (`ledger-live-desktop`): import from `@ledgerhq/lumen-ui-react` and `@ledgerhq/lumen-ui-react/symbols`.
- **Mobile** (`ledger-live-mobile`): import from `@ledgerhq/lumen-ui-rnative` and `@ledgerhq/lumen-ui-rnative/symbols`.

Preferred components: `Button`, `IconButton`, `Dialog`, `Text`, `Box`, `Banner`, `Tag`, `ListItem`, `Tile`, `AmountDisplay`, `NavBar`, `BottomSheet`, `TextInput`, `SearchInput`, `Divider`, `Checkbox`, `Switch`, `Select`, `Spinner`.

Flag these anti-patterns:
- Using raw HTML elements (`<div>`, `<span>`, `<button>`) or React Native primitives (`<View>`, `<TouchableOpacity>`) instead of Lumen components.
- Inline styles or hardcoded color values instead of design tokens.
- Typography using raw `<Text>` with manual font sizing instead of Lumen typography components.

## Testing Requirements

- Every new feature under `src/mvvm/` **must include an integration test** in its `__integrations__/` folder.
- A minimal integration test must be created as soon as the feature folder is added and expanded as the feature grows.
- All hooks must have dedicated tests covering logic, edge cases, and interactions with external systems.
- All utilities in `utils/` must have unit tests.
- Use MSW to mock network API calls.
