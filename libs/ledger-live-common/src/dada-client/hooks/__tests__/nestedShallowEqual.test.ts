import { nestedShallowEqual } from "../nestedShallowEqual";

describe("nestedShallowEqual", () => {
  it("returns true for identical references", () => {
    const obj = { a: { x: 1 }, b: { y: 2 } };
    expect(nestedShallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for empty objects", () => {
    expect(nestedShallowEqual({}, {})).toBe(true);
  });

  it("returns true for structurally identical nested objects", () => {
    const a = { eth: { price: 100, change: 5 }, btc: { price: 200, change: -3 } };
    const b = { eth: { price: 100, change: 5 }, btc: { price: 200, change: -3 } };
    expect(nestedShallowEqual(a, b)).toBe(true);
  });

  it("returns true for primitive values", () => {
    const a = { x: 1, y: "hello", z: true };
    const b = { x: 1, y: "hello", z: true };
    expect(nestedShallowEqual(a, b)).toBe(true);
  });

  it("returns false when key counts differ", () => {
    const a = { x: 1 };
    const b = { x: 1, y: 2 };
    expect(nestedShallowEqual(a, b)).toBe(false);
  });

  it("returns false when key sets differ despite same count", () => {
    const a = { a: undefined };
    const b = { b: undefined };
    expect(nestedShallowEqual(a, b)).toBe(false);
  });

  it("returns false when a nested value differs", () => {
    const a = { eth: { price: 100, change: 5 } };
    const b = { eth: { price: 100, change: 10 } };
    expect(nestedShallowEqual(a, b)).toBe(false);
  });

  it("returns false when a primitive value differs", () => {
    const a = { x: 1 };
    const b = { x: 2 };
    expect(nestedShallowEqual(a, b)).toBe(false);
  });

  it("returns true when inner objects have same shape with undefined values", () => {
    const a = { eth: { value: 1, type: "APY" } };
    const b = { eth: { value: 1, type: "APY" } };
    expect(nestedShallowEqual(a, b)).toBe(true);
  });

  it("returns false when one value is undefined and another is an object", () => {
    const a = { eth: undefined };
    const b = { eth: { price: 100 } };
    expect(nestedShallowEqual(a as Record<string, unknown>, b)).toBe(false);
  });
});
