import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useLargeScreenUpsellEligibility } from "../useLargeScreenUpsellEligibility";
import type { State } from "~/reducers/types";
import type { Features } from "@shared/feature-flags";

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));

const NOW = new Date("2026-07-06T12:00:00.000Z");

type LargeScreenUpsellFeature = Features["largeScreenUpsell"];
type LargeScreenUpsellParams = NonNullable<LargeScreenUpsellFeature["params"]>;
type NanoDeviceModelId = DeviceModelId.nanoS | DeviceModelId.nanoSP | DeviceModelId.nanoX;

const DEFAULT_KNOWN_DEVICE_MODEL_IDS: Record<DeviceModelId, boolean> = {
  [DeviceModelId.blue]: false,
  [DeviceModelId.nanoS]: false,
  [DeviceModelId.nanoSP]: false,
  [DeviceModelId.nanoX]: false,
  [DeviceModelId.stax]: false,
  [DeviceModelId.europa]: false,
  [DeviceModelId.apex]: false,
};

const DEFAULT_PARAMS: LargeScreenUpsellParams = {
  audience: {
    models: {
      [DeviceModelId.nanoS]: true,
      [DeviceModelId.nanoSP]: true,
      [DeviceModelId.nanoX]: true,
    },
  },
  cooldownDays: {
    default: 30,
    [DeviceModelId.nanoS]: 0,
  },
  discount: 0.2,
  modal: {
    enabled: true,
    killThreshold: 3,
    cadenceDays: 30,
  },
  opted_in: { link: "https://example.com/opt-in" },
  opted_out: { link: "https://example.com/opt-out" },
};

type RenderOptions = {
  enabled?: boolean;
  knownDeviceModelIds?: DeviceModelId[];
  onboardingDate?: string | null;
  audienceModels?: Partial<Record<NanoDeviceModelId, boolean>>;
};

function renderEligibility({
  enabled = true,
  knownDeviceModelIds = [],
  onboardingDate = "2026-06-01T12:00:00.000Z",
  audienceModels,
}: RenderOptions = {}) {
  const mockUseFeature = jest.mocked(useFeature);
  const mockUseSelector = jest.mocked(useSelector);
  const state = {
    settings: {
      knownDeviceModelIds: {
        ...DEFAULT_KNOWN_DEVICE_MODEL_IDS,
        ...Object.fromEntries(knownDeviceModelIds.map(deviceModelId => [deviceModelId, true])),
      },
    },
    postOnboarding: { onboardingDate },
  } as State;
  const params: LargeScreenUpsellParams = {
    ...DEFAULT_PARAMS,
    audience: {
      models: {
        ...DEFAULT_PARAMS.audience.models,
        ...audienceModels,
      },
    },
  };

  mockUseFeature.mockReturnValue({ enabled, params } as LargeScreenUpsellFeature);
  mockUseSelector.mockImplementation(selector => (selector as (state: State) => unknown)(state));

  return renderHook(() => useLargeScreenUpsellEligibility());
}

describe("useLargeScreenUpsellEligibility", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
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

  it("should treat a null onboarding date as eligible defensively", () => {
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
});
