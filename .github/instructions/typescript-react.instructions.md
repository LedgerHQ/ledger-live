---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript & React

## Components

- Use function components with typed props — avoid class components for new code.
- Keep components focused — split components over 300 lines into smaller files.
- Wrap expensive components in `React.memo`; stabilize callbacks with `useCallback`; memoize computations with `useMemo`.

## Props & State

- Type props with interfaces or type aliases (PascalCase).
- Avoid `any` — use `unknown` when the type is truly unknown.
- Prefer discriminated unions for state machines.

## Hooks

- Extract logic into custom hooks with explicitly typed return values.
- Avoid `useEffect` for updating local state from props — compute during render instead.
- Never call hooks at the top level of a `describe` block in tests.

## Imports & Exports

- Prefer named imports and exports — avoid default exports.
- Avoid barrel files (`index.ts` re-exporting everything) — they cause performance issues.
- Import directly from source files when possible.

## Error Handling

- Use `async/await` with `try/catch` — avoid inline Promises in JSX.
- Prefer `Result<T, E>` patterns for recoverable failures.

## Performance Patterns

- Use `const` over `let` when the variable is never reassigned.
- Use ternary operators or helper functions instead of nested `if` statements.
- Prefer `useLayoutEffect` over `useEffect` when measuring DOM layout.
- Use `useMemo` for expensive calculations that depend on stable inputs.

## Design System

- Use Lumen components (`Button`, `Box`, `Text`, etc.) instead of raw HTML or React Native primitives.
- Use design tokens instead of hardcoded colors or inline styles.

## Redux & RTK Query

- Use `bigint` for API/Alpaca code and `BigNumber` for bridge code.
- Register new slices in `reducers/index.ts` and APIs in `reducers/rtkQueryApi.ts`.
