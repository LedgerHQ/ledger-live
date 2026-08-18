import * as Crypto from "expo-crypto";
import { bytesToBase64Url, toBase64Url } from "./base64Url";

/**
 * Native half of the OAuth randomness. React Native exposes no WebCrypto, so this goes through
 * `expo-crypto`, which is backed by the platform CSPRNG (`SecRandomCopyBytes` / `SecureRandom`).
 */

export async function createRandomBase64Url(byteLength: number): Promise<string> {
  return bytesToBase64Url(await Crypto.getRandomBytesAsync(byteLength));
}

export async function sha256Base64Url(value: string): Promise<string> {
  return toBase64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
      encoding: Crypto.CryptoEncoding.BASE64,
    }),
  );
}
