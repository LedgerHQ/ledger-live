import { getAppLockAction } from "./appLock";

describe("getAppLockAction", () => {
  it.each([
    [false, "toggle", "set"],
    [true, "toggle", "remove"],
    [true, "change", "change"],
    [false, "change", null],
  ] as const)("with password set %s, %s gives %s", (passwordSet, intent, expected) => {
    expect(getAppLockAction(passwordSet, intent)).toBe(expected);
  });
});
