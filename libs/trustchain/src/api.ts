import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";

export type JWT = {
  access_token: string;
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

async function getAuthenticationChallenge(): Promise<{ json: Challenge; tlv: string }> {
  const { data } = await network<{ json: Challenge; tlv: string }>({
    url: `${getEnv("TRUSTCHAIN_API")}/v1/challenge`,
    method: "GET",
  });
  return data;
}

async function postChallengeResponse(request: {
  challenge: Challenge;
  signature: ChallengeSignature;
}): Promise<JWT> {
  const { data } = await network<JWT>({
    url: `${getEnv("TRUSTCHAIN_API")}/v1/authenticate`,
    method: "POST",
    data: request,
  });
  return data;
}

export default {
  getAuthenticationChallenge,
  postChallengeResponse,
};
