import { z } from "zod";

export const AuthenticationTypeSchema = z.enum([
  "none",
  "password",
  "biometrics",
  "passwordAndBiometrics",
]);

export const AppLockStateSchema = z.object({
  isHydrated: z.boolean(),
  hasPassword: z.boolean(),
  biometricsEnabled: z.boolean(),
  isLocked: z.boolean(),
});
