import { z } from "zod";

/**
 * Wire contracts for the three Card API endpoints this flow calls. They are parsed before the
 * responses reach the flow, so a backend change surfaces here rather than in a view model.
 */
export const PayCardPreAuthResponseSchema = z.object({
  loginUrl: z.string().url(),
});

export const PayCardAuthResponseSchema = z.object({
  appSessionToken: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export const PayCardUserResponseSchema = z.object({
  verificationState: z.string().min(1),
  cardStatus: z.string().min(1),
  cardFunded: z.boolean(),
  addedToDigitalWallet: z.boolean(),
  hasFirstTransaction: z.boolean(),
});
