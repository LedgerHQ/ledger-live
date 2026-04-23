import { act, renderHook } from "tests/testSetup";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingHubState } from "@ledgerhq/types-live";
import i18n from "~/renderer/i18n/init";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import useFinishOnboardingDialogViewModel from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialogViewModel";

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

describe("useFinishOnboardingDialogViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePostOnboardingHubState.mockReturnValue(buildHubState());
  });

  it("should reflect dialog open state from the dialogs slice", () => {
    const { result } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: { dialogs: { FINISH_POST_ONBOARDING: true } },
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should exclude buyCrypto from actions", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.assetsTransfer, completed: false },
      { id: PostOnboardingActionId.buyCrypto, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.actions.map(a => a.id)).toEqual([
      PostOnboardingActionId.deviceOnboarded,
      PostOnboardingActionId.assetsTransfer,
    ]);
    for (const action of result.current.actions) {
      expect(typeof action.lumenSymbol).toBe("function");
      expect(action.lumenSymbol).toBe(getLumenSymbolForActionId(action.id));
      expect(typeof action.startAction).toBe("function");
    }
  });

  it("should set completed and total actions from the finish list (buyCrypto excluded)", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.assetsTransfer, completed: false },
      { id: PostOnboardingActionId.buyCrypto, completed: true },
      { id: PostOnboardingActionId.personalizeMock, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.totalActionsAmount).toBe(4);
    expect(result.current.completedActionsAmount).toBe(2);
  });

  it("should set allActionsCompleted when all finish list actions are completed", () => {
    const actionsState = [
      { id: PostOnboardingActionId.buyCrypto, completed: true },
    ] as PostOnboardingHubState["actionsState"];

    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.allActionsCompleted).toBe(true);
  });

  it("should bind onGotItLabel to postOnboarding.dialog.primaryLabel", () => {
    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.onGotItLabel).toBe(i18n.t("postOnboarding.dialog.primaryLabel"));
  });

  it("should set allActionsCompleted to false when some action is not completed", () => {
    const actionsState = [
      { id: PostOnboardingActionId.buyCrypto, completed: true },
      { id: PostOnboardingActionId.personalizeMock, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    mockedUsePostOnboardingHubState.mockReturnValue(
      buildHubState({
        actionsState,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.allActionsCompleted).toBe(false);
  });

  it("should close the finish post-onboarding dialog when onClose runs", () => {
    const { result, store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: { dialogs: { FINISH_POST_ONBOARDING: true } },
    });

    act(() => {
      result.current.onClose();
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
  });

  it("should close the dialog and dismiss the post-onboarding wallet entry point when onGotIt runs", () => {
    const { result, store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: { dialogs: { FINISH_POST_ONBOARDING: true } },
    });

    act(() => {
      result.current.onGotIt();
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
    expect(store.getState().postOnboarding.walletEntryPointDismissed).toBe(true);
  });
});
