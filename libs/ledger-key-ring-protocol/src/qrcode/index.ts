import { Permissions, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import WebSocket from "isomorphic-ws";
import { MemberCredentials, Trustchain, TrustchainMember } from "../types";
import { MessageCipher, makeCipher, makeMessageCipher } from "./cipher";
import {
  AddedMemberSchema,
  ChallengeAnswerSchema,
  ChallengeSchema,
  EmptyBodySchema,
  EnvelopeSchema,
  MemberSchema,
  Message,
} from "./types";
import { ProtocolStateMachine, createProtocolStateMachine } from "./protocol";
import {
  InvalidDigitsError,
  NoTrustchainInitialized,
  QRCodeProtocolError,
  QRCodeWSClosed,
  ScannedInvalidQrCode,
  ScannedOldImportQrCode,
  TrustchainAlreadyInitialized,
} from "../errors";
import { log } from "@ledgerhq/logs";
import { z } from "zod";

const version = 1;

const CLOSE_TIMEOUT = 100; // just enough time for the onerror to appear before onclose

const DIGITS_COUNT = 3;

type CredentialExchange = {
  data: Message;
  cipher: MessageCipher | undefined;
  addMember: (member: TrustchainMember) => Promise<Trustchain>;
  send: (message: Message) => void;
  publisher: string;
  resolve: (trustchain?: Trustchain) => void;
  reject: (error: Error) => void;
  memberCredentials: MemberCredentials;
  memberName: string;
  ws: WebSocket;
  sm: ProtocolStateMachine;
  initialTrustchainId?: string;
};

function decrypt<M extends Message, T>(cipher: MessageCipher, message: M, schema: z.ZodType<T>): T {
  let body: unknown;
  try {
    body = cipher.decryptMessage(message);
  } catch {
    throw new QRCodeProtocolError(`undecryptable ${message.message}`);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new QRCodeProtocolError(`invalid ${message.message} body`);
  }
  return parsed.data;
}

const makeFail =
  (sm: ProtocolStateMachine, ws: WebSocket, reject: (error: unknown) => void) =>
  (error: unknown) => {
    console.error("socket error", error);
    // closing is asynchronous, so frames already queued would otherwise still be handled
    sm.abort();
    ws.close();
    reject(error);
  };

const handleCredentialExchange = async ({
  data,
  cipher,
  addMember,
  send,
  publisher,
  resolve,
  reject,
  memberCredentials,
  memberName,
  ws,
  sm,
  initialTrustchainId,
}: CredentialExchange) => {
  switch (data.message) {
    case "TrustchainShareCredential": {
      if (!cipher) throw new Error("sessionEncryptionKey not set");
      const { id, name } = decrypt(cipher, data, MemberSchema);
      if (!initialTrustchainId) {
        const payload = {
          type: "UNEXPECTED_SHARE_CREDENTIAL",
          message: "unexpected share credential",
        };
        send({ version, publisher, message: "Failure", payload });
        throw new NoTrustchainInitialized("unexpected share credential");
      }
      const trustchain = await addMember({ id, name, permissions: Permissions.OWNER });
      const payload = cipher.encryptMessagePayload({ trustchain });
      sm.transition("send", "TrustchainAddedMember");
      send({ version, publisher, message: "TrustchainAddedMember", payload });
      resolve();
      break;
    }

    case "TrustchainRequestCredential": {
      if (!cipher) throw new Error("sessionEncryptionKey not set");
      // decrypting is what proves the frame is the peer's and not the relay's
      decrypt(cipher, data, EmptyBodySchema);
      if (initialTrustchainId) {
        const payload = {
          type: "UNEXPECTED_REQUEST_CREDENTIAL",
          message: initialTrustchainId,
        };
        send({ version, publisher, message: "Failure", payload });
        throw new TrustchainAlreadyInitialized(initialTrustchainId);
      }
      const payload = cipher.encryptMessagePayload({
        id: memberCredentials.pubkey,
        name: memberName,
      });
      sm.transition("send", "TrustchainShareCredential");
      send({ version, publisher, message: "TrustchainShareCredential", payload });
      break;
    }

    case "TrustchainAddedMember": {
      if (!cipher) throw new Error("sessionEncryptionKey not set");
      const { trustchain } = decrypt(cipher, data, AddedMemberSchema);
      resolve(trustchain);
      ws.close();
      break;
    }

    case "Failure": {
      log("trustchain/qrcode", "Failure", { data });
      const error = fromErrorMessage(data.payload);
      reject(error);
      ws.close();
      break;
    }

    default:
      throw new QRCodeProtocolError(`unhandled ${data.message}`);
  }
};

/**
 * establish a channel to be able to add a member to the trustchain after displaying the QR Code
 * @returns a promise that resolves when this is done
 */
export async function createQRCodeHostInstance({
  trustchainApiBaseUrl,
  onDisplayQRCode,
  onDisplayDigits,
  addMember,
  memberCredentials,
  memberName,
  initialTrustchainId,
}: {
  /**
   * the base URL of the trustchain API
   */
  trustchainApiBaseUrl: string;
  /**
   * this function will need to display a UI to show the QR Code
   */
  onDisplayQRCode: (url: string) => void;
  /**
   * this function will need to display a UI to show the digits
   */
  onDisplayDigits: (digits: string) => void;
  /**
   * this function will need to using the TrustchainSDK (and use sdk.addMember)
   */
  addMember: (member: TrustchainMember) => Promise<Trustchain>;
  /**
   * the client credentials of the instance (given by TrustchainSDK)
   */
  memberCredentials: MemberCredentials;
  /**
   * the name of the member
   */
  memberName: string;
  /**
   * if the member already has a trustchain, this will be defined
   */
  initialTrustchainId?: string;
}): Promise<Trustchain | void> {
  const ephemeralKey = crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  const url = `${trustchainApiBaseUrl.replace("http", "ws")}/v1/qr?host=${publisher}`;
  const ws = new WebSocket(url);
  function send(message: Message) {
    ws.send(JSON.stringify(message));
  }

  const sm = createProtocolStateMachine("host");
  let cipher: MessageCipher | undefined;
  let expectedDigits: string | undefined;

  onDisplayQRCode(url);
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const fail = makeFail(sm, ws, reject);

    ws.addEventListener("error", reject);
    ws.addEventListener("close", () => {
      if (sm.isFinished()) return;
      // this error would reflect a protocol error. because otherwise, we would get the "error" event.
      const time = Date.now() - startedAt;
      reject(new QRCodeWSClosed("qrcode websocket prematurely closed", { time }));
    });
    ws.addEventListener("message", async e => {
      try {
        if (sm.isFinished()) return;
        const data = parseMessage(e.data);
        sm.bindPeer(data.publisher);
        sm.transition("recv", data.message);
        switch (data.message) {
          case "InitiateHandshake": {
            if (!sameHex(data.publisher, data.payload.ephemeral_public_key)) {
              throw new QRCodeProtocolError("publisher does not match the ephemeral public key");
            }
            try {
              const candidatePublicKey = crypto.from_hex(data.payload.ephemeral_public_key);
              cipher = makeMessageCipher(makeCipher(crypto.ecdh(ephemeralKey, candidatePublicKey)));
            } catch {
              throw new QRCodeProtocolError("invalid ephemeral public key");
            }
            // --- end of handshake first phase ---
            const digits = randomDigits(DIGITS_COUNT);
            expectedDigits = digits;
            onDisplayDigits(digits);
            const payload = cipher.encryptMessagePayload({
              digits: DIGITS_COUNT,
              connected: false,
            });
            sm.transition("send", "HandshakeChallenge");
            send({ version, publisher, message: "HandshakeChallenge", payload });
            break;
          }
          case "CompleteHandshakeChallenge": {
            if (!cipher) throw new Error("sessionEncryptionKey not set");
            const { digits } = decrypt(cipher, data, ChallengeAnswerSchema);
            if (!constantTimeEqual(digits, expectedDigits)) {
              const payload = {
                type: "HANDSHAKE_COMPLETION_FAILED",
                message: "invalid digits",
              };
              send({ version, publisher, message: "Failure", payload });
              throw new InvalidDigitsError("invalid digits");
            }
            const payload = cipher.encryptMessagePayload({});
            sm.transition("send", "HandshakeCompletionSucceeded");
            send({ version, publisher, message: "HandshakeCompletionSucceeded", payload });
            break;
          }
          default: {
            await handleCredentialExchange({
              data,
              cipher,
              addMember,
              send,
              publisher,
              resolve,
              reject,
              memberCredentials,
              memberName,
              ws,
              sm,
              initialTrustchainId,
            });
          }
        }
      } catch (e) {
        fail(e);
      }
    });
  });
}

