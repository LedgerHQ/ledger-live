---
name: typescript
description: TypeScript + React typing conventions for Ledger Wallet. Read when writing or reviewing .ts and .tsx files.
globs: ["**/*.ts", "**/*.tsx"]
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

## Type Safety

- Never use double casts (`as unknown as T`) to work around type mismatches — fix the underlying type contract instead.
- Never use `as` casts to hide signer/context shape mismatches — implement proper type narrowing or update the interface.
- Prefer exhaustive `switch` statements with `assertNever` for discriminated unions to catch missing cases at compile time.
- Make optional fields required when omission would cause silent misconfiguration or surprising defaults.
- Type guards should accept the widest practical input (`unknown` or a union type) so they can be reused for narrowing at call sites, rather than accepting an already-narrowed subtype.

## Hooks

- Extract logic into custom hooks.
- Type hook return values explicitly.
- Avoid unnecessary dependencies in hook arrays.

## Data & Types

- Store types in `types.ts` files.
- Use Zod for runtime validation.

## Imports & Exports

- Prefer named imports and named exports.
- Always declare imports at the beginning of source files.
- Import order:
  1. External libs
  2. Internal modules
  3. Types
- Avoid default exports.
- Import from package entrypoints, not hardcoded `node_modules` paths.
- Consolidate multiple imports from the same module into a single import statement.

## Error Handling

For error handling patterns, see the [`error-handling` skill](./../error-handling/SKILL.md).

## Async Patterns

- Use `async/await`.
- Wrap async code with `try/catch`.
- Avoid inline Promises inside JSX.

## Performance

- Use `as const` for literals.
- Use mapped types for transformations.
- Use memoization and stable references to reduce re-renders.
