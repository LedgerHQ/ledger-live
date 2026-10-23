/**
 * The duration scale of the desktop E2E suite, shared with mobile through
 * `@ledgerhq/live-e2e-shared/timeouts`.
 *
 * Most waits rely on the defaults: the page timeout set in `fixtures/common.ts` for actions and
 * locator waits, and the `expect` timeout in `playwright.config.ts`. Pass a bucket only to a wait
 * that legitimately outlasts its default, and pick the smallest bucket that covers its slowest
 * passing run.
 */
export { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
