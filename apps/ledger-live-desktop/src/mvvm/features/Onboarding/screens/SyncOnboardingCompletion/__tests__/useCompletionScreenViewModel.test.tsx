/**
 * @jest-environment jsdom
 */
import { renderHook, act, withFlagOverrides } from "tests/testSetup";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import { State } from "~/renderer/reducers";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { useCompletionScreenViewModel } from "../useCompletionScreenViewModel";
import { AFTER_ONBOARDING_STATE, SettingsState } from "~/renderer/reducers/settings";

const mockRedirectToPostOnboarding = jest.fn();

jest.mock("~/renderer/hooks/useAutoRedirectToPostOnboarding", () => ({
  useRedirectToPostOnboardingCallback: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn().mockReturnValue({ state: { seedConfiguration: "new_seed" } }),
}));

const getInitialState = (modelId: DeviceModelId = DeviceModelId.stax): Partial<State> => ({
  devices: {
    devices: [],
    currentDevice: { modelId } as Device,
  },
});

describe("useCompletionScreenViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRedirectToPostOnboarding.mockClear();
    jest
      .mocked(useRedirectToPostOnboardingCallback)
      .mockReturnValue(mockRedirectToPostOnboarding);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  [DeviceModelId.stax, DeviceModelId.apex, DeviceModelId.europa].forEach(deviceId =>
    it(`should return ${deviceId} device ID and redirect to post onboarding`, () => {
      const initialState = getInitialState(deviceId);
      const { result, store } = renderHook(() => useCompletionScreenViewModel(), { initialState });

      expect(result.current.deviceModelId).toBe(deviceId);
      expect(result.current.seedConfiguration).toBe("new_seed");

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(mockRedirectToPostOnboarding).toHaveBeenCalledTimes(1);

      const { settings } = store.getState() as { settings: SettingsState };
      expect(settings.hasCompletedOnboarding).toBe(true);
      expect(settings.hasBeenRedirectedToPostOnboarding).toBe(false);
      expect(settings.hasBeenUpsoldRecover).toBe(false);
      expect(settings.lastOnboardedDevice).toHaveProperty("modelId", deviceId);
    }),
  );

  it("should redirect via useRedirectToPostOnboardingCallback when onboarding widget is enabled", () => {
    const deviceId = DeviceModelId.stax;
    const initialState = {
      ...getInitialState(deviceId),
      ...withFlagOverrides({
        onboardingWidget: { enabled: true },
      }),
    };

    renderHook(() => useCompletionScreenViewModel(), { initialState });

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(mockRedirectToPostOnboarding).toHaveBeenCalledTimes(1);
  });

  it("falls back to lastSeenDevice when currentDevice is null (disconnected)", () => {
    const deviceId = DeviceModelId.stax;
    const initialState: Partial<State> = {
      devices: {
        devices: [],
        currentDevice: null,
      },
      settings: {
        ...AFTER_ONBOARDING_STATE,
        lastSeenDevice: {
          modelId: deviceId,
          deviceInfo: {} as never,
          apps: [],
        },
      },
    };

    const { store } = renderHook(() => useCompletionScreenViewModel(), { initialState });

    const { settings } = store.getState() as { settings: SettingsState };
    expect(settings.lastOnboardedDevice).toHaveProperty("modelId", deviceId);
  });
});
