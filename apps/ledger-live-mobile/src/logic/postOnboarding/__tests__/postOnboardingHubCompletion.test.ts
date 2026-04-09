import { isPostOnboardingHubActionFulfilled } from "../postOnboardingHubCompletion";

describe("isPostOnboardingHubActionFulfilled", () => {
  it("is true when Redux marks the action completed", () => {
    expect(
      isPostOnboardingHubActionFulfilled(
        { completed: true, getIsAlreadyCompletedByState: () => false },
        { isLedgerSyncActive: false },
      ),
    ).toBe(true);
  });

  it("uses getIsAlreadyCompletedByState when Redux completed is false", () => {
    expect(
      isPostOnboardingHubActionFulfilled(
        {
          completed: false,
          getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
        },
        { isLedgerSyncActive: true, accounts: [] },
      ),
    ).toBe(true);

    expect(
      isPostOnboardingHubActionFulfilled(
        {
          completed: false,
          getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
        },
        { isLedgerSyncActive: false },
      ),
    ).toBe(false);
  });
});
