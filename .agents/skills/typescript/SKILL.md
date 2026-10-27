---
name: typescript
description: TypeScript + React typing conventions for Ledger Wallet. Read when writing or reviewing .ts and .tsx files.
---

## Components

- Use function components with typed props.
- Prefer `React.FC` only when children typing is needed; otherwise avoid.
- Memoize when beneficial (`React.memo`, `useMemo`, `useCallback`).

## Props & State

- Type props with interfaces or type aliases (PascalCase).
- Use `readonly` for immutable props/state shapes.
- Avoid `any`; use `unknown` when necessary.
- Prefer discriminated unions for state machines.

## Hooks

- Extract logic into custom hooks.
- Type hook return values explicitly.
- Avoid unnecessary dependencies in hook arrays.

## Data & Types

- Store a package's or folder's shared types in a `types.ts` file (e.g. `domain/entity/contact/src/types.ts`).
- Declare the props of a component split into `X.web.tsx` and `X.native.tsx` in an unsuffixed `X.types.ts` beside them, with no `.web` / `.native` sibling. It is the one contract both platforms annotate their props with, so it imports nothing platform-specific (see [`package-public-api`](../package-public-api/SKILL.md#universal-components), rules R2 to R4). Example: `ServicesEntryPointsView.types.ts` in `features/flow/portfolio-services-entry-points/src/components/ServicesEntryPoints/`.
- Use Zod for runtime validation.

## Imports & Exports

- Prefer named imports and named exports.
- Always declare imports at the beginning of source files.
- Import order:
  1. External libs
  2. Internal modules
  3. Types
- Avoid default exports.

## Error Handling

- Use custom error classes with `code` and optional context.
- Prefer `Result<T, E>` patterns for recoverable failures.

## Async Patterns

- Use `async/await`.
- Wrap async code with `try/catch`.
- Avoid inline Promises inside JSX.

## Performance

- Use `as const` for literals.
- Use mapped types for transformations.
- Use memoization and stable references to reduce re-renders.
