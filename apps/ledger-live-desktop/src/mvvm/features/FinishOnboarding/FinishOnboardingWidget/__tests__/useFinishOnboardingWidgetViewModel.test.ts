import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingHubState } from "@ledgerhq/types-live";
import { useFinishOnboardingWidgetViewModel } from "LLD/features/FinishOnboarding/FinishOnboardingWidget/useFinishOnboardingWidgetViewModel";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

function buildHubState(overrides: Partial<PostOnboardingHubState> = {}): PostOnboardingHubState {
  return {
    deviceModelId: DeviceModelId.nanoX,
    lastActionCompleted: null,
    actionsState: [],
    postOnboardingInProgress: false,
    ...overrides,
  };
}

describe("useFinishOnboardingWidgetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(track).mockClear();
    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState());
  });

  it("should expose postOnboardingInProgress from the hub state", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({ postOnboardingInProgress: true }),
    );

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    expect(result.current.postOnboardingInProgress).toBe(true);
  });

  it("should derive completedActionsAmount as completed count + 1 and totalActionsAmount as filtered length + 1 (buyCrypto excluded from scope)", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.assetsTransfer, completed: true },
      { id: PostOnboardingActionId.buyCrypto, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState({ actionsState }));

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    expect(result.current.completedActionsAmount).toBe(3);
    expect(result.current.totalActionsAmount).toBe(3);
  });

  it("should use amount 1 / 2 when a single non-buyCrypto action is not completed", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState: [
          { id: PostOnboardingActionId.personalizeMock, completed: false },
        ] as PostOnboardingHubState["actionsState"],
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingWidgetViewModel());

    expect(result.current.completedActionsAmount).toBe(1);
    expect(result.current.totalActionsAmount).toBe(2);
  });

  it("should call track when handleOpenFinishOnboardingDialog runs", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState());

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
