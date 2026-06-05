import { renderHook, waitFor } from "tests/testSetup";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubStepperDisplay } from "../usePostOnboardingHubStepperDisplay";
import { usePostOnboardingHubCompletionContext } from "../usePostOnboardingHubCompletionContext";

jest.mock("../usePostOnboardingHubCompletionContext", () => ({
  usePostOnboardingHubCompletionContext: jest.fn(),
}));

const mockUsePostOnboardingHubCompletionContext = jest.mocked(
  usePostOnboardingHubCompletionContext,
);

const makeAction = (completed: boolean, overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    completed,
    id: PostOnboardingActionId.buyCrypto,
    Icon: () => null,
    title: "",
    titleCompleted: "",
    ...overrides,
  }) as never;

describe("usePostOnboardingHubStepperDisplay", () => {
  beforeEach(() => {
    mockUsePostOnboardingHubCompletionContext.mockReturnValue({
      isLedgerSyncActive: false,
      accounts: [],
      protectId: "protect-prod",
    });
  });

  it.each([
    { completed: 0, total: 0, expectedStep: 1, expectedTotal: 2, expectedLabel: "1/2" },
    { completed: 0, total: 3, expectedStep: 1, expectedTotal: 4, expectedLabel: "1/4" },
    { completed: 1, total: 3, expectedStep: 2, expectedTotal: 4, expectedLabel: "2/4" },
    { completed: 2, total: 3, expectedStep: 3, expectedTotal: 4, expectedLabel: "3/4" },
    { completed: 3, total: 3, expectedStep: 4, expectedTotal: 4, expectedLabel: "4/4" },
    { completed: 0, total: 4, expectedStep: 1, expectedTotal: 5, expectedLabel: "1/5" },
    { completed: 4, total: 4, expectedStep: 5, expectedTotal: 5, expectedLabel: "5/5" },
  ])(
    "returns currentStep $expectedStep, total $expectedTotal, label $expectedLabel when $completed of $total actions completed",
    async ({ completed, total, expectedStep, expectedTotal, expectedLabel }) => {
      const actions = Array.from({ length: total }, (_, i) => makeAction(i < completed));
      const { result } = renderHook(() => usePostOnboardingHubStepperDisplay(actions));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.currentStep).toBe(expectedStep);
      expect(result.current.totalSteps).toBe(expectedTotal);
      expect(result.current.stepperLabel).toBe(expectedLabel);
      expect(result.current.areAllActionsCompleted).toBe(total > 0 && completed === total);
    },
  );

  it("starts loading before the async completion check resolves", () => {
    const actions = [makeAction(false)];
    const { result } = renderHook(() => usePostOnboardingHubStepperDisplay(actions));
    expect(result.current.loading).toBe(true);
  });

  it("counts an action as completed when async getIsAlreadyCompleted resolves true", async () => {
    const actions = [
      makeAction(false, {
        id: PostOnboardingActionId.recover,
        getIsAlreadyCompleted: async () => true,
      }),
    ];
    const { result } = renderHook(() => usePostOnboardingHubStepperDisplay(actions));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.areAllActionsCompleted).toBe(true);
    expect(result.current.currentStep).toBe(result.current.totalSteps);
    expect(result.current.actionCompletionById[PostOnboardingActionId.recover]).toBe(true);
  });

  it("treats an async completion rejection as not completed", async () => {
    const actions = [
      makeAction(false, {
        id: PostOnboardingActionId.recover,
        getIsAlreadyCompleted: async () => {
          throw new Error("boom");
        },
      }),
    ];
    const { result } = renderHook(() => usePostOnboardingHubStepperDisplay(actions));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.areAllActionsCompleted).toBe(false);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.actionCompletionById[PostOnboardingActionId.recover]).toBe(false);
  });

  it("counts disabled actions as fulfilled without marking the action completed", async () => {
    const actions = [
      makeAction(false, {
        id: PostOnboardingActionId.syncAccounts,
        disabled: true,
      }),
    ];
    const { result } = renderHook(() => usePostOnboardingHubStepperDisplay(actions));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.areAllActionsCompleted).toBe(true);
    expect(result.current.currentStep).toBe(result.current.totalSteps);
    expect(result.current.actionCompletionById[PostOnboardingActionId.syncAccounts]).toBe(false);
  });
});
