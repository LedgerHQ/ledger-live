import {
  PayCardLogoutResultSchema,
  PayCardPreAuthSchema,
  PayCardSessionSchema,
  PayCardUserSchema,
  type PayCardLogoutResult,
  type PayCardPreAuth,
  type PayCardSession,
  type PayCardUser,
} from "@domain/entity-pay-card";
import {
  PayCardAuthResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardPreAuthResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

export function transformPayCardPreAuthResponse(
  response: unknown,
): PayCardPreAuth {
  const { login_url } = PayCardPreAuthResponseSchema.parse(response);
  return PayCardPreAuthSchema.parse({ loginUrl: login_url });
}

export function transformPayCardAuthResponse(response: unknown): PayCardSession {
  const { app_session_token, expires_at } = PayCardAuthResponseSchema.parse(response);
  return PayCardSessionSchema.parse({
    appSessionToken: app_session_token,
    expiresAt: expires_at,
  });
}

export function transformPayCardUserResponse(response: unknown): PayCardUser {
  const { provider_user_id, verification_state, phase } =
    PayCardUserResponseSchema.parse(response);
  return PayCardUserSchema.parse({
    providerUserId: provider_user_id,
    verificationState: verification_state,
    phase,
  });
}

export function transformPayCardLogoutResponse(
  response: unknown,
): PayCardLogoutResult {
  return PayCardLogoutResultSchema.parse(
    PayCardLogoutResponseSchema.parse(response),
  );
}
