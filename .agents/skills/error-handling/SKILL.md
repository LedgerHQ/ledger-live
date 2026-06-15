---
name: error-handling
description: Error handling and defensive programming patterns for Ledger Wallet. Read when reviewing error states, null checks, async operations, and edge cases.
---

# Error Handling Patterns

## Defensive Null/Undefined Checks

- Always guard against missing data before accessing properties — prefer non-throwing lookups over throwing ones in UI flows.
- Never call methods like `.name` or spread operators on error objects without `instanceof Error` guards.
- Add `typeof error === "object" && error !== null` guards before using the `in` operator.
- When a lookup can return `null`/`undefined`, handle the missing case explicitly rather than falling through to default behavior.

## Async Operation Safety

- Track the identity of async operations (e.g., signature hash, operation id) rather than boolean flags to handle retries correctly.
- Cancel or ignore stale async operations when component unmounts or dependencies change.
- Set state to "in progress" only after the async operation starts successfully, not before.
- Clean up resources (timers, subscriptions, connections) in `finally` blocks or cleanup functions.

## Concurrent Operation Safety

- Never run device-touching commands in parallel — serialize APDU exchanges to prevent race conditions.
- Use mutex/queue patterns when a shared resource (socket, device, exchange slot) can receive concurrent calls.
- When stopping/starting services, set state only after the operation succeeds to avoid inconsistent state on failure.

## UI Error States

- Always surface error states in the UI — never render empty/blank UI when an error occurs.
- Plumb error props through components so error UI can be rendered at the appropriate level.
- Distinguish between "no data" and "error fetching data" states in the UI.

## Validation at Boundaries

- Validate inputs at API boundaries with actionable error messages.
- For public API functions, validate required parameters early and throw descriptive errors.
- Never let invalid data propagate silently — fail fast with clear context.

## Retry and Recovery

- Treat transient failures (network, device busy) as retriable — don't permanently fail on first error.
- Only remove tracking data (device registrations, instance records) after successful cleanup, not on failure.
- When cleanup fails, keep the item in tracking state so subsequent cleanup attempts can retry.

## Event Handler Safety

- Async handlers on synchronous events (like `exit`) won't be awaited — use appropriate patterns for cleanup reliability.
- Idempotent callbacks should use refs or guards to prevent duplicate side effects.
- When a callback can be invoked from multiple paths, ensure it handles duplicate invocations gracefully.

## Error Message Clarity

- Include context in error messages — what operation failed, what state was expected, what was received.
- For user-visible errors, provide actionable guidance rather than technical details.
- Log technical details for debugging while showing user-friendly messages in the UI.
