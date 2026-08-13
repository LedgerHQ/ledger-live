import { z } from "zod";
import {
  PayCardAuthorizeInitiateSchema,
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";

export type PayCardAuthorizeInitiateResponse = z.infer<
  typeof PayCardAuthorizeInitiateResponseSchema
>;

export type PayCardAuthorizeInitiate = z.infer<typeof PayCardAuthorizeInitiateSchema>;

/** Wire shape of a token response, before it is mapped onto {@link PayCardSession}. */
export type PayCardSessionResponse = z.infer<typeof PayCardSessionResponseSchema>;

export type PayCardSession = z.infer<typeof PayCardSessionSchema>;

export type PayCardLogoutResult = z.infer<typeof PayCardLogoutResponseSchema>;

export type PayCardUser = z.infer<typeof PayCardUserResponseSchema>;

export type PayCardAuthorizeInitiateRequest = {
  /** CSRF token echoed back on the redirect. The backend requires at least 8 characters. */
  readonly state: string;
  /** `BASE64URL(SHA256(codeVerifier))`; the verifier itself is sent later to the token endpoint. */
  readonly codeChallenge: string;
};

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};
