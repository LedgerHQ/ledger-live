import { DeviceModelId } from "@ledgerhq/devices";
import { isCooldownElapsed } from "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useLargeScreenUpsellEligibility } from "..";
import type { State } from "~/reducers/types";

jest.mock("react-native-mmkv", () => ({
  createMMKV: jest.fn(() => ({
    clearAll: jest.fn(),
    contains: jest.fn(() => false),
    getAllKeys: jest.fn(() => []),
    getString: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
    size: 0,
  })),
}));

jest.mock(
  "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency",
  () => ({
    isCooldownElapsed: jest.fn(),
  }),
  { virtual: true },
);

const mockedIsCooldownElapsed = jest.mocked(isCooldownElapsed);

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
    mockedIsCooldownElapsed.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(mockedIsCooldownElapsed).toHaveBeenCalledWith(
      new Date("2026-06-01T12:00:00.000Z"),
      0,
      expect.any(Date),
    );
  });

  it("should be ineligible for dual owners who have seen a nano and a touchscreen device", () => {
    const { result } = renderHook(() => useLargeScreenUpsellEligibility(), {
      overrideInitialState: withFlagOverrides(
        { largeScreenUpsell: { enabled: true } },
        withKnownDeviceModels([DeviceModelId.nanoX, DeviceModelId.stax]),
      ),
    });

    expect(result.current).toEqual({ isEligible: false, reason: "touchscreen_seen" });
    expect(mockedIsCooldownElapsed).not.toHaveBeenCalled();
  });
});
