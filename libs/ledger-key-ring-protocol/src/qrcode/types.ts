import { z } from "zod";
import { Trustchain } from "../types";

// oxlint-disable-next-line typescript/no-unused-vars -- phantom type parameter for nominal typing
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
      message: "TrustchainRequestCredential";
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

export const EmptyBodySchema = z.object({});

export const ChallengeSchema = z.object({
  digits: z.int().min(1).max(10),
  connected: z.boolean(),
});

export const ChallengeAnswerSchema = z.object({ digits: z.string() });

export const MemberSchema = z.object({
  id: z.hex().length(66).lowercase(),
  name: z.string().min(1),
});

export const AddedMemberSchema = z.object({
  trustchain: z.object({
    rootId: z.string().min(1),
    walletSyncEncryptionKey: z.hex().length(64).lowercase(),
    applicationPath: z.string().min(1),
  }),
});

const HexSchema = z.hex();

const envelope = <M extends string, P extends z.ZodTypeAny>(message: M, payload: P) =>
  z.object({ version: z.literal(1), publisher: HexSchema, message: z.literal(message), payload });

const EncryptedPayloadSchema = z.object({ encrypted: z.string() });

export const EnvelopeSchema = z.discriminatedUnion("message", [
  envelope("InitiateHandshake", z.object({ ephemeral_public_key: HexSchema })),
  envelope("Failure", z.object({ message: z.string(), type: z.string() })),
  envelope("HandshakeChallenge", EncryptedPayloadSchema),
  envelope("CompleteHandshakeChallenge", EncryptedPayloadSchema),
  envelope("HandshakeCompletionSucceeded", EncryptedPayloadSchema),
  envelope("TrustchainRequestCredential", EncryptedPayloadSchema),
  envelope("TrustchainShareCredential", EncryptedPayloadSchema),
  envelope("TrustchainAddedMember", EncryptedPayloadSchema),
]);
