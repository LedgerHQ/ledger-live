import { valueTypeOf } from "./valueType";

describe("valueTypeOf", () => {
  it.each([
    [undefined, "unset"],
    [null, "null"],
    [[1], "array"],
    [{ a: 1 }, "object"],
    ["url", "string"],
    [60000, "number"],
    [false, "boolean"],
  ])("should type %p as %s", (value, expected) => {
    expect(valueTypeOf(value)).toBe(expected);
  });
});
