import { bytesToBase64Url, createRandomBase64UrlValue, stringToBytes } from "./utils";

type PkcePair = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
};

export async function createPkcePair(
  codeVerifier = createRandomBase64UrlValue(),
): Promise<PkcePair> {
  return {
    codeVerifier,
    codeChallenge: await createCodeChallenge(codeVerifier),
    codeChallengeMethod: "S256",
  };
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", stringToBytes(codeVerifier));
  return bytesToBase64Url(digest);
}
