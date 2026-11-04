import { createGatedModuleMock } from "../../../testing/gated-module-mock";

/**
 * Shared, flag-gated `sign-and-broadcast` module mock for the earn pipeline unit tests. The send /
 * sol-stake / sign-and-broadcast unit tests run in the same process and import the real helper, so
 * each pipeline test file activates its fakes in `beforeAll` and deactivates them in `afterAll`.
 */
export const signBroadcastMock = await createGatedModuleMock(
  require.resolve("../../sign-and-broadcast"),
  ["prepareIntentDryRun", "signAndBroadcastIntent"],
);
