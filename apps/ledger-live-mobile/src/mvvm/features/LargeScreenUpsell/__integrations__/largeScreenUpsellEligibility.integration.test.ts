import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useLargeScreenUpsellEligibility } from "..";
import type { State } from "~/reducers/types";

const NOW = new Date("2026-06-01T12:00:00.000Z");

function withKnownDeviceModels(deviceModelIds: DeviceModelId[]) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      knownDeviceModelIds: {
        ...state.settings.knownDeviceModelIds,
        ...Object.fromEntries(deviceModelIds.map(deviceModelId => [deviceModelId, true])),
      },
    },
    postOnboarding: {
      ...state.postOnboarding,
      onboardingDate: "2026-06-01T12:00:00.000Z",
    },
  });
}

describe("large screen upsell eligibility integration", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should be eligible when the feature is enabled and only a nano has been seen", () => {
    const { result } = renderHook(() => useLargeScreenUpsellEligibility(), {
      overrideInitialState: withFlagOverrides(
        { largeScreenUpsell: { enabled: true } },
        withKnownDeviceModels([DeviceModelId.nanoS]),
      ),
    });

    expect(result.current).toEqual({
      isEligible: true,
      deviceModelId: DeviceModelId.nanoS,
      cooldownDays: 0,
    });
  });

  it("should be ineligible for dual owners who have seen a nano and a touchscreen device", () => {
    const { result } = renderHook(() => useLargeScreenUpsellEligibility(), {
      overrideInitialState: withFlagOverrides(
        { largeScreenUpsell: { enabled: true } },
        withKnownDeviceModels([DeviceModelId.nanoX, DeviceModelId.stax]),
      ),
    });

    expect(result.current).toEqual({ isEligible: false, reason: "touchscreen_seen" });
  });
});
