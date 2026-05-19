import { createRandomBase64UrlValue } from "./utils";
import {
  WalletAuthInvalidAuthorizationError,
  WalletAuthInvalidChallengeError,
  WalletAuthInvalidTokenError,
} from "./errors";
import { createPkcePair } from "./pkce";
import { signChallengePayload } from "./signature";
import type { AuthParams, ChallengeRequest } from "./types";

export async function authenticate({ authService, config, signer }: AuthParams): Promise<string> {
  const { codeChallenge, codeChallengeMethod, codeVerifier } = await createPkcePair();
  const challengeRequest: ChallengeRequest = {
    scope: ["openid"],
    audience: "Keycloak",
    clientId: config.clientId,
    codeChallenge,
    codeChallengeMethod,
    nonce: createRandomBase64UrlValue(),
  };

  const challengeResponse = await authService.getChallenge(challengeRequest);
  if (!challengeResponse.challenge) {
    throw new WalletAuthInvalidChallengeError();
  }

  const { signature } = await signChallengePayload({
    challengeRequest,
    challengeResponse,
    signer,
  });

  const authorizationResponse = await authService.authorize({
    ...challengeRequest,
    challenge: challengeResponse.challenge,
    challengeId: challengeResponse.challengeId,
    signature,
  });
  if (!authorizationResponse.authorizationCode) {
    throw new WalletAuthInvalidAuthorizationError();
  }

  const tokenResponse = await authService.getToken({
    authorizationCode: authorizationResponse.authorizationCode,
    clientId: config.clientId,
    codeVerifier,
  });
  if (!tokenResponse.jwt) {
    throw new WalletAuthInvalidTokenError();
  }

  return tokenResponse.jwt;
}
