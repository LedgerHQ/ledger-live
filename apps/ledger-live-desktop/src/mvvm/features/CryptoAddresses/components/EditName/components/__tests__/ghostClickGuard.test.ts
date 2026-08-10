import { GHOST_CLICK_GUARD_MS, isWithinGhostClickGuard } from "../ghostClickGuard";

describe("isWithinGhostClickGuard", () => {
  const openedAt = 1_000;

  it("should block outside clicks within the guard window", () => {
    expect(isWithinGhostClickGuard(openedAt, openedAt + GHOST_CLICK_GUARD_MS - 1)).toBe(true);
  });

  it("should allow outside clicks once the guard window has elapsed", () => {
    expect(isWithinGhostClickGuard(openedAt, openedAt + GHOST_CLICK_GUARD_MS)).toBe(false);
  });
});
