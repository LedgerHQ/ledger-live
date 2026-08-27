import { renderHook } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
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
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoX],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(trackHardwareCarouselShown).toHaveBeenCalledWith({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwd",
    });
  });

  it("should track when shouldTrack is true and Nano S Plus is known", () => {
    renderHook(() => useHardwareCarouselPageTracking(true), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoSP],
          sharePersonalizedRecommandations: false,
        },
      },
    });

    expect(trackHardwareCarouselShown).toHaveBeenCalledWith({
      deviceModel: "lnsp",
      personalRecoOptIn: false,
      offerType: "none",
      platform: "lwd",
    });
  });

  it("should not track when shouldTrack is false", () => {
    renderHook(() => useHardwareCarouselPageTracking(false), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoX],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(trackHardwareCarouselShown).not.toHaveBeenCalled();
  });

  it("should not track when no eligible device models exist", () => {
    renderHook(() => useHardwareCarouselPageTracking(true), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(trackHardwareCarouselShown).not.toHaveBeenCalled();
  });

  it("should return shared props when device model is known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoX],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(result.current).toEqual({
      deviceModel: "lnx",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwd",
    });
  });

  it("should return undefined when no device model is known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(result.current).toBeUndefined();
  });

  it("should prefer Nano X over Nano S Plus when both are known", () => {
    const { result } = renderHook(() => useHardwareCarouselPageTracking(false), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoSP, DeviceModelId.nanoX],
          sharePersonalizedRecommandations: true,
        },
      },
    });

    expect(result.current?.deviceModel).toBe("lnx");
  });
});
