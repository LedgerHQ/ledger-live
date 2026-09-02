import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { act, renderHook } from "@testing-library/react-native";
import { createNotificationsPromptFeatureFlags } from "LLM/features/NotificationsPrompt/testUtils";
import type { DataOfUser } from "LLM/features/NotificationsPrompt";
import { NOTIFICATIONS_QA_SCENARIOS } from "../utils";
import { useNotificationsPromptQaViewModel } from "../useNotificationsPromptQaViewModel";

const mockOpenDrawer = jest.fn();
const mockNotifyFlowCompleted = jest.fn();
const mockIsDrawerPending = jest.fn(() => false);
const mockCancelPendingDrawer = jest.fn();

const qaState = {
  permissionStatus: AuthorizationStatus.NOT_DETERMINED as
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined,
  areNotificationsAllowed: false,
  transactionsAlertsCategory: false,
  hasCompletedOnboarding: true,
  isRatingsModalOpen: false,
  pushNotificationsDataOfUser: undefined as DataOfUser | undefined,
  brazePushNotifications: createNotificationsPromptFeatureFlags({ inactivityEnabled: true })
    .brazePushNotifications,
};

const mockSetPermissionStatus = jest.fn(
  (status: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]) => {
    qaState.permissionStatus = status;
  },
);
const mockUpdateUserData = jest.fn((data: DataOfUser) => {
  qaState.pushNotificationsDataOfUser = data;
});

jest.mock("~/context/hooks", () => ({
  useDispatch: () => (action: { type?: string; payload?: unknown }) => {
    if (action.type === "SET_NOTIFICATIONS") {
      const payload = action.payload as {
        areNotificationsAllowed?: boolean;
        transactionsAlertsCategory?: boolean;
      };
      if (typeof payload?.areNotificationsAllowed === "boolean") {
        qaState.areNotificationsAllowed = payload.areNotificationsAllowed;
      }
      if (typeof payload?.transactionsAlertsCategory === "boolean") {
        qaState.transactionsAlertsCategory = payload.transactionsAlertsCategory;
      }
    }
    if (action.type === "SETTINGS_COMPLETE_ONBOARDING" && typeof action.payload === "boolean") {
      qaState.hasCompletedOnboarding = action.payload;
    }
  },
  useSelector: (selector: (state: never) => unknown) =>
    selector({
      settings: {
        notifications: {
          areNotificationsAllowed: qaState.areNotificationsAllowed,
          transactionsAlertsCategory: qaState.transactionsAlertsCategory,
        },
        hasCompletedOnboarding: qaState.hasCompletedOnboarding,
      },
      ratings: { isRatingsModalOpen: qaState.isRatingsModalOpen },
    } as never),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => qaState.brazePushNotifications,
}));

jest.mock("LLM/hooks/useNotificationsPermission", () => ({
  useNotificationsPermission: () => ({
    permissionStatus: qaState.permissionStatus,
    setPermissionStatus: mockSetPermissionStatus,
  }),
}));

jest.mock("LLM/features/NotificationsPrompt/new/NotificationsPromptProvider", () => ({
  useNotificationsPrompt: () => ({
    notifyFlowCompleted: mockNotifyFlowCompleted,
    openDrawer: mockOpenDrawer,
    isDrawerPending: mockIsDrawerPending,
    cancelPendingDrawer: mockCancelPendingDrawer,
    tryTriggerPushNotificationDrawerAfterInactivity: jest.fn(),
    initPushNotificationsData: jest.fn(async () => ({})),
  }),
}));

jest.mock("LLM/features/NotificationsPrompt/hooks/useNotificationsData", () => ({
  useNotificationsData: () => ({
    pushNotificationsDataOfUser: qaState.pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore: mockUpdateUserData,
  }),
}));

describe("useNotificationsPromptQaViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDrawerPending.mockReturnValue(false);
    qaState.permissionStatus = AuthorizationStatus.NOT_DETERMINED;
    qaState.areNotificationsAllowed = false;
    qaState.transactionsAlertsCategory = false;
    qaState.hasCompletedOnboarding = true;
    qaState.isRatingsModalOpen = false;
    qaState.pushNotificationsDataOfUser = undefined;
  });

  it("should report Show drawer for the first prompt scenario", () => {
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());
    const firstPrompt = NOTIFICATIONS_QA_SCENARIOS.find(scenario => scenario.id === "first-prompt");

    act(() => {
      result.current.applyScenario(firstPrompt!);
    });

    expect(result.current.verdict).toBe("Show drawer");
    expect(result.current.reason).toBe("Eligible now");
    expect(result.current.forceOpenDrawerLabel).toContain(result.current.resolvedPromptTarget);
    expect(mockCancelPendingDrawer).toHaveBeenCalled();
  });

  it("should report Skip when the already opted in scenario is applied", () => {
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());
    const optedIn = NOTIFICATIONS_QA_SCENARIOS.find(scenario => scenario.id === "already-opted-in");

    act(() => {
      result.current.applyScenario(optedIn!);
    });

    expect(result.current.verdict).toBe("Skip");
    expect(result.current.reason).toBe("Already opted in");
    expect(result.current.rawReason).toBe("reason: fully_opted_in");
  });

  it("should restore captured baseline on reset", () => {
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());
    const optedIn = NOTIFICATIONS_QA_SCENARIOS.find(scenario => scenario.id === "already-opted-in");

    act(() => {
      result.current.applyScenario(optedIn!);
    });
    expect(qaState.areNotificationsAllowed).toBe(true);

    act(() => {
      result.current.onResetAll();
    });

    expect(mockSetPermissionStatus).toHaveBeenCalledWith(AuthorizationStatus.NOT_DETERMINED);
    expect(result.current.selectedSource).toBe("onboarding");
    expect(mockCancelPendingDrawer).toHaveBeenCalled();
  });

  it("should force-open the resolved prompt target", () => {
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());

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
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());

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
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());
    const inactive = NOTIFICATIONS_QA_SCENARIOS.find(scenario => scenario.id === "inactive-user");

    act(() => {
      result.current.applyScenario(inactive!);
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
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());

    act(() => {
      result.current.onMarkInactive();
    });

    expect(result.current.selectedSource).toBe("inactivity");
  });

  it("should mark after-action as eligible and keep two dismissals", () => {
    qaState.pushNotificationsDataOfUser = {
      dismissedOptInDrawerAtList: [1, 2, 3],
      dismissedPromptAtListByTarget: { globalPushNotifications: [1, 2, 3] },
      lastActionAt: Date.now(),
    };
    const { result } = renderHook(() => useNotificationsPromptQaViewModel());

    act(() => {
      result.current.onMarkRepromptable();
    });
    act(() => {
      result.current.onKeepTwoDismissals();
    });

    expect(mockUpdateUserData).toHaveBeenCalled();
  });
});
