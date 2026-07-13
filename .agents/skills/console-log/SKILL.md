---
name: console-log
description: Convention for console logging levels across the monorepo.
---

# Console Logging Convention

`console.error` is intercepted by monitoring tools (Datadog RUM, Sentry) and forwarded as an error event.

- Use `console.warn` for expected or recoverable errors (network failures, optional feature unavailable, etc.)
- Use `console.error` **only** for illegal/unexpected program states that should never occur in production
- Prefer dropping the log entirely when the error is neither actionable nor surprising
