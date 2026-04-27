import { PostOnboardingActionId, type Account } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "tests/testSetup";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import { usePostOnboardingActionViewModel } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/components/PostOnboardingAction/usePostOnboardingActionViewModel";
import { track } from "~/renderer/analytics/segment";

const completeActionMock = jest.fn();
const openActivationDrawerMock = jest.fn();

jest.mock("~/renderer/components/PostOnboardingHub/logic/useCompleteAction", () => ({
  useCompleteActionCallback: () => completeActionMock,
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel", () => ({
  __esModule: true,
  default: () => ({
    openDrawer: openActivationDrawerMock,
  }),
}));

const requiredPostOnboardingActionProps = {
  deviceModelId: null as DeviceModelId | null,
  isLedgerSyncActive: false,
  accounts: [] as Account[],
  startAction: () => {},
  buttonLabelForAnalyticsEvent: "",
  shouldCompleteOnStart: false,
  getIsAlreadyCompletedByState: () => false,
};

const defaultActionProps = {
  title: "A",
  description: "B",
  postOnboardingActionId: PostOnboardingActionId.buyCrypto,
  lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.buyCrypto),
  ...requiredPostOnboardingActionProps,
};

describe("usePostOnboardingActionViewModel", () => {
  beforeEach(() => {
    completeActionMock.mockClear();
    openActivationDrawerMock.mockClear();
    jest.mocked(track).mockClear();
  });

  it("should call startAction with expected hub callbacks when row is activated", () => {
    const startAction = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: false,
        deviceModelId: DeviceModelId.nanoX,
        startAction,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(startAction).toHaveBeenCalledTimes(1);
    expect(startAction).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceModelId: DeviceModelId.nanoX,
        openActivationDrawer: openActivationDrawerMock,
        protectId: expect.any(String),
      }),
    );
  });

  it("should close the finish post-onboarding dialog when onRowActivate runs", () => {
    const { result, store } = renderHook(
      () =>
        usePostOnboardingActionViewModel({
          ...defaultActionProps,
          completed: false,
        }),
      { initialState: { dialogs: { FINISH_POST_ONBOARDING: true } } },
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
  });

  it("should not call startAction when completed", () => {
    const startAction = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: true,
        deviceModelId: DeviceModelId.nanoX,
        startAction,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(startAction).not.toHaveBeenCalled();
  });

  it("should not call startAction when completion comes from getIsAlreadyCompletedByState", () => {
    const startAction = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: false,
        deviceModelId: DeviceModelId.nanoX,
        startAction,
        getIsAlreadyCompletedByState: () => true,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(startAction).not.toHaveBeenCalled();
  });

  it("should complete the action when shouldCompleteOnStart is true", () => {
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: false,
        deviceModelId: DeviceModelId.nanoX,
        postOnboardingActionId: PostOnboardingActionId.syncAccounts,
        shouldCompleteOnStart: true,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(completeActionMock).toHaveBeenCalledWith(PostOnboardingActionId.syncAccounts);
  });

  it("should send analytics when button label and deviceModelId are provided", () => {
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: false,
        buttonLabelForAnalyticsEvent: "cta_label",
        deviceModelId: DeviceModelId.nanoX,
      }),
    );

    act(() => {
      result.current.onRowActivate();
    });

    expect(track).toHaveBeenCalledWith("button_clicked2", {
      button: "cta_label",
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
  });

  it("should pass through postOnboardingActionId and lumenSymbol", () => {
    const lumenSymbol = getLumenSymbolForActionId(PostOnboardingActionId.syncAccounts);
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        postOnboardingActionId: PostOnboardingActionId.syncAccounts,
        lumenSymbol,
        completed: false,
      }),
    );
    expect(result.current.postOnboardingActionId).toBe(PostOnboardingActionId.syncAccounts);
    expect(result.current.lumenSymbol).toBe(lumenSymbol);
  });
});
