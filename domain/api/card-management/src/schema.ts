import { z } from "zod";

export const PayCardAuthorizeInitiateResponseSchema = z.object({
  token: z.string().min(1),
  /** Handed straight to a browser, so no other scheme is accepted. */
  url: z.string().url().startsWith("https://"),
});

/** Both grants — `authorization_code` and `refresh_token` — answer with this shape. */
export const PayCardSessionResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
  refresh_token_expires_in: z.number().int().positive(),
});

/** Lifetimes stay the durations the backend sent: turning them into instants needs a clock. */
export const PayCardSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1),
  refreshTokenExpiresIn: z.number().int().positive(),
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
