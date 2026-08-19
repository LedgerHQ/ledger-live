import {
  HARDWARE_CAROUSEL_ITEM_GAP_PX,
  HARDWARE_CAROUSEL_SEPARATOR_PX,
  HARDWARE_CAROUSEL_SLIDE_WIDTH_PX,
} from "../hardwareCarouselLayout";

describe("hardwareCarouselLayout", () => {
  it("pins the fixed slide width design value", () => {
    expect(HARDWARE_CAROUSEL_SLIDE_WIDTH_PX).toBe(131);
  });

  it("derives the item gap from half the separator", () => {
    expect(HARDWARE_CAROUSEL_ITEM_GAP_PX).toBe(HARDWARE_CAROUSEL_SEPARATOR_PX / 2);
  });
});
