import {
  getNextScrollCompaction,
  INITIAL_SCROLL_COMPACTION_TRACKING,
  SCROLL_COMPACTION_DIRECTION_THRESHOLD,
  SCROLL_COMPACTION_TOP_OFFSET,
  type ScrollCompaction,
} from "./getNextScrollCompaction";

const MAX_OFFSET = 2000;
const MID_OFFSET = 500;

function scrollThrough(offsets: readonly number[], isCompact = false): ScrollCompaction {
  return offsets.reduce<ScrollCompaction>(
    (state, offset) =>
      getNextScrollCompaction(state, {
        offset,
        maxOffset: MAX_OFFSET,
        isCompact: state.isCompact,
        resetGeneration: state.resetGeneration,
      }),
    { ...INITIAL_SCROLL_COMPACTION_TRACKING, lastOffset: offsets[0] ?? 0, isCompact },
  );
}

describe("getNextScrollCompaction", () => {
  it("should compact when scrolling down past the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD]);

    expect(state.isCompact).toBe(true);
  });

  it("should stay expanded when scrolling down less than the direction threshold", () => {
    const state = scrollThrough([
      MID_OFFSET,
      MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD - 1,
    ]);

    expect(state.isCompact).toBe(false);
  });

  it("should compact when small scroll steps add up past the direction threshold", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + 6, MID_OFFSET + 12, MID_OFFSET + 18]);

    expect(state).toEqual({
      lastOffset: MID_OFFSET + 18,
      accumulatedDelta: 18,
      resetGeneration: 0,
      isCompact: true,
    });
  });

  it("should expand when scrolling up past the direction threshold", () => {
    const state = scrollThrough(
      [MID_OFFSET, MID_OFFSET - SCROLL_COMPACTION_DIRECTION_THRESHOLD],
      true,
    );

    expect(state.isCompact).toBe(false);
  });

  it("should stay compact when scrolling up less than the direction threshold", () => {
    const state = scrollThrough(
      [MID_OFFSET, MID_OFFSET - SCROLL_COMPACTION_DIRECTION_THRESHOLD + 1],
      true,
    );

    expect(state.isCompact).toBe(true);
  });

  it("should restart the accumulated delta when the direction changes", () => {
    const state = scrollThrough([MID_OFFSET, MID_OFFSET + 10, MID_OFFSET + 4]);

    expect(state).toEqual({
      lastOffset: MID_OFFSET + 4,
      accumulatedDelta: -6,
      resetGeneration: 0,
      isCompact: false,
    });
  });

  it("should not toggle when the direction flickers below the threshold", () => {
    const state = scrollThrough(
      [MID_OFFSET, MID_OFFSET + 10, MID_OFFSET + 2, MID_OFFSET + 12, MID_OFFSET + 4],
      true,
    );

    expect(state.isCompact).toBe(true);
  });

  it("should expand near the top even when scrolling down", () => {
    const state = scrollThrough([0, SCROLL_COMPACTION_TOP_OFFSET], true);

    expect(state).toEqual({
      lastOffset: SCROLL_COMPACTION_TOP_OFFSET,
      accumulatedDelta: 0,
      resetGeneration: 0,
      isCompact: false,
    });
  });

  it("should expand and clamp the offset when bouncing above the top", () => {
    const state = scrollThrough([MID_OFFSET, -40], true);

    expect(state).toEqual({
      lastOffset: 0,
      accumulatedDelta: 0,
      resetGeneration: 0,
      isCompact: false,
    });
  });

  it("should ignore the bounce past the content end", () => {
    const state = scrollThrough([MAX_OFFSET - 4, MAX_OFFSET + 60, MAX_OFFSET + 20], true);

    expect(state).toEqual({
      lastOffset: MAX_OFFSET - 4,
      accumulatedDelta: 0,
      resetGeneration: 0,
      isCompact: true,
    });
  });

  it("should keep the state when the offset does not move", () => {
    const tracking = { lastOffset: MID_OFFSET, accumulatedDelta: 10, resetGeneration: 0 };

    const state = getNextScrollCompaction(tracking, {
      offset: MID_OFFSET,
      maxOffset: MAX_OFFSET,
      isCompact: false,
      resetGeneration: 0,
    });

    expect(state).toEqual({ ...tracking, isCompact: false });
  });

  it("should never compact content shorter than the top offset", () => {
    const shortContentMaxOffset = SCROLL_COMPACTION_TOP_OFFSET - 1;

    const state = getNextScrollCompaction(INITIAL_SCROLL_COMPACTION_TRACKING, {
      offset: shortContentMaxOffset,
      maxOffset: shortContentMaxOffset,
      isCompact: false,
      resetGeneration: 0,
    });

    expect(state.isCompact).toBe(false);
  });

  describe("after a density reset", () => {
    const compactedTracking = { lastOffset: MID_OFFSET, accumulatedDelta: 468, resetGeneration: 0 };

    it("should clear the accumulated delta and keep the current offset", () => {
      const state = getNextScrollCompaction(compactedTracking, {
        offset: MID_OFFSET + 1,
        maxOffset: MAX_OFFSET,
        isCompact: false,
        resetGeneration: 1,
      });

      expect(state).toEqual({
        lastOffset: MID_OFFSET + 1,
        accumulatedDelta: 0,
        resetGeneration: 1,
        isCompact: false,
      });
    });

    it("should need a full direction threshold of scroll to compact again", () => {
      const reset = getNextScrollCompaction(compactedTracking, {
        offset: MID_OFFSET,
        maxOffset: MAX_OFFSET,
        isCompact: false,
        resetGeneration: 1,
      });
      const sample = { maxOffset: MAX_OFFSET, isCompact: false, resetGeneration: 1 };

      const almost = getNextScrollCompaction(reset, {
        ...sample,
        offset: MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD - 1,
      });
      const enough = getNextScrollCompaction(almost, {
        ...sample,
        offset: MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD,
      });

      expect(almost.isCompact).toBe(false);
      expect(enough.isCompact).toBe(true);
    });
  });
});
