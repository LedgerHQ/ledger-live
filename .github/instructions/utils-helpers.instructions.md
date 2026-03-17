---
applyTo: "**/utils/**,**/helpers/**"
---

# Utils and Helpers

## Requirements

- Every utility function must have unit tests in a colocated `__tests__/` folder or `*.test.ts` file.
- Extract reusable logic from components into utils files — do not leave helper functions inline.
- Document all function parameters explicitly, including edge cases (inclusive/exclusive bounds, etc.).

## Testing

- Test return values with strong assertions (`toEqual`, `toMatchObject`) — avoid weak matchers like `not.toBeNull`.
- Cover edge cases: empty inputs, boundary values, error conditions.
- Use realistic test data from `__fixtures__/` — avoid hardcoded or unrealistic values.
