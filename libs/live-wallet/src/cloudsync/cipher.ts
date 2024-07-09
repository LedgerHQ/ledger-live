import Base64 from "base64-js";
import { compress, decompress } from "fflate";
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
      const decompressed = await new Promise<Uint8Array>((resolve, reject) =>
        decompress(decrypted, (err, result) => (err ? reject(err) : resolve(result))),
      );
      const json = JSON.parse(new TextDecoder().decode(decompressed));
      return json;
    },

    encrypt: async (trustchain: Trustchain, data: Data): Promise<string> => {
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      const compressed = await new Promise<Uint8Array>((resolve, reject) =>
        compress(bytes, (err, result) => (err ? reject(err) : resolve(result))),
      );
      const encrypted = await trustchainSdk.encryptUserData(trustchain, compressed);
      const base64 = Base64.fromByteArray(encrypted);
      return base64;
    },
  };
}
