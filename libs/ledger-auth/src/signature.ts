import { bytesToBase64Url, sortObject, stringToBytes } from "./utils";
import { WalletAuthSignatureError } from "./errors";
import type {
  AuthorizeRequest,
  ChallengeRequest,
  ChallengeResponse,
  Signer,
  SigningAlgorithm,
} from "./types";

type SignPayloadParams = {
  algorithm?: SigningAlgorithm;
  challengeRequest: ChallengeRequest;
  challengeResponse: ChallengeResponse;
  signer: Signer;
};

type SignaturePayload = ChallengeRequest & Pick<ChallengeResponse, "challenge" | "challengeId">;

export async function signChallengePayload({
  challengeRequest,
  challengeResponse,
  signer,
  algorithm = { name: "ECDSA", hash: "SHA-256" },
}: SignPayloadParams): Promise<Pick<AuthorizeRequest, "signature">> {
  const payload = createSignaturePayload({
    ...challengeRequest,
    challenge: challengeResponse.challenge,
    challengeId: challengeResponse.challengeId,
  });

  try {
    const signature = await signer.sign(algorithm, payload);
    return {
      signature: bytesToBase64Url(signature.signature),
    };
  } catch (error) {
    throw new WalletAuthSignatureError(error);
  }
}

function createSignaturePayload(payload: SignaturePayload): ArrayBuffer {
  return stringToBytes(JSON.stringify(sortObject(payload)));
}
