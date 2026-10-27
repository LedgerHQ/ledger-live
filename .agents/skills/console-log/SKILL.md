---
name: console-log
description: Choose between `console.warn`, `console.error` and no log at all, knowing Datadog RUM reports every `console.error` as an error event. Read when adding or changing a `console.error`, `console.warn` or `console.log` call in app or package code, or when Datadog shows error events for expected or recoverable failures.
---

# Console Logging Convention

`console.error` is intercepted by Datadog RUM and forwarded as an error event.

- Use `console.warn` for expected or recoverable errors (network failures, optional feature unavailable, etc.)
- Use `console.error` **only** for illegal/unexpected program states that should never occur in production
- Prefer dropping the log entirely when the error is neither actionable nor surprising
