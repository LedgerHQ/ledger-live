import { z } from "zod";

/**
 * Both grants — `authorization_code` and `refresh_token` — answer with this shape. Baanx's contract
 * carries no lifetime for the refresh token itself, only for the access token.
 */
export const PayCardSessionResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
});

/** The lifetime stays the duration the backend sent: turning it into an instant needs a clock. */
export const PayCardSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1),
});

export const PayCardLogoutResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Deliberately narrow. The endpoint also returns name, date of birth, email, address and — in the US
 * — an SSN; zod drops undeclared keys, keeping that PII out of the RTK Query cache. Do not widen.
 */
export const PayCardUserResponseSchema = z.object({
  id: z.string().uuid(),
  verificationState: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
});

export const PayCardErrorResponseSchema = z.object({
  message: z.string(),
});

/**
 * `POST /v1/card/order` answers with nothing but this flag. The card itself only becomes observable
 * through the card status endpoint.
 */
export const PayCardOrderResponseSchema = z.object({
  success: z.boolean(),
});

export const PayCardFreezeStateResponseSchema = z.object({
  success: z.boolean(),
});

export const PayCardStatusResponseSchema = z.object({
  id: z.string().min(1),
  // Optional because a live card answered with neither.
  holderName: z.string().min(1).optional(),
  /** `YYYY/MM`, as the provider formats it. */
  expiryDate: z.string().min(1).optional(),
  panLast4: z.string().min(1),
  status: z.enum(["ACTIVE", "FROZEN", "BLOCKED"]),
  type: z.enum(["VIRTUAL", "PHYSICAL", "METAL"]),
  orderedAt: z.string().min(1),
});

export const PayCardInternalWalletSchema = z.object({
  id: z.string().min(1),
  balance: z.string().min(1),
  currency: z.string().min(1),
  address: z.string().min(1),
  addressMemo: z.string().min(1).nullable(),
});

export const PayCardInternalWalletsResponseSchema = z.array(PayCardInternalWalletSchema);

export const PayCardLinkedWalletSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  currency: z.string().min(1),
  network: z.string().min(1),
  priority: z.number().finite(),
});

export const PayCardLinkedWalletsResponseSchema = z.array(PayCardLinkedWalletSchema);

/** One onboarding step the card holder still has to complete, as the backend describes it. */
export const PayCardOnboardingStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  isDone: z.boolean(),
});

export const PayCardOnboardingStatusResponseSchema = z.object({
  steps: z.array(PayCardOnboardingStepSchema),
});
