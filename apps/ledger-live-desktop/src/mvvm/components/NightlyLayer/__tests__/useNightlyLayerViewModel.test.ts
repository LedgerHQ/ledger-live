import { renderHook } from "tests/testSetup";
import { useNightlyLayerViewModel } from "../useNightlyLayerViewModel";

describe("useNightlyLayerViewModel", () => {
  it("returns the app version", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());

    expect(result.current.appVersion).toBe(__APP_VERSION__);
  });

  it("does not compute watermarks when the layer is hidden in test env", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.watermarks).toEqual([]);
  });
});
