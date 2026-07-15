import { z } from "zod";

export const PayCardPreAuthResponseSchema = z.object({
  login_url: z.string().url(),
});

export const PayCardAuthResponseSchema = z.object({
  app_session_token: z.string().min(1),
  expires_at: z.string().datetime(),
});

export const PayCardUserResponseSchema = z.object({
  provider_user_id: z.string().min(1),
  verification_state: z.string().min(1).nullable(),
  phase: z.string().min(1).nullable(),
});

export const PayCardLogoutResponseSchema = z.object({
  success: z.boolean(),
});
