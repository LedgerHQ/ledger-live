import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";
import createStore from "~/state-manager/configureStore";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingHubState } from "@ledgerhq/types-live";
import { useWidgetCardViewModel } from "../useWidgetCardViewModel";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback");

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);
const mockedUseNavigateToPostOnboardingHubCallback = jest.mocked(
  useNavigateToPostOnboardingHubCallback,
);

function buildHubState(overrides: Partial<PostOnboardingHubState> = {}): PostOnboardingHubState {
  return {
    deviceModelId: DeviceModelId.nanoX,
    lastActionCompleted: null,
    actionsState: [],
    postOnboardingInProgress: false,
    ...overrides,
  };
}

describe("useWidgetCardViewModel", () => {
  const navigateToPostOnboardingHub = jest.fn();

  beforeEach(() => {
    mockedUseNavigateToPostOnboardingHubCallback.mockReturnValue(navigateToPostOnboardingHub);
    jest.mocked(track).mockClear();
  });

  it("should expose postOnboardingInProgress from the hub state", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({ postOnboardingInProgress: true }),
    );

    const { result } = renderHook(() => useWidgetCardViewModel());

    expect(result.current.postOnboardingInProgress).toBe(true);
  });

  it("should derive currentStep as findIndex(lastCompleted) + 2 and totalSteps as actions length + 1", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded },
      { id: PostOnboardingActionId.assetsTransfer },
      { id: PostOnboardingActionId.buyCrypto },
    ] as PostOnboardingHubState["actionsState"];
    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState,
        lastActionCompleted: { id: PostOnboardingActionId.assetsTransfer } as NonNullable<
          PostOnboardingHubState["lastActionCompleted"]
        >,
      }),
    );

    const { result } = renderHook(() => useWidgetCardViewModel());

    expect(result.current.currentStep).toBe(3);
    expect(result.current.totalSteps).toBe(4);
  });

  it("should use step 1 when no action is marked as last completed", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState: [
          { id: PostOnboardingActionId.buyCrypto },
        ] as PostOnboardingHubState["actionsState"],
        lastActionCompleted: null,
      }),
    );

    const { result } = renderHook(() => useWidgetCardViewModel());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.totalSteps).toBe(2);
  });

  it("should call track and navigate when handleNavigateToPostOnboardingHub runs", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState());

    const { result } = renderHook(() => useWidgetCardViewModel());

    act(() => {
      result.current.handleNavigateToPostOnboardingHub();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      deviceModelId: DeviceModelId.nanoX,
      button: "Post onboarding widget",
      flow: "post-onboarding",
    });
    expect(navigateToPostOnboardingHub).toHaveBeenCalledTimes(1);
  });

  it("should dispatch hidePostOnboardingWalletEntryPoint when handleHidePostOnboardingHubBanner runs", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState());

    const store = createStore({ state: {} as State, dbMiddleware });
    const dispatchSpy = jest.spyOn(store, "dispatch");

    const { result } = renderHook(() => useWidgetCardViewModel(), { store });

    act(() => {
      result.current.handleHidePostOnboardingHubBanner();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(hidePostOnboardingWalletEntryPoint());
  });
});
