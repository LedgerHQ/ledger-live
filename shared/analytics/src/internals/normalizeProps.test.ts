import { normalizeProps } from "./normalizeProps";

describe("normalizeProps", () => {
  it("returns an empty object for null", () => {
    expect(normalizeProps(null)).toEqual({});
  });

  it("returns an empty object for undefined", () => {
    expect(normalizeProps(undefined)).toEqual({});
  });

  it("wraps an Error as name and message only", () => {
    const error = new Error("something went wrong");
    error.name = "TypeError";

    const result = normalizeProps(error);

    expect(result).toEqual({
      error: { name: "TypeError", message: "something went wrong" },
    });
    expect(result.error).not.toBeInstanceOf(Error);
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("omits extra enumerable fields from a custom Error", () => {
    class CustomError extends Error {
      constructor(
        message: string,
        readonly token: string,
      ) {
        super(message);
        this.name = "CustomError";
      }
    }

    expect(normalizeProps(new CustomError("failed", "secret-token"))).toEqual({
      error: { name: "CustomError", message: "failed" },
    });
  });

  it("returns a shallow copy of an object", () => {
    const props = { foo: "bar" };

    const result = normalizeProps(props);

    expect(result).toEqual({ foo: "bar" });
    expect(result).not.toBe(props);
  });
});
