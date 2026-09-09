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
        getIsAlreadyCompleted: async () => true,
      },
      { isLedgerSyncActive: true, accounts: [], protectId: "" },
    );
    expect(isFulfilled).toBe(true);

    isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompleted: async () => false,
      },
      { isLedgerSyncActive: false, protectId: "" },
    );
    expect(isFulfilled).toBe(false);
  });

  it("forwards the protectId to getIsAlreadyCompleted (Recover async completion check)", async () => {
    const getIsAlreadyCompleted = jest.fn(async () => true);

    await isPostOnboardingHubActionFulfilled(
      { completed: false, getIsAlreadyCompleted },
      { isLedgerSyncActive: false, protectId: "protect-prod" },
    );

    expect(getIsAlreadyCompleted).toHaveBeenCalledWith({ protectId: "protect-prod" });
  });

  it("returns false when getIsAlreadyCompleted rejects (network/storage error)", async () => {
    const isFulfilled = await isPostOnboardingHubActionFulfilled(
      {
        completed: false,
        getIsAlreadyCompleted: async () => {
          throw new Error("boom");
        },
      },
      { isLedgerSyncActive: false, protectId: "protect-prod" },
    );
    expect(isFulfilled).toBe(false);
  });

  it("returns false when neither completion source is provided", async () => {
    const isFulfilled = await isPostOnboardingHubActionFulfilled(
      { completed: false },
      { isLedgerSyncActive: false, protectId: "" },
    );
    expect(isFulfilled).toBe(false);
  });
});
