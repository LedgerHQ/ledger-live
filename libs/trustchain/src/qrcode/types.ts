import { Trustchain } from "../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Encrypted<T> = {
  encrypted: string;
};
export type Message =
  | {
      version: number;
      publisher: string;
      message: "InitiateHandshake";
      payload: { ephemeral_public_key: string };
    }
  | {
      version: number;
      publisher: string;
      message: "Failure";
      payload: { message: string; type: string };
    }
  | {
      version: number;
      publisher: string;
      message: "HandshakeChallenge";
      payload: Encrypted<{ digits: number; connected: boolean }>;
    }
  | {
      version: number;
      publisher: string;
      message: "CompleteHandshakeChallenge";
      payload: Encrypted<{ digits: string }>;
    }
  | {
      version: number;
      publisher: string;
      message: "HandshakeCompletionSucceeded";
      payload: Encrypted<Record<string, never>>;
    }
  | {
      version: number;
      publisher: string;
      message: "TrustchainShareCredential";
      payload: Encrypted<{
        // public key of the member
        id: string;
        // name of the member
        name: string;
      }>;
    }
  | {
      version: number;
      publisher: string;
      message: "TrustchainAddedMember";
      payload: Encrypted<{
        trustchain: Trustchain;
      }>;
    };

export type DecryptedPayload<M> = M extends { payload: Encrypted<infer T> }
  ? T
  : M extends { payload: infer T }
    ? T
    : never;

export type ExtractEncryptedPayloads<T> = T extends { payload: Encrypted<infer P> } ? P : never;
