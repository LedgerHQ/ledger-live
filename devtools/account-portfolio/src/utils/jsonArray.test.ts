import { isJsonArray } from "./jsonArray";

describe("isJsonArray", () => {
  it.each([
    ["[]", true],
    ['[{"a":1}]', true],
    ["{}", false],
    ["[", false],
    ["", false],
  ])("%j -> %s", (text, expected) => {
    expect(isJsonArray(text)).toBe(expected);
  });
});
