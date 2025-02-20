import { renderHook } from "@testing-library/react-native";
import { useTrackOnboardingFlow, UseTrackOnboardingFlow } from "./useTrackOnboardingFlow";
import { track } from "../segment";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackOnboardingFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: false,
  };

  const defaultArgs: UseTrackOnboardingFlow = {
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device: deviceMock,
    seedPathStatus: undefined,
    isPaired: undefined,
    isCLSLoading: undefined,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not track any event if location is not onboardingFlow", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      //@ts-expect-error: forcing a wrong location for testing
      initialProps: { ...defaultArgs, location: "OtherLocation" },
    });
    expect(track).not.toHaveBeenCalled();
  });

  it('should track "Set-up as a new device" when seedPathStatus is "new_seed"', () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "new_seed" },
    });
    expect(track).toHaveBeenCalledWith(
      "Set-up as a new device",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it('should track "Restore with Secret Recovery Phrase" when seedPathStatus is "restore_seed"', () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "restore_seed" },
    });
    expect(track).toHaveBeenCalledWith(
      "Restore with Secret Recovery Phrase",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it('should track "Restore with Recover" when seedPathStatus is "recover_seed"', () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "recover_seed" },
    });
    expect(track).toHaveBeenCalledWith(
      "Restore with Recover",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it('should track "User choose Restore" when seedPathStatus is "choice_restore_direct_or_recover"', () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, seedPathStatus: "choice_restore_direct_or_recover" },
    });
    expect(track).toHaveBeenCalledWith(
      "User choose Restore",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it('should track "Pairing completed" when isPaired is true', () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, isPaired: true },
    });
    expect(track).toHaveBeenCalledWith(
      "Pairing completed",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it("should track the CLS loading event when isCLSLoading is true", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: { ...defaultArgs, isCLSLoading: true },
    });
    expect(track).toHaveBeenCalledWith(
      "User chose CLS within the post-onboarding and approve loading it on the device screen",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });

  it("should track multiple events when more than one condition is met", () => {
    renderHook((props: UseTrackOnboardingFlow) => useTrackOnboardingFlow(props), {
      initialProps: {
        ...defaultArgs,
        seedPathStatus: "new_seed",
        isPaired: true,
        isCLSLoading: true,
      },
    });

    // Expect three separate track calls
    expect(track).toHaveBeenCalledTimes(3);

    expect(track).toHaveBeenCalledWith(
      "Set-up as a new device",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "Pairing completed",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "User chose CLS within the post-onboarding and approve loading it on the device screen",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Onboarding",
      }),
    );
  });
});
