import { splitAddress } from "../splitAddress";
import { splitMiddleForTwoLines } from "../splitMiddleForTwoLines";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

describe("splitAddress", () => {
  it("should set the first and last 8 characters apart", () => {
    expect(splitAddress(ADDRESS)).toEqual({
      start: "0x71C765",
      middle: "6EC7ab88b098defB751B7401B5",
      end: "f6d8976F",
    });
  });

  it("should keep a short address whole", () => {
    expect(splitAddress("0x1234")).toEqual({ start: "0x1234", middle: "", end: "" });
  });
});

describe("splitMiddleForTwoLines", () => {
  it("should break the middle so the second line is a little longer", () => {
    const parts = splitAddress(ADDRESS);
    const [firstLineEnd, secondLineStart] = splitMiddleForTwoLines(parts);

    expect(firstLineEnd + secondLineStart).toBe(parts.middle);
    const firstLine = parts.start + firstLineEnd;
    const secondLine = secondLineStart + parts.end;
    expect(secondLine.length - firstLine.length).toBeGreaterThanOrEqual(0);
    expect(secondLine.length - firstLine.length).toBeLessThanOrEqual(2);
  });
});
