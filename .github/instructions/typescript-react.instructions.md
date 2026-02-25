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

## Props & State

- Type props with interfaces or type aliases (PascalCase).
- Use `readonly` for immutable props and state shapes.
- Avoid `any` — use `unknown` when the type is truly unknown.
- Prefer discriminated unions for state machines.

## Hooks

- Extract logic into custom hooks with explicitly typed return values.
- Avoid unnecessary dependencies in hook dependency arrays.

## Imports & Exports

- Prefer named imports and named exports — avoid default exports.
- Import order: (1) external libs, (2) internal modules, (3) types.
- Always declare imports at the top of the file.

## Error Handling

- Use custom error classes with `code` and optional context.
- Prefer `Result<T, E>` patterns for recoverable failures.
- Use `async/await` with `try/catch` — avoid inline Promises in JSX.

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

## Performance

- Apply list virtualization for long lists.
- Use lazy loading for large screens or modules.
- Use `as const` for literal types; use mapped types for transformations.

---

# Redux Toolkit

## createSlice

- Use descriptive `name` for action type prefixes.
- Define typed `initialState` with `satisfies`.
- Export actions and reducer separately.
- Use `PayloadAction<T>` for typed payloads.
- Use Immer's mutable syntax inside reducers — keep each reducer focused on a single state change.
- Colocate selectors with the slice; use `createSelector` for derived data.
- Use `extraReducers` builder callback for async thunks (pending/fulfilled/rejected).
- Register new slices in `reducers/index.ts`.

## RTK Query — createApi

- One API slice per base URL / data source.
- Define API slices in `state-manager/api.ts` files.
- Use `build.query` for GET, `build.mutation` for POST/PUT/DELETE.
- Type both response and argument: `build.query<ResponseType, ArgType>`.
- Define tags as enums in `state-manager/types.ts`.
- Use `providesTags` on queries and `invalidatesTags` on mutations.
- Use `transformResponse` to reshape API data.
- Always handle errors in custom `baseQuery` or `queryFn` — return `{ data }` or `{ error }`.
- Register APIs in `reducers/rtkQueryApi.ts`.

## Zod Validation

- Define Zod schemas first, then infer TypeScript types with `z.infer<typeof Schema>`.
- Use field validators: `.min()`, `.max()`, `.uuid()`, `.email()`, `.datetime()`.
- Use `z.enum()` for fixed string values; `.optional()` for nullable fields.
- Use schemas in RTK Query `transformResponse` for runtime validation.
- Export both schemas and inferred types from `state-manager/types.ts`.
