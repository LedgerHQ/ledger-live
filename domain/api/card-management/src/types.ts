import { z } from "zod";
import {
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";

export type PayCardAuthorizeInitiate = z.infer<typeof PayCardAuthorizeInitiateResponseSchema>;

/** Wire shape of a token response, before it is mapped onto {@link PayCardSession}. */
export type PayCardSessionResponse = z.infer<typeof PayCardSessionResponseSchema>;

export type PayCardSession = z.infer<typeof PayCardSessionSchema>;

export type PayCardLogoutResult = z.infer<typeof PayCardLogoutResponseSchema>;

export type PayCardUser = z.infer<typeof PayCardUserResponseSchema>;

export type PayCardAuthorizeInitiateRequest = {
  readonly clientId: string;
  /** Whitelisted with the provider. The token exchange has to send the same value. */
  readonly redirectUri: string;
  /** CSRF token echoed back on the redirect. The backend requires at least 8 characters. */
  readonly state: string;
  /** `BASE64URL(SHA256(codeVerifier))`; the verifier itself is sent later to the token endpoint. */
  readonly codeChallenge: string;
};

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  /** Must match the `redirectUri` sent to the authorize initiation exactly. */
  readonly redirectUri: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};
