import { isShowingSplash } from "./splash";

describe("isShowingSplash", () => {
  it("stands in for the splash while biometrics is being asked for", () => {
    expect(isShowingSplash({ hasPassword: true, isAwaitingBiometrics: true })).toBe(true);
  });

  it("stays the splash for a user with no password to type", () => {
    expect(isShowingSplash({ hasPassword: false, isAwaitingBiometrics: false })).toBe(true);
  });

  it("gives way to the password screen once biometrics has been answered", () => {
    expect(isShowingSplash({ hasPassword: true, isAwaitingBiometrics: false })).toBe(false);
  });
});
