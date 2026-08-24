import { z } from "zod";

export const AuthenticationTypeSchema = z.enum([
  "none",
  "password",
  "biometrics",
  "passwordAndBiometrics",
]);

export const AppLockStateSchema = z.object({
  hasPassword: z.boolean(),
  biometricsEnabled: z.boolean(),
  isLocked: z.boolean(),
});
