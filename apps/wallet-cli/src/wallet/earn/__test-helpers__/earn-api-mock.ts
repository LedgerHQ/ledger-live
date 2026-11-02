import { createGatedModuleMock } from "../../../testing/gated-module-mock";

/**
 * Shared, flag-gated `earn-api` module mock for the eth-vault unit tests. The `earn yields`/`earn
 * positions` integration tests run in the same process and expect the real client to hit their
 * MockServer, so each eth-vault test file activates its fakes in `beforeAll` and deactivates them in
 * `afterAll`.
 */
export const earnApiMock = await createGatedModuleMock(require.resolve("../api"), [
  "getDefiProducts",
  "postDefiApprove",
  "postDefiDeposit",
  "postDefiWithdraw",
  "getEthTxStatus",
]);