/**
 * establish a channel to be able to add myself to the trustchain after scanning the QR Code
 * @returns a promise that resolves a Trustchain when this is done
 */
export async function createQRCodeCandidateInstance({
  memberCredentials,
  memberName,
  addMember,
  initialTrustchainId,
  scannedUrl,
  onRequestQRCodeInput,
}: {
  /**
   * the client credentials of the instance (given by TrustchainSDK)
   */
  memberCredentials: MemberCredentials;
  /**
   * the name of the member
   */
  memberName: string;
  /**
   * if the member already has a trustchain, this will be defined
   */
  initialTrustchainId?: string;
  /**
   * this function will need to using the TrustchainSDK (and use sdk.addMember)
   */
  addMember: (member: TrustchainMember) => Promise<Trustchain>;
  /**
   * the scanned URL that contains the host public key
   */
  scannedUrl: string;
  /**
   * this function will need to display a UI to ask the user to input the digits
   * and then call the callback with the digits
   */
  onRequestQRCodeInput: (
    config: {
      digits: number;
      connected: boolean;
    },
    callback: (digits: string) => void,
  ) => void;
}): Promise<Trustchain | void> {
  const m = scannedUrl.match(/host=([0-9A-Fa-f]+)/);
  if (!m) {
    if (isOldBase64Import(scannedUrl)) throw new ScannedOldImportQrCode();
    throw new ScannedInvalidQrCode();
  }
  const hostPublisher = m[1];
  const ephemeralKey = crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  let cipher: MessageCipher;
  try {
    const hostPublicKey = crypto.from_hex(hostPublisher);
    cipher = makeMessageCipher(makeCipher(crypto.ecdh(ephemeralKey, hostPublicKey)));
  } catch {
    throw new ScannedInvalidQrCode();
  }
  const ws = new WebSocket(scannedUrl);
  function send(message: Message) {
    ws.send(JSON.stringify(message));
  }

  const sm = createProtocolStateMachine("candidate");

  return new Promise((resolve, reject) => {
    const fail = makeFail(sm, ws, reject);

    ws.addEventListener("close", () => {
      if (sm.isFinished()) return;
      // this error would reflect a protocol error. because otherwise, we would get the "error" event. it shouldn't be visible to user, but we use it to ensure the promise ends.
      setTimeout(() => reject(new Error("qrcode websocket prematurely closed")), CLOSE_TIMEOUT);
    });

    ws.addEventListener("message", async e => {
      try {
        if (sm.isFinished()) return;
        const data = parseMessage(e.data);
        if (!sameHex(data.publisher, hostPublisher)) {
          throw new QRCodeProtocolError("message publisher is not the scanned host");
        }
        sm.bindPeer(data.publisher);
        sm.transition("recv", data.message);
        switch (data.message) {
          case "HandshakeChallenge": {
            const config = decrypt(cipher, data, ChallengeSchema);
            // the protocol grants a single attempt, so a UI re-submitting the digits is ignored
            let answered = false;
            onRequestQRCodeInput(config, digits => {
              if (answered || sm.isFinished()) return;
              answered = true;
              try {
                const payload = cipher.encryptMessagePayload({ digits });
                sm.transition("send", "CompleteHandshakeChallenge");
                send({ version, publisher, message: "CompleteHandshakeChallenge", payload });
              } catch (error) {
                fail(error);
              }
            });
            break;
          }
          case "HandshakeCompletionSucceeded": {
            // decrypting is what proves the digits were accepted by the peer
            decrypt(cipher, data, EmptyBodySchema);
            if (initialTrustchainId) {
              const payload = cipher.encryptMessagePayload({});
              sm.transition("send", "TrustchainRequestCredential");
              send({ version, publisher, message: "TrustchainRequestCredential", payload });
            } else {
              const payload = cipher.encryptMessagePayload({
                id: memberCredentials.pubkey,
                name: memberName,
              });
              sm.transition("send", "TrustchainShareCredential");
              send({ version, publisher, message: "TrustchainShareCredential", payload });
            }
            break;
          }
          default:
            await handleCredentialExchange({
              data,
              cipher,
              addMember,
              send,
              publisher,
              resolve,
              reject,
              memberCredentials,
              memberName,
              ws,
              sm,
              initialTrustchainId,
            });
        }
      } catch (e) {
        fail(e);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () => {
      try {
        sm.transition("send", "InitiateHandshake");
        send({
          version,
          publisher,
          message: "InitiateHandshake",
          payload: { ephemeral_public_key: publisher },
        });
      } catch (e) {
        fail(e);
      }
    });
  });
}

function randomDigits(count: number) {
  const bytes = crypto.randomBytes(count);
  let digits = "";
  for (let i = 0; i < count; i++) {
    digits += (bytes[i] % 10).toString();
  }
  return digits;
}

const sameHex = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

function constantTimeEqual(a: unknown, b: string | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

function parseMessage(e): Message {
  let json: unknown;
  try {
    json = JSON.parse(e.toString());
  } catch {
    throw new QRCodeProtocolError("invalid json");
  }
  const parsed = EnvelopeSchema.safeParse(json);
  if (!parsed.success) {
    throw new QRCodeProtocolError("invalid message");
  }
  return parsed.data;
}

function fromErrorMessage(payload: { message: string; type: string }): Error {
  if (payload.type === "HANDSHAKE_COMPLETION_FAILED") {
    return new InvalidDigitsError(payload.message);
  }
  if (payload.type === "UNEXPECTED_SHARE_CREDENTIAL") {
    return new NoTrustchainInitialized(payload.message);
  }
  if (payload.type === "UNEXPECTED_REQUEST_CREDENTIAL") {
    return new TrustchainAlreadyInitialized(payload.message);
  }
  const error = new Error(payload.message);
  error.name = "TrustchainQRCode-" + payload.type;
  return error;
}

const BASE64_CHARSET = /^[A-Za-z0-9+/=]+$/;
const BASE64_STRUCTURE = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const LEGACY_HEADER = Uint8Array.from([0x64, 0x00, 0x03, 0x00]);
const MIN_BASE64_LENGTH = 100;

const cleanBase64 = (value: string): string => value.trim().replace(/\s+/g, "");

const isValidBase64Format = (value: string): boolean =>
  BASE64_CHARSET.test(value) && BASE64_STRUCTURE.test(value);

const hasLegacyHeader = (bytes: Uint8Array): boolean =>
  bytes.length >= LEGACY_HEADER.length && LEGACY_HEADER.every((byte, i) => bytes[i] === byte);

export function isOldBase64Import(input: string): boolean {
  if (typeof input !== "string" || input.length === 0) return false;

  const clean = cleanBase64(input);
  if (clean.length < MIN_BASE64_LENGTH || !isValidBase64Format(clean)) return false;

  try {
    const decoded = Buffer.from(clean, "base64");
    if (decoded.toString("base64") !== clean) return false;
    return hasLegacyHeader(decoded);
  } catch {
    return false;
  }
}
