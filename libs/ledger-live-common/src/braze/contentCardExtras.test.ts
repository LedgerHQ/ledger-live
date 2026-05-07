import { parseOrder, sanitizeExtras } from "./contentCardExtras";

describe("parseOrder", () => {
  it("should parse a valid numeric string", () => {
    expect(parseOrder("3")).toBe(3);
  });

  it("should parse zero", () => {
    expect(parseOrder("0")).toBe(0);
  });

  it("should parse a negative number", () => {
    expect(parseOrder("-1")).toBe(-1);
  });

  it("should return undefined for undefined input", () => {
    expect(parseOrder(undefined)).toBeUndefined();
  });

  it("should return undefined for an empty string", () => {
    expect(parseOrder("")).toBeUndefined();
  });

  it("should return undefined for a non-numeric string", () => {
    expect(parseOrder("abc")).toBeUndefined();
  });

  it("should return undefined for 'NaN'", () => {
    expect(parseOrder("NaN")).toBeUndefined();
  });

  it("should return undefined for 'undefined'", () => {
    expect(parseOrder("undefined")).toBeUndefined();
  });

  it("should truncate a float string to an integer", () => {
    expect(parseOrder("2.7")).toBe(2);
  });

  it("should parse a string with leading whitespace", () => {
    expect(parseOrder(" 5")).toBe(5);
  });
});

describe("sanitizeExtras", () => {
  it("should return an empty object for undefined extras", () => {
    expect(sanitizeExtras(undefined)).toEqual({});
  });

  it("should convert a valid order string to a number", () => {
    const result = sanitizeExtras({ order: "2", title: "Hello" });
    expect(result).toEqual({ order: 2, title: "Hello" });
  });

  it("should omit order when the value is not numeric", () => {
    const result = sanitizeExtras({ order: "abc", title: "Hello" });
    expect(result).toEqual({ title: "Hello" });
    expect(result).not.toHaveProperty("order");
  });

  it("should omit order when it is missing from extras", () => {
    const result = sanitizeExtras({ title: "Hello" });
    expect(result).toEqual({ title: "Hello" });
    expect(result).not.toHaveProperty("order");
  });

  it("should preserve all other extras as strings", () => {
    const result = sanitizeExtras({
      order: "1",
      title: "Title",
      location: "top_wallet",
      type: "hero",
    });
    expect(result).toEqual({
      order: 1,
      title: "Title",
      location: "top_wallet",
      type: "hero",
    });
  });

  it("should handle order of zero", () => {
    const result = sanitizeExtras({ order: "0" });
    expect(result).toEqual({ order: 0 });
  });
});
