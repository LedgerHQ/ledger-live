import Base64 from "base64-js";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { DecryptedPayload, Encrypted, ExtractEncryptedPayloads, Message } from "./types";
import { InvalidEncryptionKeyError } from "../errors";

export type Cipher = {
  encrypt: (obj: object) => string;
  decrypt: (data: string) => object;
};

export type MessageCipher = {
  encryptMessagePayload: <P extends ExtractEncryptedPayloads<Message>>(payload: P) => Encrypted<P>;
  decryptMessage: <M extends Message>(message: M) => DecryptedPayload<M>;
};

export function makeCipher(sessionEncryptionKey: Uint8Array): Cipher {
  function encrypt(obj: object) {
    const plaintext = JSON.stringify(obj);
    const data = new TextEncoder().encode(plaintext);
    const nonce = crypto.randomBytes(16);
    const ciphertext = crypto.encrypt(sessionEncryptionKey, nonce, data);
    const blob = new Uint8Array(nonce.length + ciphertext.length);
    blob.set(nonce);
    blob.set(ciphertext, nonce.length);
    return Base64.fromByteArray(blob);
  }

  function decrypt(data: string): Promise<object> {
    const blob = Base64.toByteArray(data);
    const nonce = blob.slice(0, 16);
    const ciphertext = blob.slice(16);
    try {
      const plaintext = crypto.decrypt(sessionEncryptionKey, nonce, ciphertext);
      const text = new TextDecoder().decode(plaintext);
      return JSON.parse(text);
    } catch (e) {
      throw new InvalidEncryptionKeyError("data can't be decrypted");
    }
  }

  return { encrypt, decrypt };
}

export function makeMessageCipher(cipher: Cipher): MessageCipher {
  function encryptMessagePayload<P extends ExtractEncryptedPayloads<Message>>(
    payload: P,
  ): Encrypted<P> {
    const encrypted = cipher.encrypt(payload);
    return { encrypted };
  }

  function decryptMessage<M extends Message>(message: M): DecryptedPayload<M> {
    if (message.message === "InitiateHandshake" || message.message === "Failure") {
      throw new Error(message.message + " is not encrypted");
    }
    const decrypted = cipher.decrypt(message.payload.encrypted) as DecryptedPayload<M>;
    return decrypted;
  }

  return { encryptMessagePayload, decryptMessage };
}
