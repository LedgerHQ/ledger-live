import { isPostOnboardingHubActionFulfilled } from "../postOnboardingHubCompletion";

describe("isPostOnboardingHubActionFulfilled", () => {
  it("is true when Redux marks the action completed", async () => {
    const isFulfilled = await isPostOnboardingHubActionFulfilled(
      { completed: true, getIsAlreadyCompletedByState: () => false },
      { isLedgerSyncActive: false, protectId: "" },
    );
    expect(isFulfilled).toBe(true);
  });

  it("uses getIsAlreadyCompletedByState when Redux completed is false", async () => {
    let isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
      },
      { isLedgerSyncActive: true, accounts: [], protectId: "" },
    );
    expect(isFulfilled).toBe(true);

    isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
      },
      { isLedgerSyncActive: false, protectId: "" },
    );
    expect(isFulfilled).toBe(false);
  });

  it("uses getIsAlreadyCompleted to get async state", async () => {
    let isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompleted: async () => {
          return true;
        },
      },
      { isLedgerSyncActive: true, accounts: [], protectId: "" },
    );
    expect(isFulfilled).toBe(true);

    isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompleted: async () => {
          return false;
        },
      },
      { isLedgerSyncActive: false, protectId: "" },
    );
    expect(isFulfilled).toBe(false);
  });
});
