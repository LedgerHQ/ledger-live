import { renderHook } from "tests/testSetup";
import { useTrackOnboardingFlow, UseTrackOnboardingFlow } from "./useTrackOnboardingFlow";
import { track } from "../segment";
import { HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackOnboardingFlow", () => {
  const deviceMock = {
    modelId: "nanoX",
    wired: false,
  };

  const defaultArgs: UseTrackOnboardingFlow = {
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device: deviceMock,
    isTrackingEnabled: true,
    seedPathStatus: "restore_seed",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Restore with SRP' when seedPathStatus is 'restore_seed'", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "restore_seed" },
    });

    expect(track).toHaveBeenCalledWith(
      "Restore with SRP",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: "BLE",
        platform: "LLD",
        page: "Onboarding",
      }),
    );
  });

  it("should track 'Restore with Recover' when seedPathStatus is 'recover_seed'", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "recover_seed" },
    });

    expect(track).toHaveBeenCalledWith(
      "Restore with Recover",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: "BLE",
        platform: "LLD",
        page: "Onboarding",
      }),
    );
  });

  it("should not track events if location is not 'Onboarding flow'", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      //@ts-expect-error location is not of type HOOKS_TRACKING_LOCATIONS
      initialProps: { ...defaultArgs, location: "Other flow" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, device: wiredDeviceMock, seedPathStatus: "restore_seed" },
    });

    expect(track).toHaveBeenCalledWith(
      "Restore with SRP",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: "USB",
        platform: "LLD",
        page: "Onboarding",
      }),
    );
  });

  it("should not track anything if seedPathStatus is 'new_seed'", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "new_seed" },
    });

    expect(track).not.toHaveBeenCalled();
  });
});
