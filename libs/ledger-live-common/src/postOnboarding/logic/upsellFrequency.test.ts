import { isCooldownElapsed, shouldThrottle } from "./upsellFrequency";

describe("isCooldownElapsed", () => {
  const now = new Date("2026-07-03T10:00:00.000Z");

  it("should return true when onboarding date is null", () => {
    expect(isCooldownElapsed(null, 30, now)).toBe(true);
  });

  it("should return true when cooldown is 0 days", () => {
    expect(isCooldownElapsed(new Date("2026-07-03T10:00:00.000Z"), 0, now)).toBe(true);
  });

  it("should return false before the cooldown boundary", () => {
    expect(isCooldownElapsed(new Date("2026-06-04T10:00:00.000Z"), 30, now)).toBe(false);
  });

  it("should return true on the cooldown boundary", () => {
    expect(isCooldownElapsed(new Date("2026-06-03T10:00:00.000Z"), 30, now)).toBe(true);
  });

  it("should return true after the cooldown boundary", () => {
    expect(isCooldownElapsed(new Date("2026-06-02T10:00:00.000Z"), 30, now)).toBe(true);
  });
});

describe("shouldThrottle", () => {
  const now = new Date("2026-07-03T10:00:00.000Z");

  it("should return false below the kill threshold", () => {
    expect(shouldThrottle(2, new Date("2026-07-03T10:00:00.000Z"), 3, 7, now)).toBe(false);
  });

  it("should return false at the kill threshold when last seen date is null", () => {
    expect(shouldThrottle(3, null, 3, 7, now)).toBe(false);
  });

  it("should return true within the cadence window once the kill threshold is reached", () => {
    expect(shouldThrottle(3, new Date("2026-06-27T10:00:00.000Z"), 3, 7, now)).toBe(true);
  });

  it("should return false on the cadence boundary once the kill threshold is reached", () => {
    expect(shouldThrottle(3, new Date("2026-06-26T10:00:00.000Z"), 3, 7, now)).toBe(false);
  });

  it("should return false after the cadence boundary once the kill threshold is reached", () => {
    expect(shouldThrottle(3, new Date("2026-06-25T10:00:00.000Z"), 3, 7, now)).toBe(false);
  });

  it("should return true within the cadence window when kills exceed the threshold", () => {
    expect(shouldThrottle(4, new Date("2026-07-01T10:00:00.000Z"), 3, 7, now)).toBe(true);
  });
});
