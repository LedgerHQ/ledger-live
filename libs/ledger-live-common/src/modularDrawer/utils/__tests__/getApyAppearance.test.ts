import { getApyAppearance } from "../getApyAppearance";

describe("getApyAppearance", () => {
  it("returns 'gray' for UK users (GB region)", () => {
    expect(getApyAppearance("GB")).toBe("gray");
  });

  it("returns 'success' for non-UK users", () => {
    expect(getApyAppearance("US")).toBe("success");
    expect(getApyAppearance(undefined)).toBe("success");
  });
});
