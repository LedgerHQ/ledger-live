import { z } from "zod";

export const PayCardProviderSchema = z.enum(["baanx"]);

export const PayCardPreAuthSchema = z.object({
  loginUrl: z.string().url(),
});

export const PayCardSessionSchema = z.object({
  appSessionToken: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export const PayCardVerificationStateSchema = z.string().min(1).nullable();

export const PayCardPhaseSchema = z.string().min(1).nullable();

export const PayCardUserSchema = z.object({
  providerUserId: z.string().min(1),
  verificationState: PayCardVerificationStateSchema,
  phase: PayCardPhaseSchema,
});

export const PayCardLogoutResultSchema = z.object({
  success: z.boolean(),
});
