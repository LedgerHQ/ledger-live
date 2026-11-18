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
 * When a named budget belongs here: e2e/docs/e2e-conventions.md, "A timeout, delay, or poll
 * interval MUST be a bucket".
 *
 * `jest.config.js` requires this file as well as the test code, so it must stay free of
 * non-erasable TypeScript syntax (no `enum`, no `namespace`) — Node strips the types at
 * require time — and import nothing but `@ledgerhq/live-e2e-shared`, which
 * `jest.config.js` already loads.
 */

export { TIMEOUT, INTERVAL } from "@ledgerhq/live-e2e-shared/timeouts";

/** Jest's per-test budget. */
export const TEST_TIMEOUT = 360_000;
