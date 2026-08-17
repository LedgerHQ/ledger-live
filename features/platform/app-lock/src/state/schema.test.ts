import { AppLockStateSchema, AuthenticationTypeSchema } from "./schema";

describe("AuthenticationTypeSchema", () => {
  it.each(["none", "password", "biometrics", "passwordAndBiometrics"])("accepts %s", value => {
    expect(AuthenticationTypeSchema.parse(value)).toBe(value);
  });

  it("rejects an unknown authentication type", () => {
    expect(AuthenticationTypeSchema.safeParse("pin").success).toBe(false);
  });
});

describe("AppLockStateSchema", () => {
  it("parses a complete protection state", () => {
    const state = {
      hasPassword: true,
      biometricsEnabled: false,
      isLocked: true,
      needsLongerPassword: false,
    };

    expect(AppLockStateSchema.parse(state)).toEqual(state);
  });

  it("rejects a partial state rather than defaulting the missing flags", () => {
    expect(AppLockStateSchema.safeParse({ hasPassword: true }).success).toBe(false);
  });
});
