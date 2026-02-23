```markdown
---
applyTo: "**/*.ts,**/*.tsx"
---

<!-- Source: .cursor/rules/typescript.mdc, .cursor/rules/react-general.mdc, .cursor/rules/redux-slice.mdc, .cursor/rules/rtk-query-api.mdc, .cursor/rules/zod-schemas.mdc -->
<!-- Last synced: 2026-02-13 -->

# TypeScript & React

## Components

- Use function components with typed props.
- Use `React.FC` only when children typing is needed; otherwise avoid it.
- Keep components focused and reasonably sized — decompose large UI into smaller reusable elements.
- Wrap expensive components in `React.memo`; stabilize callbacks with `useCallback`; memoize computations with `useMemo`.
- Follow the Container → ViewModel → View pattern for components needing external logic.

## Props & State

- Type props with interfaces or type aliases (PascalCase).
- Use `readonly` for immutable props and state shapes.
- Avoid `any` — use `unknown` when the type is truly unknown.
- Prefer discriminated unions for state machines.

## Hooks

- Extract logic into custom hooks with explicitly typed return values.
- Avoid unnecessary dependencies in hook dependency arrays.
- Place hooks in dedicated files following the naming convention `use<HookName>.ts`.

## Imports & Exports

- Prefer named imports and named exports — avoid default exports.
- Import order: (1) external libs, (2) internal modules, (3) types.
- Always declare imports at the top of the file.
- Use consistent import paths across the codebase.
- Prefer shorter, common import paths for widely used modules.

## Error Handling

- Use custom error classes with `code` and optional context.
- Prefer `Result<T, E>` patterns for recoverable failures.
- Use `async/await` with `try/catch` — avoid inline Promises in JSX.
- Be explicit with error messages in tests for documentation purposes.

## Accessibility

- Mobile: provide accessible labels for all interactive elements; support screen reader flows.
- Desktop: use semantic HTML; implement keyboard navigation; apply ARIA attributes when needed.

## Internationalization

- Use `react-i18next` consistently.
- Keep translation keys descriptive and structured.
- Support pluralization, gender, and variable interpolation.

## Styling

- Mobile (React Native): `StyleSheet.create()`, design-system tokens, theme support.
- Desktop: CSS modules or styled-components, design-system foundations, dark/light mode compatibility.
- Use Lumen design system components and avoid raw HTML elements or React Native primitives.
- Avoid inline styles or hardcoded color values; use design tokens instead.

## Performance

- Apply list virtualization for long lists.
- Use lazy loading for large screens or modules.
- Use `as const` for literal types; use mapped types for transformations.

## Code Quality

- Follow consistent naming conventions (PascalCase for components, camelCase for functions/variables).
- Keep functions and methods reasonably sized (aim for under 100 lines).
- Use descriptive names for functions, variables, and components.
- Avoid deep nesting and complex conditionals.
- Extract repeated logic into utility functions.
- Use proper TypeScript types and avoid type assertions when possible.

[Remaining content stays the same]
```

These updates address the most common feedback patterns by adding more specific guidelines, emphasizing MVVM architecture rules, clarifying testing requirements, and providing more detailed instructions on code style and quality.