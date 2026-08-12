import { z } from "zod";

/**
 * Wire contracts for the Card API endpoints this use case calls. Responses are parsed before they
 * reach a caller, so a backend change surfaces here rather than in a view model.
 */

/**
 * Answer to the authorize initiation
 */
export const PayCardAuthorizeInitiateResponseSchema = z.object({
  token: z.string().min(1),
  url: z.string().url(),
});

/** Both grants — `authorization_code` and `refresh_token` — answer with this shape. */
export const PayCardSessionResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
  refresh_token_expires_in: z.number().int().positive(),
});

/**
 * The session as this package exposes it. Lifetimes stay the durations the backend sent rather than
 * absolute instants: turning them into instants needs a clock, which belongs with the token storage
 * no package owns yet.
 */
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
 * `GET /v1/user` also returns first and last name, date of birth, email, phone number, postal address
 * and — in the US — an SSN. Zod drops keys a schema does not declare, so listing only the two fields
 * the Card flows act on keeps that PII out of the RTK Query cache, and therefore out of anything that
 * serialises or persists the store.
 */
export const PayCardUserResponseSchema = z.object({
  id: z.string().uuid(),
  verificationState: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
});
