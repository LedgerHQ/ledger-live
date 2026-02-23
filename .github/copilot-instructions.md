```markdown
<!-- Source: .cursor/agents/code-reviewer.md -->
<!-- Last synced: 2026-02-13 -->

# Ledger Live Monorepo

[Existing content remains unchanged]

## MVVM Architecture

All code inside `src/mvvm/` must strictly follow these rules:

- Use the Container → ViewModel → View pattern for components needing external logic.
- The View must not directly call hooks that connect to external systems (Redux, RTK Query, navigation, etc.).
- Every screen or component folder MUST contain a `use<Name>ViewModel.ts` file that centralizes all external hook calls.
- The `index.tsx` View file must receive data only through props from the ViewModel.
- Place elements inside the closest folder matching their reuse scope (feature-level, global shared, etc.).
- Follow the prescribed folder structure for features, components, hooks, and utilities.
- Use shallow relative imports (within one directory level) and TypeScript path aliases for broader access.
- Every new feature under `src/mvvm/` must include an integration test in its `__integrations__/` folder.

## UI Components and Styling

- Use Lumen design system components consistently:
  - Desktop: import from `@ledgerhq/lumen-ui-react` and `@ledgerhq/lumen-ui-react/symbols`.
  - Mobile: import from `@ledgerhq/lumen-ui-rnative` and `@ledgerhq/lumen-ui-rnative/symbols`.
- Avoid raw HTML elements, React Native primitives, inline styles, or hardcoded color values.
- Use design tokens instead of hardcoded values for spacing, colors, etc.
- Maintain consistent naming conventions for icon imports (use PascalCase).

## Testing

- Place unit tests in `__tests__/` subdirectories.
- Place integration tests in `__integrations__/` directories.
- Use `async/await` with `waitFor` for asynchronous assertions.
- Prefer integration tests for complex features to validate complete behavior.
- Follow the Query Priority order: ByRole (preferred) > ByLabelText > ByText > ByTestId (last resort).

## Code Style and Quality

- Keep components focused and reasonably sized — decompose large UI into smaller reusable elements.
- Extract logic into custom hooks with explicitly typed return values.
- Use descriptive names for functions, variables, and components.
- Avoid deep nesting and long methods (aim for methods under 100 lines).
- Follow consistent import practices and ordering.
- Use proper error handling and logging practices.

## Performance

- Wrap expensive components in `React.memo`.
- Stabilize callbacks with `useCallback`.
- Memoize computations with `useMemo`.
- Apply list virtualization for long lists.
- Use lazy loading for large screens or modules.

[Remaining content stays the same]
```