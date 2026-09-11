import { releaseTour } from "./releaseTour";

describe("releaseTour", () => {
  it("should default to disabled with the q3_a variant", () => {
    expect(releaseTour.parse(undefined)).toEqual({
      enabled: false,
      params: { variant: "q3_a" },
    });
  });

  it.each(["q2", "q3_a", "q3_b", "q3_b2"] as const)("should accept the %s variant", variant => {
    expect(releaseTour.parse({ enabled: true, params: { variant } })).toEqual({
      enabled: true,
      params: { variant },
    });
  });

  it("should accept an empty params object when enabled", () => {
    expect(releaseTour.parse({ enabled: true, params: {} })).toEqual({
      enabled: true,
      params: {},
    });
  });

  it("should reject an invalid variant", () => {
    expect(() => releaseTour.parse({ enabled: true, params: { variant: "q4_a" } })).toThrow();
  });
});
