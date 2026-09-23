import { isThenable } from "./isThenable";

describe("isThenable", () => {
  it("returns true for a promise", () => {
    expect(isThenable(Promise.resolve(1))).toBe(true);
  });

  it("returns false for a sync function", () => {
    const syncFn = () => 1;
    expect(isThenable(syncFn)).toBe(false);
  });
});
