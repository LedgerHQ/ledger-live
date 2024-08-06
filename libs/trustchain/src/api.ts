import network from "@ledgerhq/live-network";
import { JWT } from "./types";

export type StatusAPIResponse = {
  name: string;
  version: string;
};

export type APIJWT = {
  access_token: string;
  permissions: {
    [trustchainId: string]: {
      [path: string]: string[];
    };
  };
};

export type Challenge = {
  version: number;
  challenge: {
    data: string;
    expiry: string;
  };
  host: string;
  rp: {
    credential: {
      version: number;
      curveId: number;
      signAlgorithm: number;
      publicKey: string;
    };
    signature: string;
  }[];
  protocolVersion: {
    major: number;
    minor: number;
    patch: number;
  };
};

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

type PutCommandsRequest = {
  path: string;
  blocks: string[];
};

const getApi = (apiBaseURL: string) => {
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
