import { isMarkerOutsideScrubberOverlay } from "../isMarkerOutsideScrubberOverlay";

const LAST_INDEX = 10;

describe("isMarkerOutsideScrubberOverlay", () => {
  it("is false while idle", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 5, value: 1 }, undefined, LAST_INDEX)).toBe(
      false,
    );
  });

  it("is false for markers left of the scrubbed index", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 2, value: 1 }, 3, LAST_INDEX)).toBe(false);
  });

  it("is true for a top label on or right of the scrubbed index, top being the default", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 0, value: 1 }, 0, LAST_INDEX)).toBe(true);
    expect(isMarkerOutsideScrubberOverlay({ index: 4, value: 1 }, 3, LAST_INDEX)).toBe(true);
    expect(
      isMarkerOutsideScrubberOverlay({ index: 4, value: 1, labelPosition: "top" }, 3, LAST_INDEX),
    ).toBe(true);
  });

  it("is false when the scrubber is on the last index, where the overlay is empty", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 10, value: 1 }, 10, LAST_INDEX)).toBe(false);
  });

  it("is false for bottom labels and hidden labels, which the overlay already covers", () => {
    expect(
      isMarkerOutsideScrubberOverlay(
        { index: 4, value: 1, labelPosition: "bottom" },
        3,
        LAST_INDEX,
      ),
    ).toBe(false);
    expect(
      isMarkerOutsideScrubberOverlay({ index: 4, value: 1, hideLabel: true }, 3, LAST_INDEX),
    ).toBe(false);
  });
});
