import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useLargeScreenUpsellEligibility } from "../useLargeScreenUpsellEligibility";
import type { State } from "~/reducers/types";

const NOW = new Date("2026-07-06T12:00:00.000Z");

type NanoDeviceModelId = DeviceModelId.nanoS | DeviceModelId.nanoSP | DeviceModelId.nanoX;

type RenderOptions = {
  enabled?: boolean;
  knownDeviceModelIds?: DeviceModelId[];
  onboardingDate?: string | null;
  onboardingCompletionDate?: string | null;
  audienceModels?: Partial<Record<NanoDeviceModelId, boolean>>;
  nanoSCooldownDays?: number;
};

function renderEligibility({
  enabled = true,
  knownDeviceModelIds = [],
  onboardingDate = "2026-06-01T12:00:00.000Z",
  onboardingCompletionDate = null,
  audienceModels,
  nanoSCooldownDays,
}: RenderOptions = {}) {
  const withState = (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      knownDeviceModelIds: {
        ...state.settings.knownDeviceModelIds,
        ...Object.fromEntries(knownDeviceModelIds.map(deviceModelId => [deviceModelId, true])),
      },
      onboardingCompletionDate,
    },
    postOnboarding: {
      ...state.postOnboarding,
      onboardingDate,
    },
  });

  return renderHook(() => useLargeScreenUpsellEligibility(), {
    overrideInitialState: withFlagOverrides(
      {
        largeScreenUpsell: {
          enabled,
          ...((audienceModels || nanoSCooldownDays !== undefined) && {
            params: {
              ...(audienceModels && {
                audience: {
                  models: { nanoS: true, nanoSP: true, nanoX: true, ...audienceModels },
                },
              }),
              ...(nanoSCooldownDays !== undefined && {
                cooldownDays: { default: 30, nanoS: nanoSCooldownDays },
              }),
            },
          }),
        },
      },
      withState,
    ),
  });
}

describe("useLargeScreenUpsellEligibility", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should be ineligible when the largeScreenUpsell flag is off", () => {
    const { result } = renderEligibility({
      enabled: false,
      knownDeviceModelIds: [DeviceModelId.nanoS],
    });

    expect(result.current).toEqual({ isEligible: false, reason: "feature_disabled" });
  });

  it("should be ineligible when no nano device has been seen", () => {
    const { result } = renderEligibility();

    expect(result.current).toEqual({ isEligible: false, reason: "no_nano" });
  });

  it.each([DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.apex])(
    "should be ineligible when only touchscreen device %s has been seen",
    deviceModelId => {
      const { result } = renderEligibility({ knownDeviceModelIds: [deviceModelId] });

      expect(result.current).toEqual({ isEligible: false, reason: "touchscreen_seen" });
    },
  );

  it("should exclude dual owners who have seen a nano and a touchscreen device", () => {
    const { result } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoS, DeviceModelId.stax],
    });

    expect(result.current).toEqual({ isEligible: false, reason: "touchscreen_seen" });
  });

  it("should make Nano S eligible from day 0", () => {
    const { result } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoS],
      onboardingDate: NOW.toISOString(),
    });

    expect(result.current).toEqual({
      isEligible: true,
      deviceModelId: DeviceModelId.nanoS,
      cooldownDays: 0,
    });
  });

  it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "should suppress %s during the 30-day cooldown",
    deviceModelId => {
      const { result } = renderEligibility({
        knownDeviceModelIds: [deviceModelId],
        onboardingDate: "2026-06-07T12:00:00.000Z",
      });

      expect(result.current).toEqual({
        isEligible: false,
        reason: "cooldown",
        deviceModelId,
        cooldownDays: 30,
      });
    },
  );

  it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "should make %s eligible on the 30-day cooldown boundary",
    deviceModelId => {
      const { result } = renderEligibility({
        knownDeviceModelIds: [deviceModelId],
        onboardingDate: "2026-06-06T12:00:00.000Z",
      });

      expect(result.current).toEqual({
        isEligible: true,
        deviceModelId,
        cooldownDays: 30,
      });
    },
  );

  it("should be ineligible when the seen nano model is disabled in the audience params", () => {
    const { result } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoS],
      audienceModels: { nanoS: false },
    });

    expect(result.current).toEqual({ isEligible: false, reason: "model_disabled" });
  });

  it("should treat a null onboarding date as the legacy date and pass cooldown", () => {
    const { result } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoX],
      onboardingDate: null,
    });

    expect(result.current).toEqual({
      isEligible: true,
      deviceModelId: DeviceModelId.nanoX,
      cooldownDays: 30,
    });
  });

  it("should not backfill a null onboarding date from the eligibility hook", () => {
    const { store } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoX],
      onboardingDate: null,
    });

    expect(store.getState().postOnboarding.onboardingDate).toBeNull();
  });

  it("should use the longest cooldown when multiple eligible nano models have been seen", () => {
    const { result } = renderEligibility({
      knownDeviceModelIds: [DeviceModelId.nanoS, DeviceModelId.nanoX],
      onboardingDate: NOW.toISOString(),
    });

    expect(result.current).toEqual({
      isEligible: false,
      reason: "cooldown",
      deviceModelId: DeviceModelId.nanoX,
      cooldownDays: 30,
    });
  });

  describe("when the cooldown starts from a device setup", () => {
    it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX])(
      "should keep %s in cooldown right after its setup when post onboarding has not started yet",
      deviceModelId => {
        const { result } = renderEligibility({
          knownDeviceModelIds: [deviceModelId],
          onboardingDate: null,
          onboardingCompletionDate: NOW.toISOString(),
        });

        expect(result.current).toEqual({
          isEligible: false,
          reason: "cooldown",
          deviceModelId,
          cooldownDays: 30,
        });
      },
    );

    it("should restart the cooldown when another device is set up after an older post onboarding", () => {
      const { result } = renderEligibility({
        knownDeviceModelIds: [DeviceModelId.nanoX],
        onboardingDate: "2026-01-15T12:00:00.000Z",
        onboardingCompletionDate: NOW.toISOString(),
      });

      expect(result.current).toEqual({
        isEligible: false,
        reason: "cooldown",
        deviceModelId: DeviceModelId.nanoX,
        cooldownDays: 30,
      });
    });

    it("should keep Nano S in cooldown on the day of its setup with a 1-day cooldown", () => {
      const { result } = renderEligibility({
        knownDeviceModelIds: [DeviceModelId.nanoS],
        onboardingDate: null,
        onboardingCompletionDate: NOW.toISOString(),
        nanoSCooldownDays: 1,
      });

      expect(result.current).toEqual({
        isEligible: false,
        reason: "cooldown",
        deviceModelId: DeviceModelId.nanoS,
        cooldownDays: 1,
      });
    });

    it("should make Nano S eligible the day after its setup with a 1-day cooldown", () => {
      const { result } = renderEligibility({
        knownDeviceModelIds: [DeviceModelId.nanoS],
        onboardingDate: null,
        onboardingCompletionDate: "2026-07-05T12:00:00.000Z",
        nanoSCooldownDays: 1,
      });

      expect(result.current).toEqual({
        isEligible: true,
        deviceModelId: DeviceModelId.nanoS,
        cooldownDays: 1,
      });
    });
  });
});
