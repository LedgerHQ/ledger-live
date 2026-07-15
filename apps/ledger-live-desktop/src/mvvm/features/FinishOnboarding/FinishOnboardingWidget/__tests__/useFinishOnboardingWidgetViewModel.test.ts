import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import { useFinishOnboardingWidgetViewModel } from "LLD/features/FinishOnboarding/FinishOnboardingWidget/useFinishOnboardingWidgetViewModel";
import { useFinishOnboardingState } from "LLD/features/FinishOnboarding/hooks/useFinishOnboardingState";

jest.mock("LLD/features/FinishOnboarding/hooks/useFinishOnboardingState");

const mockedUseFinishOnboardingState = jest.mocked(useFinishOnboardingState);

const deviceStep = {
  id: PostOnboardingActionId.deviceOnboarded,
  title: "postOnboarding.dialog.actions.deviceOnboarded.title",
  description: "",
  completed: true,
  lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.deviceOnboarded),
  shouldCompleteOnStart: false,
  startAction: () => {},
};

function buildFinishState(
  overrides: Partial<ReturnType<typeof useFinishOnboardingState>> = {},
): ReturnType<typeof useFinishOnboardingState> {
  return {
    deviceModelId: DeviceModelId.nanoX,
    postOnboardingInProgress: false,
    steps: [deviceStep],
    completedStepsAmount: 1,
    totalStepsAmount: 1,
    allStepsCompleted: true,
    ...overrides,
  };
}

describe("useFinishOnboardingWidgetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(track).mockClear();
    mockedUseFinishOnboardingState.mockReturnValue(buildFinishState());
  });

  it("should expose postOnboardingInProgress from useFinishOnboardingState", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({ postOnboardingInProgress: true }),
    );

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    expect(result.current.postOnboardingInProgress).toBe(true);
  });

  it("should expose stepper amounts from useFinishOnboardingState", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        completedStepsAmount: 3,
        totalStepsAmount: 3,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    expect(result.current.completedStepsAmount).toBe(3);
    expect(result.current.totalStepsAmount).toBe(3);
  });

  it("should call track when handleOpenFinishOnboardingDialog runs", () => {
    mockedUseFinishOnboardingState.mockReturnValue(buildFinishState());

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    act(() => {
      result.current.handleOpenFinishOnboardingDialog();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      deviceModelId: DeviceModelId.nanoX,
      button: "Post onboarding widget",
      flow: "post-onboarding",
    });
  });
});
