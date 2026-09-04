import { splitAddress } from "../splitAddress";
import { splitMiddleForTwoLines } from "../splitMiddleForTwoLines.native";

function lineLengths(address: string) {
  const parts = splitAddress(address);
  const [first, second] = splitMiddleForTwoLines(parts);

  expect(parts.start + first + second + parts.end).toBe(address);

  return [parts.start.length + first.length, second.length + parts.end.length];
}

describe("splitMiddleForTwoLines", () => {
  it("keeps about 55% of the address on the second line", () => {
    for (const address of [
      "0x1234567890abcdef1234567890abcdef12345678",
      "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq0dxpg8ndv0hqm",
      "0xe4912d2d1234567890abcdef40517672",
    ]) {
      const [first, second] = lineLengths(address);

      expect(first).toBeLessThan(second);
      expect(second / address.length).toBeGreaterThanOrEqual(0.55);
    }
  });

  it("does not break addresses too short to split", () => {
    expect(splitMiddleForTwoLines(splitAddress("0x1234"))).toEqual(["", ""]);
  });
});
