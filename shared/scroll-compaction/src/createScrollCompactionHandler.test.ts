import { createScrollCompactionHandler } from "./createScrollCompactionHandler";
import { createScrollCompactionStore } from "./createScrollCompactionStore";
import { SCROLL_COMPACTION_DIRECTION_THRESHOLD } from "./getNextScrollCompaction";

const VIEWPORT_HEIGHT = 800;
const CONTENT_HEIGHT = 3000;
const MID_OFFSET = 500;

function scrollEventAt(offset: number) {
  return {
    nativeEvent: {
      contentOffset: { y: offset },
      contentSize: { height: CONTENT_HEIGHT },
      layoutMeasurement: { height: VIEWPORT_HEIGHT },
    },
  };
}

function setup() {
  const onApply = jest.fn();
  const store = createScrollCompactionStore({ onApply });
  const onScroll = createScrollCompactionHandler(store);
  const scrollTo = (offsets: readonly number[]) =>
    offsets.forEach(offset => onScroll(scrollEventAt(offset)));
  return { store, scrollTo, onApply };
}

describe("createScrollCompactionHandler", () => {
  it("should compact when scrolling down", () => {
    const { store, scrollTo } = setup();

    scrollTo([MID_OFFSET, MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD]);

    expect(store.getIsCompact()).toBe(true);
  });

  it("should expand when scrolling back up", () => {
    const { store, scrollTo } = setup();

    scrollTo([MID_OFFSET, MID_OFFSET + SCROLL_COMPACTION_DIRECTION_THRESHOLD, MID_OFFSET - 1]);

    expect(store.getIsCompact()).toBe(false);
  });

  it("should stay expanded when the content does not scroll past the top area", () => {
    const { store, scrollTo } = setup();

    scrollTo([0, 10, 20]);

    expect(store.getIsCompact()).toBe(false);
  });

  it("should need a new scroll past the direction threshold to compact after a reset", () => {
    const { store, scrollTo } = setup();
    scrollTo([0, 32, 48, MID_OFFSET]);
    store.reset();

    scrollTo([MID_OFFSET + 1]);
    const isCompactAfterOnePixel = store.getIsCompact();
    scrollTo([MID_OFFSET + 1 + SCROLL_COMPACTION_DIRECTION_THRESHOLD]);

    expect(isCompactAfterOnePixel).toBe(false);
    expect(store.getIsCompact()).toBe(true);
  });

  it("should only update the store when the compact state changes", () => {
    const { scrollTo, onApply } = setup();

    scrollTo([MID_OFFSET, MID_OFFSET + 1, MID_OFFSET + 2, MID_OFFSET + 40, MID_OFFSET + 80]);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(true);
  });
});
