import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import { useDeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingConnectViewModel } from "./useDeviceOnboardingConnectViewModel";

const replace = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    replace,
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
  useIsFocused: () => true,
}));

jest.mock("../../hooks/DeviceOnboardingProvider", () => ({
  useDeviceOnboardingSession: jest.fn(),
  useDeviceOnboardingHost: () => undefined,
}));

const useSession = jest.mocked(useDeviceOnboardingSession);
const adopt = jest.fn();
const discard = jest.fn();

function session(overrides: Partial<DeviceOnboardingSession> = {}): DeviceOnboardingSession {
  return {
    adopt,
    discard,
    state: "readingState",
    error: null,
    ...overrides,
  } as DeviceOnboardingSession;
}

const connection = {
  compatDeviceId: "device-id",
  compatDeviceName: "Ledger Stax",
  compatDeviceWired: false,
  connectedDevice: { modelId: DmkDeviceModelId.STAX },
} as DeviceConnectionResult;

describe("useDeviceOnboardingConnectViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue(session());
  });

  it("should keep the pairing success up and offer the unlock sheet while the device is locked", () => {
    const { result, rerender } = renderHook(() => useDeviceOnboardingConnectViewModel());

    act(() => {
      result.current.onConnected(connection);
    });

    expect(replace).not.toHaveBeenCalled();
    expect(adopt).toHaveBeenCalledWith(connection);
    expect(result.current.unlockSheet).toBeNull();

    useSession.mockReturnValue(session({ state: "deviceLocked" }));
    rerender(undefined);

    expect(replace).not.toHaveBeenCalled();
    expect(result.current.unlockSheet).toEqual({
      deviceModelId: DeviceModelId.stax,
      deviceName: "Ledger Stax",
    });

    useSession.mockReturnValue(session({ state: "checks.checksIdle" }));
    rerender(undefined);

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(ScreenName.DeviceOnboardingFunnel, {
      pairedDeviceId: "device-id",
      wasReadOnlyAtEntry: true,
    });
  });

  it("should open the funnel when connecting the locked device fails", () => {
    const { result, rerender } = renderHook(() => useDeviceOnboardingConnectViewModel());

    act(() => {
      result.current.onConnected(connection);
    });
    useSession.mockReturnValue(
      session({ state: "deviceLocked", error: "Unable to connect to the device" }),
    );
    rerender(undefined);

    expect(result.current.unlockSheet).toBeNull();
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
