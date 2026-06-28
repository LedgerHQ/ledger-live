# detox-next-gen — agent guide

Experimental next-gen Detox E2E suite. The conventions live in the [README](README.md)
and [`docs/`](docs/) — elements, page objects, specs, timeouts, debugging — read those
before changing tests. This file holds the design rule most easily missed.

## Put logic at the right layer — don't duplicate mechanics across pages

Layering: **specs → pages → `helpers/elements` (primitives) → raw Detox.** Keep each
piece of logic at the layer that matches its knowledge:

- **Page objects** = _semantic, app-specific_ steps (`expectSuccess`, `selectProvider`).
  They name screens and flows.
- **Reusable mechanics** = any wait / poll / retry / race that operates only on element
  handles + timeouts, with **no** domain knowledge (swap/send/earn). These belong in
  `helpers/elements` — typically a `NativeHandle` / `WebHandle` method — **not** copied
  into each page. The page method then becomes a thin wrapper.

**Before writing a loop, poll, retry or race inside a page object, ask: does this touch
any app-specific knowledge?** If not, it's a primitive — add it to the handle and call it
from the page.

> Example: the "wait for success, fail fast on a known error screen" race is pure handle
> polling, so it lives as `NativeHandle.waitVisibleOrError(errorTarget, …)`;
> `SwapPage.expectSuccess` just calls it with the swap locators. A Send/Earn flow reuses
> the same primitive with its own ids.

Don't over-correct into premature abstraction: extract when the logic is genuinely generic
**and** clarifies layering or has a real second consumer — not "generalize everything".

## Before finishing

- `pnpm exec tsc --noEmit` must pass.
- Run a review pass on the diff (e.g. the `/simplify` skill) — it flags reuse / altitude
  issues such as a page method that should have been a shared primitive.
