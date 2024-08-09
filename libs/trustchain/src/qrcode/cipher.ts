import Base64 from "base64-js";
import { crypto } from "@ledgerhq/hw-trustchain";
import { DecryptedPayload, Encrypted, ExtractEncryptedPayloads, Message } from "./types";
import { InvalidEncryptionKeyError } from "../errors";

export type Cipher = {
  encrypt: (obj: object) => Promise<string>;
  decrypt: (data: string) => Promise<object>;
};

export type MessageCipher = {
  encryptMessagePayload: <P extends ExtractEncryptedPayloads<Message>>(
    payload: P,
  ) => Promise<Encrypted<P>>;
  decryptMessage: <M extends Message>(message: M) => Promise<DecryptedPayload<M>>;
};

export function makeCipher(sessionEncryptionKey: Uint8Array): Cipher {
  async function encrypt(obj: object): Promise<string> {
    const plaintext = JSON.stringify(obj);
    const data = new TextEncoder().encode(plaintext);
    const nonce = await crypto.randomBytes(16);
    const ciphertext = await crypto.encrypt(sessionEncryptionKey, nonce, data);
    const blob = new Uint8Array(nonce.length + ciphertext.length);
    blob.set(nonce);
    blob.set(ciphertext, nonce.length);
    return Base64.fromByteArray(blob);
  }

  async function decrypt(data: string): Promise<object> {
    const blob = Base64.toByteArray(data);
    const nonce = blob.slice(0, 16);
    const ciphertext = blob.slice(16);
    try {
      const plaintext = await crypto.decrypt(sessionEncryptionKey, nonce, ciphertext);
      const text = new TextDecoder().decode(plaintext);
      return JSON.parse(text);
    } catch (e) {
      throw new InvalidEncryptionKeyError("data can't be decrypted");
    }
  }

  return { encrypt, decrypt };
}

export function makeMessageCipher(cipher: Cipher): MessageCipher {
  async function encryptMessagePayload<P extends ExtractEncryptedPayloads<Message>>(
    payload: P,
  ): Promise<Encrypted<P>> {
    const encrypted = await cipher.encrypt(payload);
    return { encrypted };
  }

  async function decryptMessage<M extends Message>(message: M): Promise<DecryptedPayload<M>> {
    if (message.message === "InitiateHandshake" || message.message === "Failure") {
      throw new Error(message.message + " is not encrypted");
    }
    const decrypted = (await cipher.decrypt(message.payload.encrypted)) as DecryptedPayload<M>;
    return decrypted;
  }

  return { encryptMessagePayload, decryptMessage };
}
