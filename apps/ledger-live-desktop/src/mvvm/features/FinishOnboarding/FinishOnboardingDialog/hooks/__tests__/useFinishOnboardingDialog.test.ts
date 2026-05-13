import { act, renderHook } from "tests/testSetup";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";

describe("useFinishOnboardingDialog", () => {
  it("should open the finish post-onboarding dialog when handleOpen is called", () => {
    const { result, store } = renderHook(() => useFinishOnboardingDialog());

    act(() => {
      result.current.handleOpen();
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(true);
  });
});
