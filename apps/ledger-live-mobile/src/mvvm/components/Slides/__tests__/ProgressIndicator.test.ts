import { getPageFromScrollProgress } from "../ProgressIndicator";

describe("getPageFromScrollProgress", () => {
  it("should advance near the next page threshold", () => {
    expect(getPageFromScrollProgress(0.05, 4)).toBe(1);
    expect(getPageFromScrollProgress(0.55, 4)).toBe(2);
  });

  it("should clamp the page to the available range", () => {
    expect(getPageFromScrollProgress(-2, 4)).toBe(1);
    expect(getPageFromScrollProgress(10, 4)).toBe(4);
  });
});
