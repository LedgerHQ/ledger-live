/**
 * @jest-environment jsdom
 */
import { renderHook, act, withFlagOverrides } from "tests/testSetup";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import { useOpenRecoverCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useOpenRecoverCallback";
import { State } from "~/renderer/reducers";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { useCompletionScreenViewModel } from "../useCompletionScreenViewModel";
import { SettingsState } from "~/renderer/reducers/settings";

const mockNavigate = jest.fn();
const mockOpenFinishOnboardingDialog = jest.fn();
const mockRedirectToPostOnboarding = jest.fn();
const mockOpenRecoverUpsell = jest.fn();

jest.mock("~/renderer/hooks/useAutoRedirectToPostOnboarding", () => ({
  useRedirectToPostOnboardingCallback: jest.fn(),
}));

jest.mock("~/renderer/hooks/useAutoRedirectToPostOnboarding/useOpenRecoverCallback", () => ({
  useOpenRecoverCallback: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn().mockReturnValue({ state: { seedConfiguration: "new_seed" } }),
  useNavigate: () => mockNavigate,
}));

jest.mock(
  "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog",
  () => ({
    __esModule: true,
    default: () => ({
      handleOpen: mockOpenFinishOnboardingDialog,
    }),
  }),
);

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
    mockNavigate.mockClear();
    mockOpenFinishOnboardingDialog.mockClear();
    mockOpenRecoverUpsell.mockClear();
    jest.mocked(useRedirectToPostOnboardingCallback).mockReturnValue(mockRedirectToPostOnboarding);
    jest.mocked(useOpenRecoverCallback).mockReturnValue(mockOpenRecoverUpsell);
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
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOpenFinishOnboardingDialog).not.toHaveBeenCalled();
      expect(mockOpenRecoverUpsell).not.toHaveBeenCalled();

      const { settings } = store.getState() as { settings: SettingsState };
      expect(settings.hasCompletedOnboarding).toBe(true);
      expect(settings.hasBeenRedirectedToPostOnboarding).toBe(false);
      expect(settings.hasBeenUpsoldRecover).toBe(false);
      expect(settings.lastOnboardedDevice).toHaveProperty("modelId", deviceId);
    }),
  );

  it("should navigate home and open recover upsell with finish-onboarding continuation when Wallet40 finish widget is enabled", () => {
    const deviceId = DeviceModelId.stax;
    const initialState = {
      ...getInitialState(deviceId),
      ...withFlagOverrides({
        lwdWallet40: {
          enabled: true,
          params: { finishOnboardingWidget: true },
        },
      }),
    };

    renderHook(() => useCompletionScreenViewModel(), { initialState });

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(mockRedirectToPostOnboarding).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(mockOpenRecoverUpsell).toHaveBeenCalledTimes(1);
    expect(mockOpenRecoverUpsell).toHaveBeenCalledWith({
      fallbackRedirection: mockOpenFinishOnboardingDialog,
      navigationState: { afterUpsell: "openFinishOnboardingDialog" },
    });
    expect(mockOpenFinishOnboardingDialog).not.toHaveBeenCalled();
  });
});
