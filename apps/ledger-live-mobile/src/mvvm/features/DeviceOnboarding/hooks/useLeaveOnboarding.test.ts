import type { DeviceOnboardingExitReason } from "@features/platform-device-onboarding";
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

  it("should offer Ledger Sync without the notifications prompt", () => {
    leave("offerLedgerSync", true);

    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });
});

function leave(reason: DeviceOnboardingExitReason, genuine: boolean) {
  const { result } = renderHook(() =>
    useLeaveOnboarding({
      device,
      navigateOnExit: true,
      wasReadOnlyAtEntry: false,
      isGenuine: () => genuine,
    }),
  );

  act(() => result.current(reason));
}
