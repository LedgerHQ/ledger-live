---
applyTo: "**/src/mvvm/**"
---

# MVVM Architecture

## Folder Structure

src/mvvm/
├── features/FeatureName/
│   ├── __integrations__/    ← mandatory integration tests
│   ├── components/          ← reusable UI across screens
│   ├── screens/             ← individual screen folders
│   ├── hooks/, utils/
├── components/, hooks/, utils/  ← global shared
## ViewModel Pattern

Components needing external logic must use **Container → ViewModel → View**:

- Every screen/component folder MUST contain `use<Name>ViewModel.ts`.
- Views receive data only through props — never import `useSelector`, `useDispatch`, `useNavigation`, or RTK Query hooks directly.

## Testing Requirements

- Every new feature MUST include integration tests in `__integrations__/`.
- Create minimal integration test when feature folder is added — expand as feature grows.
- All hooks must have dedicated tests covering logic and edge cases.
- All utilities must have unit tests.
- Use MSW for network mocking — never mock React components or hooks directly.
- Use the app's custom test renderer (`@tests/test-renderer` for mobile, `tests/testSetup` for desktop).
- Prefer integration-first testing to validate complete behavior.

## Lumen Design System

- **Desktop**: import from `@ledgerhq/lumen-ui-react`.
- **Mobile**: import from `@ledgerhq/lumen-ui-rnative`.
- Never use raw HTML/RN primitives or inline styles instead of Lumen components and tokens.

## Import Rules

- Use TypeScript path aliases for cross-directory imports.
- Keep relative imports within one directory level.
