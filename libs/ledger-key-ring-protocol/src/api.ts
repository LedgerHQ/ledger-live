import { z } from "zod";
import network from "@ledgerhq/live-network";
import { JWT } from "./types";
import {
  type KeycloakToken,
  KeycloakTokenResponseSchema,
  WalletAuthInvalidAuthorizationError,
  WalletAuthInvalidTokenError,
} from "@ledgerhq/ledger-auth";

export type StatusAPIResponse = {
  name: string;
  version: string;
};

export const APIJWTSchema = z.object({
  access_token: z.jwt(),
  // permissions: { [trustchainId]: { [path]: string } }
  permissions: z.record(z.string(), z.record(z.string(), z.string())),
});
export type APIJWT = z.infer<typeof APIJWTSchema>;

export const ChallengeJsonSchema = z.object({
  version: z.number().int(),
  challenge: z.object({
    data: z.hex().min(1),
    expiry: z.iso.datetime(),
  }),
  host: z.hostname(),
  rp: z.array(
    z.object({
      credential: z.object({
        version: z.number().int(),
        curveId: z.number().int(),
        signAlgorithm: z.number().int(),
        publicKey: z.hex().length(66),
      }),
      signature: z.string().min(1),
    }),
  ),
  protocolVersion: z.object({
    major: z.number().int(),
    minor: z.number().int(),
    patch: z.number().int(),
  }),
});
export type Challenge = z.infer<typeof ChallengeJsonSchema>;

export const LKRPChallengeSchema = z.object({
  json: ChallengeJsonSchema,
  tlv: z.hex().min(1),
});
export type LKRPChallenge = z.infer<typeof LKRPChallengeSchema>;

export type ChallengeSignature = {
  credential: {
    version: number;
    curveId: number;
    signAlgorithm: number;
    publicKey: string;
  };
  signature: string;
  attestation: string;
};

export type TrustchainsResponse = {
  [trustchainId: string]: {
    [path: string]: string[]; // list of permissions
  };
};

export type TrustchainResponse = {
  [key: string]: string;
};

export type PutCommandsRequest = {
  path: string;
  blocks: string[];
};

const getApi = (apiBaseURL: string) => {
  /**
   * Authentication flow:
   */

  async function getAuthenticationChallenge(): Promise<{ json: Challenge; tlv: string }> {
    const { data } = await network<{ json: Challenge; tlv: string }>({
      url: `${apiBaseURL}/v1/challenge`,
      method: "GET",
    });
    return data;
  }

  async function postChallengeResponse(request: {
    challenge: Challenge;
    signature: ChallengeSignature;
  }): Promise<JWT> {
    const { data } = await network<APIJWT>({
      url: `${apiBaseURL}/v1/authenticate`,
      method: "POST",
      data: request,
    });
    return {
      accessToken: data.access_token,
      permissions: data.permissions,
    };
  }

  async function refreshAuth(jwt: JWT): Promise<JWT> {
    const { data } = await network<APIJWT>({
      url: `${apiBaseURL}/v1/refresh`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
    });
    return {
      accessToken: data.access_token,
      permissions: data.permissions,
    };
  }

  async function oidcPostChallengeResponse(request: {
    challenge: Challenge;
    signature: ChallengeSignature;
  }): Promise<string> {
    const { data } = await network<unknown>({
      url: `${apiBaseURL}/openid/v1/authenticate`,
      method: "POST",
      data: request,
    });

    try {
      return z.string().parse(data);
    } catch {
      throw new WalletAuthInvalidAuthorizationError();
    }
  }

  async function oidcExchangeAuthCode(
    authCode: string,
    client_id: string,
    redirect_uri: string,
    codeVerifier?: string,
  ): Promise<string> {
    const formBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      client_id,
      redirect_uri,
    });
    if (codeVerifier) {
      formBody.set("code_verifier", codeVerifier);
    }

    const { data } = await network<unknown>({
      url: `${apiBaseURL}/openid/v1/token`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formBody.toString(),
    });

    try {
      return APIJWTSchema.parse(data).access_token;
    } catch {
      throw new WalletAuthInvalidTokenError();
    }
  }

  async function oidcExchangeToken(idpToken: string, client_id: string): Promise<KeycloakToken> {
    const { data } = await network<unknown>({
      url: `${apiBaseURL}/openid/v1/exchange`,
      method: "POST",
      data: { client_id },
      headers: {
        Authorization: `Bearer ${idpToken}`,
      },
    });

    try {
      const token = KeycloakTokenResponseSchema.parse(data);
      return {
        scope: token.scope,
        tokenType: token.token_type,
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        refreshToken: token.refresh_token,
        refreshExpiresIn: token.refresh_expires_in,
      };
    } catch {
      throw new WalletAuthInvalidTokenError();
    }
  }

  /**
   * Trustchain management:
   */

  async function getTrustchains(jwt: JWT): Promise<TrustchainsResponse> {
    const { data } = await network<TrustchainsResponse>({
      url: `${apiBaseURL}/v1/trustchains`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
    });
    return data;
  }

  async function getTrustchain(jwt: JWT, trustchain_id: string): Promise<TrustchainResponse> {
    const { data } = await network<TrustchainResponse>({
      url: `${apiBaseURL}/v1/trustchain/${trustchain_id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
    });
    return data;
  }

  async function postDerivation(
    jwt: JWT,
    trustchain_id: string,
    commandStream: string,
  ): Promise<void> {
    await network<void>({
      url: `${apiBaseURL}/v1/trustchain/${trustchain_id}/derivation`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
        "Content-Type": "application/json",
      },
      data: commandStream,
    });
  }

  async function postSeed(jwt: JWT, commandStream: string): Promise<void> {
    await network<void>({
      url: `${apiBaseURL}/v1/seed`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt.accessToken}`,
      },
      data: commandStream,
    });
  }

  async function putCommands(
    jwt: JWT,
    trustchain_id: string,
    request: PutCommandsRequest,
  ): Promise<void> {
    await network<void>({
      url: `${apiBaseURL}/v1/trustchain/${trustchain_id}/commands`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
      data: request,
    });
  }

  async function deleteTrustchain(jwt: JWT, trustchain_id: string): Promise<void> {
    await network<void>({
      url: `${apiBaseURL}/v1/trustchain/${trustchain_id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
    });
  }

  async function fetchStatus(): Promise<StatusAPIResponse> {
    const { data } = await network<StatusAPIResponse>({
      url: `${apiBaseURL}/_info`,
      method: "GET",
    });
    return data;
  }

  return {
    getAuthenticationChallenge,
    postChallengeResponse,
    refreshAuth,
    oidcPostChallengeResponse,
    oidcExchangeAuthCode,
    oidcExchangeToken,
    getTrustchains,
    getTrustchain,
    postDerivation,
    postSeed,
    putCommands,
    deleteTrustchain,
    fetchStatus,
  };
};

export default getApi;
