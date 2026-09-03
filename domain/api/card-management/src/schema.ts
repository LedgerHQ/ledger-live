import { z } from "zod";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

/** Hex colours the provider paints the details image with. Its own defaults apply when omitted. */
export const PayCardDetailsCssSchema = z.object({
  cardBackgroundColor: z.string().regex(HEX_COLOR).optional(),
  cardTextColor: z.string().regex(HEX_COLOR).optional(),
  panBackgroundColor: z.string().regex(HEX_COLOR).optional(),
  panTextColor: z.string().regex(HEX_COLOR).optional(),
});

export const PayCardDetailsTokenResponseSchema = z.object({
  token: z.string().min(1),
  /** Loaded straight into an image, so reject anything that is not an `https:` URL. */
  imageUrl: z
    .string()
    .url()
    .refine(value => value.startsWith("https://"), { message: "must be an https URL" }),
});

export const PayCardInternalWalletSchema = z.object({
  id: z.string().min(1),
  balance: z.string().min(1),
  currency: z.string().min(1),
  address: z.string().min(1),
  // Nullish because a wallet with no memo answers with the key absent, others with `null`.
  addressMemo: z.string().min(1).nullish(),
  /** What the link and unlink endpoints identify a wallet by. Not the same as `id`. */
  addressId: z.string().min(1),
});

/** Both linking and unlinking answer with this and nothing else. */
export const PayCardLinkedWalletMutationResponseSchema = z.object({
  success: z.boolean(),
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
