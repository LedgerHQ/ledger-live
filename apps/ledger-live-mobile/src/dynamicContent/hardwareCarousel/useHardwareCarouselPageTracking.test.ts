import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { State } from "~/reducers/types";
import { useHardwareCarouselPageTracking } from "./useHardwareCarouselPageTracking";
import { trackHardwareCarouselShown } from "./analytics";

jest.mock("./analytics", () => ({
  trackHardwareCarouselShown: jest.fn(),
}));

describe("useHardwareCarouselPageTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track when shouldTrack is true and Nano X is known", () => {
    renderHook(() => useHardwareCarouselPageTracking(true), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: true,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(trackHardwareCarouselShown).toHaveBeenCalledWith({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwm",
    });
  });

  it("should track when shouldTrack is true and Nano S Plus is known", () => {
    renderHook(() => useHardwareCarouselPageTracking(true), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoSP]: true,
          },
          personalizedRecommendationsEnabled: false,
        },
      }),
    });

    expect(trackHardwareCarouselShown).toHaveBeenCalledWith({
      deviceModel: "lnsp",
      personalRecoOptIn: false,
      offerType: "none",
      platform: "lwm",
    });
  });

  it("should not track when shouldTrack is false", () => {
    renderHook(() => useHardwareCarouselPageTracking(false), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: true,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(trackHardwareCarouselShown).not.toHaveBeenCalled();
  });

  it("should not track when no known device models exist", () => {
    renderHook(() => useHardwareCarouselPageTracking(true), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: false,
            [DeviceModelId.nanoSP]: false,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(trackHardwareCarouselShown).not.toHaveBeenCalled();
  });

  it("should return shared props when device model is known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: true,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(result.current).toEqual({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwm",
    });
  });

  it("should return undefined when no device model is known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: false,
            [DeviceModelId.nanoSP]: false,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(result.current).toBeUndefined();
  });

  it("should prefer Nano X over Nano S Plus when both are known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          knownDeviceModelIds: {
            ...state.settings.knownDeviceModelIds,
            [DeviceModelId.nanoX]: true,
            [DeviceModelId.nanoSP]: true,
          },
          personalizedRecommendationsEnabled: true,
        },
      }),
    });

    expect(result.current?.deviceModel).toBe("lnx");
  });
});
