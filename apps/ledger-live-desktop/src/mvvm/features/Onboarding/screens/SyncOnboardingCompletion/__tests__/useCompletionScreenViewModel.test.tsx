/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "tests/testSetup";
import { useRedirectToPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding";
import { State } from "~/renderer/reducers";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { useCompletionScreenViewModel } from "../useCompletionScreenViewModel";
import { SettingsState } from "~/renderer/reducers/settings";

jest.mock("~/renderer/hooks/useAutoRedirectToPostOnboarding", () => ({
  ...jest.requireActual("~/renderer/hooks/useAutoRedirectToPostOnboarding"),
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
    jest.mocked(useRedirectToPostOnboardingCallback).mockReset();
  });

  [DeviceModelId.stax, DeviceModelId.apex, DeviceModelId.europa].forEach(deviceId =>
    it(`should return ${deviceId} device ID and redirect to post onboarding`, async () => {
      const initialState = getInitialState(deviceId);
      const { result, store } = renderHook(() => useCompletionScreenViewModel(), { initialState });

      expect(result.current.deviceModelId).toBe(deviceId);
      expect(result.current.seedConfiguration).toBe("new_seed");

      await waitFor(
        () => {
          expect(useRedirectToPostOnboardingCallback).toHaveBeenCalled();
        },
        {
          timeout: 7000,
        },
      );

      const { settings } = store.getState() as { settings: SettingsState };
      expect(settings.hasCompletedOnboarding).toBe(true);
      expect(settings.hasBeenRedirectedToPostOnboarding).toBe(false);
      expect(settings.hasBeenUpsoldRecover).toBe(false);
      expect(settings.lastOnboardedDevice).toHaveProperty("modelId", deviceId);
    }),
  );
});
