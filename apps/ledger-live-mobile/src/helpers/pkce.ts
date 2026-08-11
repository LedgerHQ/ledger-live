import * as Crypto from "expo-crypto";
import { bytesToBase64Url, toBase64Url } from "./base64Url";

const PKCE_RANDOM_BYTE_LENGTH = 32;

export async function createPkcePairWithExpoCrypto() {
  const codeVerifier = bytesToBase64Url(await Crypto.getRandomBytesAsync(PKCE_RANDOM_BYTE_LENGTH));
  const codeChallenge = toBase64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    }),
  );
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256" as const,
  };
}
