/**
 * The shared duration vocabulary of the mobile E2E suite.
 *
 * Two scales, deliberately kept apart:
 *  - `TIMEOUT`  — upper bounds: "give up after this long".
 *  - `INTERVAL` — fixed waits: "wait this long", once or between attempts.
 *
 * Both are shared with the desktop suite: they live in `@ledgerhq/live-e2e-shared/timeouts`,
 * which documents each bucket, and this file re-exports them.
 *
 * The scales are a vocabulary, so every bucket stays even while a single file uses it.
 * Beyond them, a named budget lives here only when more than one file relies on it. A
 * budget that bounds one file's own flow (a per-test override, a harness step, a partner's
 * server-side wait) stays in that file as a named constant, so its rationale travels with it.
 * Either way, a call site never passes a bare number.
 *
 * `jest.config.js` requires this file as well as the test code, so it must stay free of
 * non-erasable TypeScript syntax (no `enum`, no `namespace`) — Node strips the types at
 * require time — and import nothing but `@ledgerhq/live-e2e-shared`, which
 * `jest.config.js` already loads.
 */

export { TIMEOUT, INTERVAL } from "@ledgerhq/live-e2e-shared/timeouts";

/** Jest's per-test budget. */
export const TEST_TIMEOUT = 360_000;
