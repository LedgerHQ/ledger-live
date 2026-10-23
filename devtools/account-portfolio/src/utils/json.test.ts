import { isJsonArray, isJsonObject } from "./json";

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

describe("isJsonObject", () => {
  it.each([
    ["{}", true],
    ['{"type":"send"}', true],
    ["[]", false],
    ["null", false],
    ["7", false],
    ["{", false],
    ["", false],
  ])("%j -> %s", (text, expected) => {
    expect(isJsonObject(text)).toBe(expected);
  });
});
