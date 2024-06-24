import Base64 from "base64-js";
import pako from "pako";
import { TrustchainSDK, Trustchain } from "@ledgerhq/trustchain/types";

export type Cipher<Data> = {
  decrypt: (trustchain: Trustchain, base64payload: string) => Promise<Data>;
  encrypt: (trustchain: Trustchain, data: Data) => Promise<string>;
};

/**
 * Create a cipher that can encrypt/decrypt data using a trustchain for cloudsync
 */
export function makeCipher<Data>(trustchainSdk: TrustchainSDK): Cipher<Data> {
  return {
    decrypt: async (trustchain: Trustchain, base64payload: string): Promise<Data> => {
      const decrypted = await trustchainSdk.decryptUserData(
        trustchain,
        Base64.toByteArray(base64payload),
      );
      const decompressed = pako.inflate(decrypted);
      const json = JSON.parse(new TextDecoder().decode(decompressed));
      return json;
    },

    encrypt: async (trustchain: Trustchain, data: Data): Promise<string> => {
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      const compressed = pako.deflate(bytes);
      const encrypted = await trustchainSdk.encryptUserData(trustchain, compressed);
      const base64 = Base64.fromByteArray(encrypted);
      return base64;
    },
  };
}
