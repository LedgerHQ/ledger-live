import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { createNotificationsPromptFeatureFlags } from "LLM/features/NotificationsPrompt/testUtils";
import type { DataOfUser } from "LLM/features/NotificationsPrompt";
import { NOTIFICATIONS_QA_SCENARIOS } from "../utils";
import { useNotificationsPromptQaViewModel } from "../useNotificationsPromptQaViewModel";

type PermissionStatus = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const mockOpenDrawer = jest.fn();
const mockNotifyFlowCompleted = jest.fn();
const mockIsDrawerPending = jest.fn(() => false);
const mockCancelPendingDrawer = jest.fn();

/** State the ViewModel reads through native-backed hooks rather than Redux. */
const nativeState: {
  permissionStatus: PermissionStatus | undefined;
  pushNotificationsDataOfUser: DataOfUser | undefined;
} = {
  permissionStatus: AuthorizationStatus.NOT_DETERMINED,
  pushNotificationsDataOfUser: undefined,
};

const mockSetPermissionStatus = jest.fn((status: PermissionStatus) => {
  nativeState.permissionStatus = status;
});
const mockUpdateUserData = jest.fn((data: DataOfUser) => {
  nativeState.pushNotificationsDataOfUser = data;
});

jest.mock("LLM/hooks/useNotificationsPermission", () => ({
  useNotificationsPermission: () => ({
    permissionStatus: nativeState.permissionStatus,
    setPermissionStatus: mockSetPermissionStatus,
  }),
}));

jest.mock("LLM/features/NotificationsPrompt/new/NotificationsPromptProvider", () => ({
  useNotificationsPrompt: () => ({
    notifyFlowCompleted: mockNotifyFlowCompleted,
    openDrawer: mockOpenDrawer,
    isDrawerPending: mockIsDrawerPending,
    cancelPendingDrawer: mockCancelPendingDrawer,
  }),
}));

jest.mock("LLM/features/NotificationsPrompt/hooks/useNotificationsData", () => ({
  useNotificationsData: () => ({
    pushNotificationsDataOfUser: nativeState.pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore: mockUpdateUserData,
  }),
}));

const notificationsPromptFlags = createNotificationsPromptFeatureFlags({
  inactivityEnabled: true,
});

/**
 * Real store seeded with the notifications prompt flags, so feature flags resolve
 * through `useFeature` and `setOverride` instead of being mocked.
 */
function renderViewModel() {
  return renderHook(() => useNotificationsPromptQaViewModel(), {
    overrideInitialState: withFlagOverrides(notificationsPromptFlags),
  });
}

function getScenario(id: string) {
  const scenario = NOTIFICATIONS_QA_SCENARIOS.find(candidate => candidate.id === id);
  if (!scenario) throw new Error(`Unknown QA scenario: ${id}`);
  return scenario;
}

describe("useNotificationsPromptQaViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDrawerPending.mockReturnValue(false);
    nativeState.permissionStatus = AuthorizationStatus.NOT_DETERMINED;
    nativeState.pushNotificationsDataOfUser = undefined;
  });

  it("should report Show drawer for the first prompt scenario", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("first-prompt"));
    });

    expect(result.current.verdict).toBe("Show drawer");
    expect(result.current.reason).toBe("Eligible now");
    expect(result.current.forceOpenDrawerLabel).toContain(result.current.resolvedPromptTarget);
    expect(mockCancelPendingDrawer).toHaveBeenCalled();
  });

  it("should not apply a scenario before the baseline is captured", () => {
    nativeState.permissionStatus = undefined;
    const { result, store } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("already-opted-in"));
    });

    expect(result.current.isBaselineCaptured).toBe(false);
    expect(store.getState().settings.notifications.areNotificationsAllowed).toBe(true);
    expect(mockSetPermissionStatus).not.toHaveBeenCalled();
    expect(mockUpdateUserData).not.toHaveBeenCalled();
    expect(mockCancelPendingDrawer).not.toHaveBeenCalled();
  });

  it("should report Skip when the already opted in scenario is applied", () => {
    const { result, store } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("already-opted-in"));
    });

    expect(store.getState().settings.notifications.areNotificationsAllowed).toBe(true);
    expect(result.current.verdict).toBe("Skip");
    expect(result.current.reason).toBe("Already opted in");
    expect(result.current.rawReason).toBe("reason: fully_opted_in");
  });

  it("should keep the feature flag enabled through the store when a scenario runs", () => {
    const { result, store } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("first-prompt"));
    });

    expect(store.getState().featureFlags.overrides.brazePushNotifications?.enabled).toBe(true);
  });

  it("should restore captured baseline on reset", () => {
    const { result, store } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("too-soon"));
    });
    expect(store.getState().settings.notifications.areNotificationsAllowed).toBe(false);

    act(() => {
      result.current.onResetAll();
    });

    expect(store.getState().settings.notifications.areNotificationsAllowed).toBe(true);
    expect(store.getState().featureFlags.overrides.brazePushNotifications).toBeUndefined();
    expect(mockSetPermissionStatus).toHaveBeenCalledWith(AuthorizationStatus.NOT_DETERMINED);
    expect(result.current.selectedSource).toBe("onboarding");
    expect(mockCancelPendingDrawer).toHaveBeenCalled();
  });

  it("should force-open the resolved prompt target", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onForceOpenDrawer();
    });

    expect(mockCancelPendingDrawer).toHaveBeenCalled();
    expect(mockOpenDrawer).toHaveBeenCalledWith(
      "onboarding",
      0,
      result.current.resolvedPromptTarget,
    );
  });

  it("should call notifyFlowCompleted for after-action production triggers", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.setSelectedSource("send");
    });
    act(() => {
      result.current.onTriggerProductionDrawer();
    });

    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("send");
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  it("should open the inactivity drawer when production rules allow it", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.applyScenario(getScenario("inactive-user"));
    });
    act(() => {
      result.current.onTriggerProductionDrawer();
    });

    expect(result.current.verdict).toBe("Show drawer");
    expect(mockOpenDrawer).toHaveBeenCalledWith(
      "inactivity",
      expect.any(Number),
      result.current.resolvedPromptTarget,
    );
  });

  it("should switch to inactivity after making the user inactive", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onMarkInactive();
    });

    expect(result.current.selectedSource).toBe("inactivity");
  });

  it("should mark after-action as eligible and keep two dismissals", () => {
    nativeState.pushNotificationsDataOfUser = {
      dismissedOptInDrawerAtList: [1, 2, 3],
      dismissedPromptAtListByTarget: { globalPushNotifications: [1, 2, 3] },
      lastActionAt: Date.now(),
    };
    const { result } = renderViewModel();

    act(() => {
      result.current.onMarkRepromptable();
    });
    act(() => {
      result.current.onKeepTwoDismissals();
    });

    expect(mockUpdateUserData).toHaveBeenCalledTimes(2);
    expect(
      mockUpdateUserData.mock.calls[1][0].dismissedPromptAtListByTarget?.globalPushNotifications,
    ).toHaveLength(2);
  });
});
