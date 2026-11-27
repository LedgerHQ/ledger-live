import { parseAutoLockTimeout } from "./autoLock";

describe("parseAutoLockTimeout", () => {
  it("gives the timeout of an option, including never", () => {
    expect(parseAutoLockTimeout("10")).toBe(10);
    expect(parseAutoLockTimeout("-1")).toBe(-1);
  });

  it("gives null for a value that is not an option", () => {
    expect(parseAutoLockTimeout("5")).toBeNull();
    expect(parseAutoLockTimeout("")).toBeNull();
  });
});
