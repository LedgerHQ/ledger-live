import { describeCause } from "./describeCause";

describe("describeCause", () => {
  it("returns the message of an error", () => {
    expect(describeCause(new RangeError("out of range"))).toBe("out of range");
  });

  it("returns the string form of anything else", () => {
    expect(describeCause("offline")).toBe("offline");
  });
});
