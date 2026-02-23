```markdown
---
applyTo: "**/src/mvvm/**"
---

<!-- Source: .cursor/rules/react-mvvm.mdc, .cursor/rules/ldls-web.mdc, .cursor/rules/ldls-native.mdc -->
<!-- Last synced: 2026-02-16 -->

# MVVM Architecture

[Existing content remains unchanged]

## ViewModel Pattern

Components needing external logic must use **Container → ViewModel → View**:

- The ViewModel produces data and handlers.
- The View receives everything via props.
- **The View must not directly call hooks that connect to external systems** (Redux, RTK Query, navigation, etc.).

### Review Checklist — Flag as a violation if ANY `index.tsx` View file under `screens/` or `components/` within `src/mvvm/`:

- Imports `useSelector` or `useDispatch` from `react-redux`.
- Imports `useNavigation` or `useRoute` from `@react-navigation/*`.
- Calls any RTK Query hook (e.g. `useGet*Query`, `use*Mutation`).
- Does NOT have a corresponding `use<Name>ViewModel.ts` file in the same directory.

Every screen or component folder MUST contain a `use<Name>ViewModel.ts` file that centralizes all external hook calls. The `index.tsx` View file must receive data only through props from the ViewModel.

[Example code remains unchanged]

## Import Rules

- Keep relative imports shallow (within one directory level).
- Use TypeScript path aliases for broader access.
- Import directories via alias paths instead of long relative chains.
- Do not import `index.tsx` explicitly — rely on folder alias exports.
- Maintain consistent import paths across the codebase (e.g., prefer shorter, common paths for widely used modules).

## Lumen Design System

New UI code in `src/mvvm/` must use the Lumen design system:

- **Desktop** (`ledger-live-desktop`): import from `@ledgerhq/lumen-ui-react` and `@ledgerhq/lumen-ui-react/symbols`.
- **Mobile** (`ledger-live-mobile`): import from `@ledgerhq/lumen-ui-rnative` and `@ledgerhq/lumen-ui-rnative/symbols`.

Preferred components: `Button`, `IconButton`, `Dialog`, `Text`, `Box`, `Banner`, `Tag`, `ListItem`, `Tile`, `AmountDisplay`, `NavBar`, `BottomSheet`, `TextInput`, `SearchInput`, `Divider`, `Checkbox`, `Switch`, `Select`, `Spinner`.

Flag these anti-patterns:
- Using raw HTML elements (`<div>`, `<span>`, `<button>`) or React Native primitives (`<View>`, `<TouchableOpacity>`) instead of Lumen components.
- Inline styles or hardcoded color values instead of design tokens.
- Typography using raw `<Text>` with manual font sizing instead of Lumen typography components.
- Inconsistent naming conventions for icon imports (use PascalCase).

## Testing Requirements

- Every new feature under `src/mvvm/` **must include an integration test** in its `__integrations__/` folder.
- A minimal integration test must be created as soon as the feature folder is added and expanded as the feature grows.
- Integration tests ensure that screens, components, hooks, and navigation work together as expected within the MVVM Architecture.
- All hooks must have dedicated tests covering logic, edge cases, and interactions with external systems.
- All utilities in `utils/` must have unit tests.
- Keep test files close to their source whenever appropriate (e.g., `utils/` and `hooks/` can contain their own `__tests__/`).
- Prefer **integration-first** testing where possible, to validate the complete behavior of the feature.
- Keep mocks minimal — favor realistic wiring of components through the MVVM Architecture patterns.
- Follow the project's existing **custom test renderer** conventions and best practices.
- Use MSW to mock network API calls.

[Remaining content stays the same]
```