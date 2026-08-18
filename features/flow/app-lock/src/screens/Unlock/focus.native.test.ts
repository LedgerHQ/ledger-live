import { shouldFocusPasswordField, type PasswordFieldFocusState } from "./focus";

const lockedAndReady: PasswordFieldFocusState = {
  hasPassword: true,
  isAwaitingBiometrics: false,
  isCovered: false,
  isAppActive: true,
};

describe("shouldFocusPasswordField", () => {
  it("asks for the keyboard on a lock screen the user is looking at", () => {
    expect(shouldFocusPasswordField(lockedAndReady)).toBe(true);
  });

  it("waits while the app is not in the foreground, where the keyboard cannot open", () => {
    expect(shouldFocusPasswordField({ ...lockedAndReady, isAppActive: false })).toBe(false);
  });

  it("stays quiet while a sheet covers the screen", () => {
    expect(shouldFocusPasswordField({ ...lockedAndReady, isCovered: true })).toBe(false);
  });

  it("stays quiet while biometrics is being asked for", () => {
    expect(shouldFocusPasswordField({ ...lockedAndReady, isAwaitingBiometrics: true })).toBe(false);
  });

  it("has nothing to focus without a password", () => {
    expect(shouldFocusPasswordField({ ...lockedAndReady, hasPassword: false })).toBe(false);
  });
});
