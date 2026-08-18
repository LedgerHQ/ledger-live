import { act, renderHook } from "tests/testSetup";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import i18n from "~/renderer/i18n/init";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import useFinishOnboardingDialogViewModel from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialogViewModel";
import { useFinishOnboardingState } from "LLD/features/FinishOnboarding/hooks/useFinishOnboardingState";
import { track } from "~/renderer/analytics/segment";

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
    allStepsCompleted: false,
    ...overrides,
  };
}

describe("useFinishOnboardingDialogViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFinishOnboardingState.mockReturnValue(buildFinishState());
  });

  it("should reflect dialog open state from the dialogs slice", () => {
    const { result } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: { dialogs: { FINISH_POST_ONBOARDING: true } },
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should mark hasBeenRedirectedToPostOnboarding when the dialog is open", () => {
    const { store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: {
        dialogs: { FINISH_POST_ONBOARDING: true },
        settings: { hasBeenRedirectedToPostOnboarding: false },
      },
    });

    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
  });

  it("should expose finish steps from useFinishOnboardingState", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        steps: [
          deviceStep,
          {
            id: PostOnboardingActionId.assetsTransfer,
            title: "postOnboarding.dialog.actions.assetsTransfer.title",
            description: "postOnboarding.dialog.actions.assetsTransfer.description",
            completed: false,
            lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.assetsTransfer),
            shouldCompleteOnStart: false,
            startAction: () => {},
          },
        ],
        completedStepsAmount: 1,
        totalStepsAmount: 2,
        allStepsCompleted: false,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.steps.map(step => step.id)).toEqual([
      PostOnboardingActionId.deviceOnboarded,
      PostOnboardingActionId.assetsTransfer,
    ]);
    for (const step of result.current.steps) {
      expect(typeof step.lumenSymbol).toBe("function");
      expect(typeof step.startAction).toBe("function");
    }
  });

  it("should set completed and total steps from useFinishOnboardingState", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        steps: [deviceStep, { ...deviceStep, id: PostOnboardingActionId.personalizeMock }],
        completedStepsAmount: 2,
        totalStepsAmount: 4,
        allStepsCompleted: false,
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.totalStepsAmount).toBe(4);
    expect(result.current.completedStepsAmount).toBe(2);
  });

  it("should set allStepsCompleted when every optional step is completed", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: true,
        steps: [deviceStep],
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.allStepsCompleted).toBe(true);
  });

  it("should bind onGotItLabel to postOnboarding.dialog.primaryLabel", () => {
    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.onGotItLabel).toBe(i18n.t("postOnboarding.dialog.primaryLabel"));
  });

  it("should set allStepsCompleted to false when some optional step is not completed", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: false,
        steps: [
          deviceStep,
          { ...deviceStep, id: PostOnboardingActionId.personalizeMock, completed: false },
        ],
      }),
    );

    const { result } = renderHook(() => useFinishOnboardingDialogViewModel());

    expect(result.current.allStepsCompleted).toBe(false);
  });

  it("should close the finish post-onboarding dialog when onClose runs", () => {
    const { result, store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: { dialogs: { FINISH_POST_ONBOARDING: true } },
    });

    act(() => {
      result.current.onClose();
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked2", {
      button: "Close",
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
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
    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked2", {
      button: "Got it",
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
  });

  it("should auto-close the dialog and dismiss the widget when all optional steps become complete", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: true,
        postOnboardingInProgress: true,
        steps: [deviceStep, { ...deviceStep, id: PostOnboardingActionId.personalizeMock }],
        completedStepsAmount: 2,
        totalStepsAmount: 2,
      }),
    );

    const { store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: {
        dialogs: { FINISH_POST_ONBOARDING: true },
        postOnboarding: { ...postOnboardingInitialState, postOnboardingInProgress: true },
      },
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
    expect(store.getState().postOnboarding.walletEntryPointDismissed).toBe(true);
    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    expect(jest.mocked(track)).toHaveBeenCalledWith("Post-onboarding widget completed", {
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
  });

  it("should auto-dismiss and finish post-onboarding when only the device step exists", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: true,
        postOnboardingInProgress: true,
        steps: [deviceStep],
      }),
    );

    const { store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: {
        dialogs: { FINISH_POST_ONBOARDING: true },
        postOnboarding: { ...postOnboardingInitialState, postOnboardingInProgress: true },
      },
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
    expect(store.getState().postOnboarding.walletEntryPointDismissed).toBe(true);
    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    expect(jest.mocked(track)).toHaveBeenCalledWith("Post-onboarding widget completed", {
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
  });

  it("should not auto-dismiss on app startup when post-onboarding was never started", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: true,
        postOnboardingInProgress: false,
        steps: [deviceStep],
      }),
    );

    const { store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: {
        dialogs: { FINISH_POST_ONBOARDING: false },
        postOnboarding: postOnboardingInitialState,
      },
    });

    expect(store.getState().postOnboarding.walletEntryPointDismissed).toBe(false);
    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    expect(jest.mocked(track)).not.toHaveBeenCalledWith(
      "Post-onboarding widget completed",
      expect.anything(),
    );
  });

  it("should not auto-dismiss while any optional step is still pending", () => {
    mockedUseFinishOnboardingState.mockReturnValue(
      buildFinishState({
        allStepsCompleted: false,
        steps: [
          deviceStep,
          { ...deviceStep, id: PostOnboardingActionId.personalizeMock, completed: false },
        ],
      }),
    );

    const { store } = renderHook(() => useFinishOnboardingDialogViewModel(), {
      initialState: {
        dialogs: { FINISH_POST_ONBOARDING: true },
        postOnboarding: { ...postOnboardingInitialState, postOnboardingInProgress: true },
      },
    });

    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(true);
    expect(store.getState().postOnboarding.walletEntryPointDismissed).toBe(false);
    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });
});
