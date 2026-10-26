import { isJsonArray } from "./jsonArray";

describe("isJsonArray", () => {
  it.each([
    ["[]", true],
    ["{}", false],
    ["[", false],
  ])("%j -> %s", (text, expected) => {
    expect(isJsonArray(text)).toBe(expected);
  });
});
