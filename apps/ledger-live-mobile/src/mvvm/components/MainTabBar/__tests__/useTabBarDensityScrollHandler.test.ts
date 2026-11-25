import { renderHook, act } from "@tests/test-renderer";
import { TAB_BAR_DIRECTION_THRESHOLD } from "../getNextTabBarCompaction";
import { getIsTabBarCompact, resetTabBarDensity } from "../tabBarDensityStore";
import { useTabBarDensityScrollHandler } from "../useTabBarDensityScrollHandler";

const VIEWPORT_HEIGHT = 800;
const CONTENT_HEIGHT = 3000;
const MID_OFFSET = 500;

function scrollEventAt(offset: number) {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y: offset },
      contentSize: { width: 400, height: CONTENT_HEIGHT },
      layoutMeasurement: { width: 400, height: VIEWPORT_HEIGHT },
    },
  };
}

function scrollThrough(offsets: readonly number[]) {
  const { result } = renderHook(() => useTabBarDensityScrollHandler());
  act(() => offsets.forEach(offset => result.current(scrollEventAt(offset))));
}

describe("useTabBarDensityScrollHandler", () => {
  afterEach(() => {
    resetTabBarDensity();
  });

  it("should compact the tab bar when scrolling down", () => {
    scrollThrough([MID_OFFSET, MID_OFFSET + TAB_BAR_DIRECTION_THRESHOLD]);

    expect(getIsTabBarCompact()).toBe(true);
  });

  it("should expand the tab bar when scrolling back up", () => {
    scrollThrough([MID_OFFSET, MID_OFFSET + TAB_BAR_DIRECTION_THRESHOLD, MID_OFFSET - 1]);

    expect(getIsTabBarCompact()).toBe(false);
  });

  it("should keep the tab bar expanded when the content does not scroll past the top area", () => {
    scrollThrough([0, 10, 20]);

    expect(getIsTabBarCompact()).toBe(false);
  });
});
