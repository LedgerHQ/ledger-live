import { getApyAppearance } from "../getApyAppearance";

describe("getApyAppearance", () => {
  it("returns 'gray' for UK users (GB region)", () => {
    expect(getApyAppearance("GB")).toBe("gray");
  });

  it("returns 'success' for US users", () => {
    expect(getApyAppearance("US")).toBe("success");
  });

  it("returns 'success' for French users", () => {
    expect(getApyAppearance("FR")).toBe("success");
  });

  it("returns 'success' for German users", () => {
    expect(getApyAppearance("DE")).toBe("success");
  });

  it("returns 'success' for undefined region", () => {
    expect(getApyAppearance(undefined)).toBe("success");
  });

  it("returns 'success' for empty string region", () => {
    expect(getApyAppearance("")).toBe("success");
  });
});
