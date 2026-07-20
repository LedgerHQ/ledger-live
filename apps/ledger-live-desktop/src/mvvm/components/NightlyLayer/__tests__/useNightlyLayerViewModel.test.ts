import { renderHook } from "@testing-library/react";
import { useNightlyLayerViewModel } from "../useNightlyLayerViewModel";
import { getWatermarkPositions } from "../utils/getWatermarkPositions";

describe("useNightlyLayerViewModel", () => {
  it("returns the app version and watermark grid", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());

    expect(result.current.appVersion).toBe(__APP_VERSION__);
    expect(result.current.watermarks).toEqual(getWatermarkPositions());
    expect(result.current.watermarks).toHaveLength(400);
  });

  it("reflects prerelease visibility from build constants", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());
    const expectedVisibility =
      __PRERELEASE__ && __CHANNEL__ !== "next" && !__CHANNEL__.includes("sha");

    expect(result.current.isVisible).toBe(expectedVisibility);
  });
});
