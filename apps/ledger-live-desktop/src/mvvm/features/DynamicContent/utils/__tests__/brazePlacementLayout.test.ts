import {
  BRAZE_PLACEMENT_CONTAINER_CLASS_NAME,
  BRAZE_PLACEMENT_GRID_CLASS_NAME,
  BRAZE_PLACEMENT_NARROW_MAX_CONTAINER_WIDTH,
  BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH,
  MIN_BRAZE_BANNER_WIDTH,
} from "../brazePlacementLayout";

describe("brazePlacementLayout", () => {
  it("should derive the two-column breakpoint from the minimum banner width and grid gap", () => {
    expect(BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH).toBe(
      MIN_BRAZE_BANNER_WIDTH * 2 + 16 + 1,
    );
    expect(BRAZE_PLACEMENT_NARROW_MAX_CONTAINER_WIDTH).toBe(
      BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH - 1,
    );
  });

  it("should keep the container query context on a parent wrapper", () => {
    expect(BRAZE_PLACEMENT_CONTAINER_CLASS_NAME).toBe("@container w-full");
  });

  it("should expose container-query grid classes aligned with the breakpoints", () => {
    expect(BRAZE_PLACEMENT_GRID_CLASS_NAME).not.toContain("@container");
    expect(BRAZE_PLACEMENT_GRID_CLASS_NAME).toContain(
      `@min-[${BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH}px]:grid-cols-2`,
    );
    expect(BRAZE_PLACEMENT_GRID_CLASS_NAME).toContain(
      `@max-[${BRAZE_PLACEMENT_NARROW_MAX_CONTAINER_WIDTH}px]:[&>:nth-child(n+2)]:hidden`,
    );
  });
});
