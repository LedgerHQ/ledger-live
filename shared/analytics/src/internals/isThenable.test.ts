import { isThenable } from "./isThenable";

describe("isThenable", () => {
  it("returns true for a Promise", () => {
    expect(isThenable(Promise.resolve())).toBe(true);
  });

  it("returns true for a thenable object", () => {
    expect(isThenable({ then: jest.fn() })).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(isThenable(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isThenable(null)).toBe(false);
  });

  it("returns false for a plain object", () => {
    expect(isThenable({})).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isThenable(42)).toBe(false);
  });
});
