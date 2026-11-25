import {
  getNextTabBarCompaction,
  INITIAL_TAB_BAR_SCROLL_TRACKING,
  TAB_BAR_DIRECTION_THRESHOLD,
  TAB_BAR_EXPANDED_TOP_OFFSET,
  type TabBarCompaction,
} from "../getNextTabBarCompaction";

const MAX_OFFSET = 2000;
const MID_OFFSET = 500;

function scrollThrough(offsets: readonly number[], isCompact = false): TabBarCompaction {
  return offsets.reduce<TabBarCompaction>(
    (state, offset) =>
      getNextTabBarCompaction(state, { offset, maxOffset: MAX_OFFSET, isCompact: state.isCompact }),
    { ...INITIAL_TAB_BAR_SCROLL_TRACKING, lastOffset: offsets[0] ?? 0, isCompact },
  );
}

describe("getNextTabBarCompaction", () => {
  it("should compact when scrolling down past the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + TAB_BAR_DIRECTION_THRESHOLD]);

    expect(state.isCompact).toBe(true);
  });

  it("should stay expanded when scrolling down less than the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + TAB_BAR_DIRECTION_THRESHOLD - 1]);

    expect(state.isCompact).toBe(false);
  });

  it("should compact when small scroll steps add up past the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + 6, MID_OFFSET + 12, MID_OFFSET + 18]);

    expect(state).toEqual({ lastOffset: MID_OFFSET + 18, accumulatedDelta: 18, isCompact: true });
  });

  it("should expand when scrolling up past the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET - TAB_BAR_DIRECTION_THRESHOLD], true);

    expect(state.isCompact).toBe(false);
  });

  it("should stay compact when scrolling up less than the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET - TAB_BAR_DIRECTION_THRESHOLD + 1], true);

    expect(state.isCompact).toBe(true);
  });

  it("should restart the accumulated delta when the direction changes", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + 10, MID_OFFSET + 4]);

    expect(state).toEqual({ lastOffset: MID_OFFSET + 4, accumulatedDelta: -6, isCompact: false });
  });

  it("should not toggle when the direction flickers below the threshold", () => {
    const state = scrollThrough(
      [MID_OFFSET, MID_OFFSET + 10, MID_OFFSET + 2, MID_OFFSET + 12, MID_OFFSET + 4],
      true,
    );

    expect(state.isCompact).toBe(true);
  });

  it("should expand near the top even when scrolling down", () => {
    const state = scrollThrough([0, TAB_BAR_EXPANDED_TOP_OFFSET], true);

    expect(state).toEqual({
      lastOffset: TAB_BAR_EXPANDED_TOP_OFFSET,
      accumulatedDelta: 0,
      isCompact: false,
    });
  });

  it("should expand and clamp the offset when bouncing above the top", () => {
    const state = scrollThrough([MID_OFFSET, -40], true);

    expect(state).toEqual({ lastOffset: 0, accumulatedDelta: 0, isCompact: false });
  });

  it("should ignore the bounce past the content end", () => {
    const state = scrollThrough([MAX_OFFSET - 4, MAX_OFFSET + 60, MAX_OFFSET + 20], true);

    expect(state).toEqual({ lastOffset: MAX_OFFSET - 4, accumulatedDelta: 0, isCompact: true });
  });

  it("should keep the state when the offset does not move", () => {
    const tracking = { lastOffset: MID_OFFSET, accumulatedDelta: 10 };

    const state = getNextTabBarCompaction(tracking, {
      offset: MID_OFFSET,
      maxOffset: MAX_OFFSET,
      isCompact: false,
    });

    expect(state).toEqual({ ...tracking, isCompact: false });
  });

  it("should never compact content shorter than the top offset", () => {
    const shortContentMaxOffset = TAB_BAR_EXPANDED_TOP_OFFSET - 1;

    const state = getNextTabBarCompaction(INITIAL_TAB_BAR_SCROLL_TRACKING, {
      offset: shortContentMaxOffset,
      maxOffset: shortContentMaxOffset,
      isCompact: false,
    });

    expect(state.isCompact).toBe(false);
  });
});
