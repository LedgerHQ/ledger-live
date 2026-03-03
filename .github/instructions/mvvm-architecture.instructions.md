---
applyTo: "**/src/mvvm/**"
---

# MVVM Architecture

Code inside `src/mvvm/` must follow these rules strictly.

## Folder Structure

src/mvvm/
├── features/FeatureName/
│   ├── __integrations__/    ← mandatory integration tests
│   ├── components/          ← reusable UI across screens
│   ├── screens/             ← individual screen folders
│   ├── hooks/               ← feature-specific hooks
│   └── utils/               ← feature-scoped utilities
├── components/              ← global shared UI
├── hooks/
└── utils/
## ViewModel Pattern

Components needing external logic must use **Container → ViewModel → View**.

**Flag as violation if ANY `index.tsx` View file under `screens/` or `components/`:**
- Imports `useSelector` or `useDispatch` from `react-redux`.
- Imports `useNavigation` or `useRoute` from `@react-navigation/*`.
- Calls any RTK Query hook (e.g. `useGet*Query`, `use*Mutation`).
- Does NOT have a corresponding `use<Name>ViewModel.ts` file in the same directory.

## Lumen Design System

- **Desktop**: import from `@ledgerhq/lumen-ui-react`.
- **Mobile**: import from `@ledgerhq/lumen-ui-rnative`.

**Flag:** Raw HTML elements (`<div>`, `<button>`) or RN primitives (`<View>`, `<TouchableOpacity>`) instead of Lumen components.
**Flag:** Inline styles or hardcoded color values instead of design tokens.

## Testing Requirements

- Every new feature must include integration tests in `__integrations__/`.
- Every new ViewModel hook must have dedicated unit tests.
- Every new utility function must have unit tests.
- New analytics/tracking calls must have test assertions verifying events and payloads.
- Use MSW to mock network API calls — do not mock hooks directly.
