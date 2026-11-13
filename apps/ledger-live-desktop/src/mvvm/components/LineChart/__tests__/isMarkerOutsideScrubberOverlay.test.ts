import { isMarkerOutsideScrubberOverlay } from "../utils/isMarkerOutsideScrubberOverlay";

describe("isMarkerOutsideScrubberOverlay", () => {
  it("is false while idle", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 5, value: 1 }, undefined)).toBe(false);
  });

  it("is false for markers left of or on the scrubbed index", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 2, value: 1 }, 3)).toBe(false);
    expect(isMarkerOutsideScrubberOverlay({ index: 3, value: 1 }, 3)).toBe(false);
  });

  it("is true for a top label right of the scrubbed index, top being the default", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 4, value: 1 }, 3)).toBe(true);
    expect(isMarkerOutsideScrubberOverlay({ index: 4, value: 1, labelPosition: "top" }, 3)).toBe(
      true,
    );
  });

  it("is false for bottom labels and hidden labels, which the overlay already covers", () => {
    expect(isMarkerOutsideScrubberOverlay({ index: 4, value: 1, labelPosition: "bottom" }, 3)).toBe(
      false,
    );
    expect(isMarkerOutsideScrubberOverlay({ index: 4, value: 1, hideLabel: true }, 3)).toBe(false);
  });
});
