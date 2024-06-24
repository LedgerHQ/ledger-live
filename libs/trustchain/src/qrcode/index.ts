import { Permissions, crypto } from "@ledgerhq/hw-trustchain";
import { getEnv } from "@ledgerhq/live-env";
import WebSocket from "isomorphic-ws";
import { MemberCredentials, Trustchain, TrustchainMember } from "../types";
import { makeCipher, makeMessageCipher } from "./cipher";
import { Message } from "./types";
import { InvalidDigitsError } from "../errors";

const version = 1;

const CLOSE_TIMEOUT = 100; // just enough time for the onerror to appear before onclose

/**
 * establish a channel to be able to add a member to the trustchain after displaying the QR Code
 * @returns a promise that resolves when this is done
 */
export async function createQRCodeHostInstance({
  onDisplayQRCode,
  onDisplayDigits,
  addMember,
}: {
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
}): Promise<void> {
  const ephemeralKey = await crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  const url = `${getEnv("TRUSTCHAIN_API").replace("http", "ws")}/v1/qr?host=${publisher}`;
  const ws = new WebSocket(url);
  function send(message: Message) {
    ws.send(JSON.stringify(message));
  }

  let sessionEncryptionKey: Uint8Array | undefined;
  let cipher: ReturnType<typeof makeMessageCipher> | undefined;
  let expectedDigits: string | undefined;
  let finished = false;

  onDisplayQRCode(url);
  return new Promise((resolve, reject) => {
    ws.addEventListener("error", reject);
    ws.addEventListener("close", () => {
      if (finished) return;
      // this error would reflect a protocol error. because otherwise, we would get the "error" event. it shouldn't be visible to user, but we use it to ensure the promise ends.
      setTimeout(() => reject(new Error("qrcode websocket prematurely closed")), CLOSE_TIMEOUT);
    });
    ws.addEventListener("message", async e => {
      try {
        const data = parseMessage(e.data);
        switch (data.message) {
          case "InitiateHandshake": {
            const candidatePublicKey = crypto.from_hex(data.payload.ephemeral_public_key);
            sessionEncryptionKey = await crypto.ecdh(ephemeralKey, candidatePublicKey);
            cipher = makeMessageCipher(makeCipher(sessionEncryptionKey));
            // --- end of handshake first phase ---
            const digitsCount = 3;
            const digits = await randomDigits(digitsCount);
            expectedDigits = digits;
            onDisplayDigits(digits);
            const payload = await cipher.encryptMessagePayload({
              digits: digitsCount,
              connected: false,
            });
            send({ version, publisher, message: "HandshakeChallenge", payload });
            break;
          }
          case "CompleteHandshakeChallenge": {
            if (!cipher) {
              throw new Error("sessionEncryptionKey not set");
            }
            const { digits } = await cipher.decryptMessage(data);
            if (digits !== expectedDigits) {
              console.warn("User invalid digits", { digits, expectedDigits });
              const payload = {
                type: "HANDSHAKE_COMPLETION_FAILED",
                message: "invalid digits",
              };
              send({ version, publisher, message: "Failure", payload });
              throw new InvalidDigitsError("invalid digits");
            }
            const payload = await cipher.encryptMessagePayload({});
            send({ version, publisher, message: "HandshakeCompletionSucceeded", payload });
            break;
          }
          case "TrustchainShareCredential": {
            finished = true;
            if (!cipher) {
              throw new Error("sessionEncryptionKey not set");
            }
            const { id, name } = await cipher.decryptMessage(data);
            const trustchain = await addMember({ id, name, permissions: Permissions.OWNER });
            const payload = await cipher.encryptMessagePayload({ trustchain });
            send({ version, publisher, message: "TrustchainAddedMember", payload });
            resolve();
            break;
          }
          case "Failure": {
            finished = true;
            console.error(data);
            const error = fromErrorMessage(data.payload);
            reject(error);
            ws.close();
            break;
          }
          default: {
            throw new Error("unexpected message");
          }
        }
      } catch (e) {
        console.error(e);
        ws.close();
        reject(e);
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
}): Promise<Trustchain> {
  const m = scannedUrl.match(/host=([0-9A-Fa-f]+)/);
  if (!m) {
    throw new Error("invalid scannedUrl");
  }
  const hostPublicKey = crypto.from_hex(m[1]);
  const ephemeralKey = await crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  const sessionEncryptionKey = await crypto.ecdh(ephemeralKey, hostPublicKey);
  const cipher = makeMessageCipher(makeCipher(sessionEncryptionKey));
  const ws = new WebSocket(scannedUrl);
  function send(message: Message) {
    ws.send(JSON.stringify(message));
  }
  let finished = false;

  return new Promise((resolve, reject) => {
    ws.addEventListener("close", () => {
      if (finished) return;
      // this error would reflect a protocol error. because otherwise, we would get the "error" event. it shouldn't be visible to user, but we use it to ensure the promise ends.
      setTimeout(() => reject(new Error("qrcode websocket prematurely closed")), CLOSE_TIMEOUT);
    });

    ws.addEventListener("message", async e => {
      try {
        const data = parseMessage(e.data);
        switch (data.message) {
          case "HandshakeChallenge": {
            const config = await cipher.decryptMessage(data);
            onRequestQRCodeInput(config, digits => {
              cipher.encryptMessagePayload({ digits }).then(payload => {
                send({ version, publisher, message: "CompleteHandshakeChallenge", payload });
              });
            });
            break;
          }
          case "HandshakeCompletionSucceeded": {
            const payload = await cipher.encryptMessagePayload({
              id: memberCredentials.pubkey,
              name: memberName,
            });
            send({ version, publisher, message: "TrustchainShareCredential", payload });
            break;
          }
          case "TrustchainAddedMember": {
            finished = true;
            const { trustchain } = await cipher.decryptMessage(data);
            resolve(trustchain);
            ws.close();
            break;
          }
          case "Failure": {
            finished = true;
            console.error(data);
            const error = fromErrorMessage(data.payload);
            reject(error);
            ws.close();
            break;
          }
          default:
            throw new Error("unexpected message");
        }
      } catch (e) {
        console.error(e);
        ws.close();
        reject(e);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () => {
      const payload = { ephemeral_public_key: crypto.to_hex(ephemeralKey.publicKey) };
      send({ version, publisher, message: "InitiateHandshake", payload });
    });
  });
}

async function randomDigits(count: number): Promise<string> {
  const bytes = await crypto.randomBytes(count);
  let digits = "";
  for (let i = 0; i < count; i++) {
    digits += (bytes[i] % 10).toString();
  }
  return digits;
}

function parseMessage(e): Message {
  const message = JSON.parse(e.toString());
  if (!message || typeof message !== "object") {
    throw new Error("invalid message");
  }
  if (message.version !== 1) {
    throw new Error("invalid version");
  }
  if (typeof message.publisher !== "string") {
    throw new Error("invalid publisher");
  }
  if (typeof message.message !== "string") {
    throw new Error("invalid message");
  }
  if (typeof message.payload !== "object") {
    throw new Error("invalid payload");
  }
  return message;
}

function fromErrorMessage(payload: { message: string; type: string }): Error {
  if (payload.type === "HANDSHAKE_COMPLETION_FAILED") {
    throw new InvalidDigitsError(payload.message);
  }
  const error = new Error(payload.message);
  error.name = "TrustchainQRCode-" + payload.type;
  return error;
}
