import { readLaunchForceProvider } from "./launchForceProvider";

describe("readLaunchForceProvider", () => {
  it("should read a numeric launch argument", () => {
    expect(readLaunchForceProvider(4)).toBe(4);
  });

  it("should read a numeric string launch argument", () => {
    expect(readLaunchForceProvider("4")).toBe(4);
  });

  it("should reject a missing or non-integer launch argument", () => {
    expect(readLaunchForceProvider(undefined)).toBeUndefined();
    expect(readLaunchForceProvider("")).toBeUndefined();
    expect(readLaunchForceProvider("4.5")).toBeUndefined();
    expect(readLaunchForceProvider(0)).toBeUndefined();
    expect(readLaunchForceProvider(true)).toBeUndefined();
  });
});
