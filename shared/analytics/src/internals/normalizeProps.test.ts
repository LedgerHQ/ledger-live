import { normalizeProps } from "./normalizeProps";

describe("normalizeProps", () => {
  it("returns an empty object for null", () => {
    expect(normalizeProps(null)).toEqual({});
  });

  it("returns an empty object for undefined", () => {
    expect(normalizeProps(undefined)).toEqual({});
  });

  it("wraps an Error under the error key", () => {
    const error = new Error("something went wrong");

    expect(normalizeProps(error)).toEqual({ error });
  });

  it("returns a shallow copy of an object", () => {
    const props = { foo: "bar" };

    const result = normalizeProps(props);

    expect(result).toEqual({ foo: "bar" });
    expect(result).not.toBe(props);
  });
});
