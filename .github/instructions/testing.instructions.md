```markdown
---
applyTo: "**/*.test.*,**/*.spec.*,**/__tests__/**,**/__integrations__/**"
---

<!-- Source: .cursor/rules/testing.mdc -->
<!-- Last synced: 2026-02-13 -->

# Testing

[Existing content remains unchanged]

## File Structure

- Tests live next to source files: `MyComponent.test.tsx` alongside `MyComponent.tsx`.
- Use `__tests__/` for grouped unit tests.
- Use `__integrations__/` for integration tests.
- Test data goes in `__fixtures__/` — use factories and builders, avoid hardcoded or unrealistic values.

## Query Priority

When selecting elements in tests, follow this order:

1. `ByRole` (preferred — matches accessibility tree)
2. `ByLabelText`
3. `ByText`
4. `ByTestId` (last resort)

## Test Naming and Structure

- Use descriptive names: `it("should <behavior> when <condition>")`.
- One behavior per test — avoid testing multiple concerns in a single `it` block.
- Be explicit with error messages in tests for documentation purposes.
- Prefer using enum values over hard-coded numbers in assertions for better readability and test stability.

## Accessibility Testing

- Ensure all interactive elements have accessible labels.
- Test screen reader flows in integration tests.
- Verify proper ARIA attributes are applied where needed.

## Performance Testing

- Include tests for memoized components and hooks.
- Test list virtualization for long lists.
- Verify lazy loading behavior for large screens or modules.

[Remaining content stays the same]
```