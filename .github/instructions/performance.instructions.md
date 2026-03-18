---
applyTo: "**/*.ts,**/*.tsx"
---

# Performance Guidelines

## Async Operations

- Use `promiseAllBatched` from `libs/promise/src/promise.ts` instead of unbounded `Promise.all` for arrays of unknown size.
- Avoid blocking the main thread with synchronous calls to native modules — cache results when possible.

## Data Structures

- Use `Set.has()` (O(1)) instead of `Array.includes()` (O(n)) for repeated lookups.
- Use `Map` for key-value lookups instead of iterating over arrays.

## Buffer Operations

- Use `subarray` instead of `slice` for Buffer when the original buffer is not mutated — it avoids memory allocation.

## React Performance

- Avoid `useEffect` for derived state — compute during render or use `useMemo`.
- Use `useLayoutEffect` when measuring DOM elements before paint.
- Use `React.memo` for components that receive stable props but re-render frequently.
- Avoid creating new objects or arrays in render — extract to `useMemo` or constants.

## Lists and Virtualization

- Use `FlashList` (mobile) or virtualized lists for lists with more than 50 items.
- Avoid `LinearGradient` and complex SVGs in React Native — use images instead.

## Logging

- Use `@ledgerhq/logs` instead of `console.log` — logs can be exported for debugging.
- Never stringify objects in log calls — pass objects directly for structured logging.

## Numbers

- Use `bigint` for Alpaca/API numeric values and `BigNumber` for bridge/transaction values.
- Use `BigInt(value.toFixed())` instead of `BigInt(value.toString())` for large amounts.
