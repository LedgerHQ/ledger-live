import { PostOnboardingActionId, type Account } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "tests/testSetup";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import { usePostOnboardingActionViewModel } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/components/PostOnboardingAction/usePostOnboardingActionViewModel";

const requiredPostOnboardingActionProps = {
  deviceModelId: null as DeviceModelId | null,
  isLedgerSyncActive: false,
  accounts: [] as Account[],
  startAction: () => {},
  buttonLabelForAnalyticsEvent: "",
  shouldCompleteOnStart: false,
};

const defaultActionProps = {
  title: "A",
  description: "B",
  postOnboardingActionId: PostOnboardingActionId.buyCrypto,
  lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.buyCrypto),
  ...requiredPostOnboardingActionProps,
};

describe("usePostOnboardingActionViewModel", () => {
  it("should call onAction when onRowActivate runs and onAction is provided", () => {
    const onAction = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: false,
        onAction,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
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

  it("should not call onAction when completed", () => {
    const onAction = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionViewModel({
        ...defaultActionProps,
        completed: true,
        onAction,
      }),
    );
    act(() => {
      result.current.onRowActivate();
    });
    expect(onAction).not.toHaveBeenCalled();
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
