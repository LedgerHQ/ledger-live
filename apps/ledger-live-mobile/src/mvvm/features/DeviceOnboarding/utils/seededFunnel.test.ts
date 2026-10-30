import { isSeededDeviceFunnelOn } from "./seededFunnel";

describe("isSeededDeviceFunnelOn", () => {
  it("should stay off when the flag is disabled", () => {
    expect(isSeededDeviceFunnelOn(false, true)).toBe(false);
  });

  it("should stay off when connectSeededDevice is false", () => {
    expect(isSeededDeviceFunnelOn(true, false)).toBe(false);
  });

  it("should turn on only when the flag and the entry param are both true", () => {
    expect(isSeededDeviceFunnelOn(true, true)).toBe(true);
  });
});
