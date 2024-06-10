import { crypto } from "@ledgerhq/hw-trustchain";

export type Cipher = {
  encrypt: (obj: object) => Promise<Uint8Array>;
  decrypt: (data: Uint8Array) => Promise<object>;
};

export function makeCipher(commandStreamPrivateKey: Uint8Array): Cipher {
  async function encrypt(obj: object): Promise<Uint8Array> {
    const plaintext = JSON.stringify(obj);
    const data = new TextEncoder().encode(plaintext);
    const blob = await crypto.encryptUserData(commandStreamPrivateKey, data);
    return blob;
  }

  async function decrypt(blob: Uint8Array): Promise<object> {
    const plaintext = await crypto.decryptUserData(commandStreamPrivateKey, blob);
    const text = new TextDecoder().decode(plaintext);
    return JSON.parse(text);
  }

  return { encrypt, decrypt };
}
