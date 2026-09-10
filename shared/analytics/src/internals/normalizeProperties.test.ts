import { normalizeProperties } from "./normalizeProperties";

describe("normalizeProperties", () => {
  it("returns an empty object for null", () => {
    expect(normalizeProperties(null)).toEqual({});
  });

  it("returns an empty object for undefined", () => {
    expect(normalizeProperties(undefined)).toEqual({});
  });

  it("wraps an Error under the error key", () => {
    const error = new Error("something went wrong");

    expect(normalizeProperties(error)).toEqual({ error });
  });

  it("returns a shallow copy of an object", () => {
    const properties = { foo: "bar" };

    const result = normalizeProperties(properties);

    expect(result).toEqual({ foo: "bar" });
    expect(result).not.toBe(properties);
  });
});
