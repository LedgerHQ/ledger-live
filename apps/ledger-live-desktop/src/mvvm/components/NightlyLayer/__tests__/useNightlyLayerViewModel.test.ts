import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { useNightlyLayerViewModel } from "../useNightlyLayerViewModel";
import { shouldShowNightlyLayer } from "../utils/shouldShowNightlyLayer";

jest.mock("../utils/shouldShowNightlyLayer");

const mockShouldShowNightlyLayer = jest.mocked(shouldShowNightlyLayer);

const renderOnNightly = (hideNightlyLayer: boolean) => {
  mockShouldShowNightlyLayer.mockReturnValue(true);
  return renderHook(() => useNightlyLayerViewModel(), {
    initialState: { settings: { ...SETTINGS_INITIAL_STATE, hideNightlyLayer } },
  });
};

describe("useNightlyLayerViewModel", () => {
  beforeEach(() => {
    mockShouldShowNightlyLayer.mockReturnValue(false);
  });

  it("returns the app version", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());

    expect(result.current.appVersion).toBe(__APP_VERSION__);
  });

  it("does not compute watermarks outside nightly builds", () => {
    const { result } = renderHook(() => useNightlyLayerViewModel());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.watermarks).toEqual([]);
  });

  it("shows the watermarks on nightly builds by default", () => {
    const { result } = renderOnNightly(false);

    expect(result.current.isVisible).toBe(true);
    expect(result.current.watermarks.length).toBeGreaterThan(0);
  });

  it("hides the watermarks on nightly builds when the developer setting is on", () => {
    const { result } = renderOnNightly(true);

    expect(result.current.isVisible).toBe(false);
    expect(result.current.watermarks).toEqual([]);
  });
});
