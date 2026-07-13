import { bytesToBase64Url, stringToBytes } from "./utils";

export type CreatePkcePair = () => PkcePair | Promise<PkcePair>;

export type PkcePair = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
};

export async function createPkcePairWithWebCrypto(
  codeVerifier = createRandomBase64UrlValue(),
): Promise<PkcePair> {
  return {
    codeVerifier,
    codeChallenge: await createCodeChallenge(codeVerifier),
    codeChallengeMethod: "S256",
  };
}

const RANDOM_VALUE_BYTE_LENGTH = 32;

function createRandomBase64UrlValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_VALUE_BYTE_LENGTH));
  return bytesToBase64Url(bytes);
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", stringToBytes(codeVerifier));
  return bytesToBase64Url(digest);
}
