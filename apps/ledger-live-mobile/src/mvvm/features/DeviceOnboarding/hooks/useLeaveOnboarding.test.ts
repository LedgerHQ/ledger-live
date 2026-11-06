import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "@tests/test-renderer";
import { useLeaveOnboarding } from "./useLeaveOnboarding";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNotifyFlowCompleted = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    getParent: () => ({
      reset: mockReset,
      getState: () => ({ routes: [{ name: "BaseOnboarding" }] }),
      getParent: () => undefined,
    }),
  }),
}));

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: mockNotifyFlowCompleted }),
}));

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

describe("useLeaveOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["completed", "userQuit"] as const)(
    "should ask for the notifications prompt when %s finishes a genuine onboarding",
    reason => {
      leave(reason, true);

      expect(mockNotifyFlowCompleted).toHaveBeenCalledTimes(1);
      expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
      expect(mockReset).toHaveBeenCalledTimes(1);
    },
  );

  it("should leave without the notifications prompt when the device is not genuine", () => {
    leave("userQuit", false);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("should leave a seeded fallback without the notifications prompt when a supported read fails", () => {
    const { result } = renderHook(() =>
      useLeaveOnboarding({
        device,
        navigateOnExit: true,
        wasReadOnlyAtEntry: false,
      }),
    );

    act(() =>
      result.current(
        "legacyFallback",
        machineContext({
          seeded: true,
          genuine: null,
          firmwareVersion: "2.4.0",
          deviceModelId: DmkDeviceModelId.NANO_X,
        }),
      ),
    );

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("should go back when a seeded device on an old firmware leaves through the legacy path", () => {
    const { result } = renderHook(() =>
      useLeaveOnboarding({
        device,
        navigateOnExit: true,
        wasReadOnlyAtEntry: false,
      }),
    );

    act(() =>
      result.current(
        "legacyFallback",
        machineContext({
          seeded: true,
          genuine: null,
          firmwareVersion: "1.0.0",
          deviceModelId: DmkDeviceModelId.NANO_X,
        }),
      ),
    );

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("should ask for the notifications prompt when a genuine seeded device leaves through the legacy path", () => {
    const { result } = renderHook(() =>
      useLeaveOnboarding({
        device,
        navigateOnExit: true,
        wasReadOnlyAtEntry: false,
      }),
    );

    act(() => result.current("legacyFallback", machineContext({ seeded: true, genuine: true })));

    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("should offer Ledger Sync without the notifications prompt", () => {
    leave("offerLedgerSync", true);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("should do nothing when an unseeded device reaches done", () => {
    const { store } = leave("completed", true, false);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  it("should open the portfolio without completing when an unseeded device quits", () => {
    const { store } = leave("userQuit", true, false);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  it("should open the portfolio without completing when an unseeded device quits before a genuine verdict", () => {
    leave("userQuit", false, false);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});

function leave(
  reason: DeviceOnboardingExitReason,
  genuine: boolean,
  onboardedOnEntry: boolean | null = null,
) {
  const rendered = renderHook(() =>
    useLeaveOnboarding({
      device,
      navigateOnExit: true,
      wasReadOnlyAtEntry: false,
    }),
  );

  act(() => rendered.result.current(reason, machineContext({ genuine, onboardedOnEntry })));
  return rendered;
}

function machineContext({
  genuine,
  seeded = false,
  onboardedOnEntry = null,
  firmwareVersion = "2.4.0",
  deviceModelId = DmkDeviceModelId.STAX,
}: {
  genuine: boolean | null;
  seeded?: boolean;
  onboardedOnEntry?: boolean | null;
  firmwareVersion?: string | null;
  deviceModelId?: DmkDeviceModelId;
}): DeviceOnboardingContext {
  return {
    sessionId: "session-1",
    isOnboarded: seeded,
    onboardedOnEntry,
    firmwareVersion,
    deviceModelId,
    genuineVerdict: genuine === null ? null : { sessionId: "session-1", isGenuine: genuine },
  } as DeviceOnboardingContext;
}
