import { shouldFocusPasswordField } from "./focus";

const state = (overrides: Partial<Parameters<typeof shouldFocusPasswordField>[0]> = {}) => ({
  hasPassword: true,
  isAwaitingBiometrics: false,
  isForgotPasswordOpen: false,
  isAppActive: true,
  ...overrides,
});

describe("focusing the password field", () => {
  it("does once the app is active and the field is the thing being asked for", () => {
    expect(shouldFocusPasswordField(state())).toBe(true);
  });

  it("waits while the app is not active", () => {
    expect(shouldFocusPasswordField(state({ isAppActive: false }))).toBe(false);
  });

  it("stays away while the biometric prompt is up", () => {
    expect(shouldFocusPasswordField(state({ isAwaitingBiometrics: true }))).toBe(false);
  });

  it("gives the keyboard up to the forgot-password sheet, which it would otherwise hide behind", () => {
    expect(shouldFocusPasswordField(state({ isForgotPasswordOpen: true }))).toBe(false);
  });

  it("has nothing to focus for a user with no password", () => {
    expect(shouldFocusPasswordField(state({ hasPassword: false }))).toBe(false);
  });
});
