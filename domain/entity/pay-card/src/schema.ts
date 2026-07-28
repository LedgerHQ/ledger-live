import { z } from "zod";

export const PayCardProviderSchema = z.enum(["baanx"]);

export const PayCardPreAuthSchema = z.object({
  loginUrl: z.string().url(),
});

export const PayCardSessionSchema = z.object({
  appSessionToken: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export const PayCardVerificationStateSchema = z.string().min(1);

export const PayCardCardStatusSchema = z.string().min(1);

export const PayCardUserSchema = z.object({
  verificationState: PayCardVerificationStateSchema,
  cardStatus: PayCardCardStatusSchema,
  cardFunded: z.boolean(),
  addedToDigitalWallet: z.boolean(),
  hasFirstTransaction: z.boolean(),
});

export const PayCardParamsSchema = z.object({
  platform: z.string(),
  name: z.string(),
  path: z.string().optional(),
});
