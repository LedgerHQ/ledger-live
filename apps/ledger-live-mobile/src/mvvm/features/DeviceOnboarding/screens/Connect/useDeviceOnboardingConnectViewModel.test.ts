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

function sessionAt(state: string, onboardedOnEntry: boolean) {
  return { state, context: { onboardedOnEntry } } as Partial<DeviceOnboardingSession>;
}

const unseededAwaitingStart = sessionAt("awaitingStart", false);

function pair(modelId: DmkDeviceModelId, next: Partial<DeviceOnboardingSession>) {
  const hook = renderHook(() => useDeviceOnboardingConnectViewModel());
  act(() => {
    hook.result.current.onConnected({
      ...connection,
      connectedDevice: { ...connection.connectedDevice, modelId },
    });
  });
  useSession.mockReturnValue(session(next));
  hook.rerender(undefined);
  return hook;
}

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

  describe("language prompt", () => {
    it.each([
      [DmkDeviceModelId.STAX, DeviceModelId.stax],
      [DmkDeviceModelId.FLEX, DeviceModelId.europa],
      [DmkDeviceModelId.APEX, DeviceModelId.apex],
    ])("should offer the language for an unseeded %s at awaitingStart", (dmkId, modelId) => {
      const { result } = pair(dmkId, unseededAwaitingStart);

      expect(result.current.languagePrompt).toEqual({
        device: expect.objectContaining({ deviceId: "device-id", modelId }),
        onDone: expect.any(Function),
      });
      expect(replace).not.toHaveBeenCalled();
    });

    it("should open the funnel only once the language prompt is done", () => {
      const { result, rerender } = pair(DmkDeviceModelId.STAX, unseededAwaitingStart);
      expect(replace).not.toHaveBeenCalled();

      act(() => {
        result.current.languagePrompt?.onDone?.();
      });
      rerender(undefined);

      expect(replace).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith(ScreenName.DeviceOnboardingFunnel, {
        pairedDeviceId: "device-id",
        wasReadOnlyAtEntry: true,
      });
    });

    it.each<[string, DmkDeviceModelId, Partial<DeviceOnboardingSession>]>([
      ["a seeded Stax", DmkDeviceModelId.STAX, sessionAt("awaitingStart", true)],
      [
        "an unseeded Stax going straight to the checks",
        DmkDeviceModelId.STAX,
        sessionAt("checks.checksIdle", false),
      ],
      ["an unseeded Nano X", DmkDeviceModelId.NANO_X, unseededAwaitingStart],
      ["an unseeded Nano S Plus", DmkDeviceModelId.NANO_SP, unseededAwaitingStart],
    ])("should not offer the language for %s and open the funnel", (_, dmkId, next) => {
      const { result } = pair(dmkId, next);

      expect(result.current.languagePrompt).toBeNull();
      expect(replace).toHaveBeenCalledTimes(1);
    });
  });
});
