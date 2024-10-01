import { Permissions, crypto } from "@ledgerhq/hw-trustchain";
import WebSocket from "isomorphic-ws";
import { MemberCredentials, Trustchain, TrustchainMember } from "../types";
import { makeCipher, makeMessageCipher } from "./cipher";
import { Message } from "./types";
import {
  InvalidDigitsError,
  NoTrustchainInitialized,
  QRCodeWSClosed,
  ScannedInvalidQrCode,
  ScannedOldImportQrCode,
  TrustchainAlreadyInitialized,
} from "../errors";
import { log } from "@ledgerhq/logs";

const version = 1;

const CLOSE_TIMEOUT = 100; // just enough time for the onerror to appear before onclose

const commonSwitch = async ({
  data,
  cipher,
  addMember,
  send,
  publisher,
  resolve,
  memberCredentials,
  memberName,
  reject,
  ws,
  setFinished,
  initialTrustchainId,
}) => {
  switch (data.message) {
    case "TrustchainShareCredential": {
      if (!initialTrustchainId) {
        const payload = {
          type: "UNEXPECTED_SHARE_CREDENTIAL",
          message: "unexpected share credential",
        };
        send({ version, publisher, message: "Failure", payload });
        throw new NoTrustchainInitialized("unexpected share credential");
      }
      setFinished(true);
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

    case "TrustchainRequestCredential": {
      if (initialTrustchainId) {
        const payload = {
          type: "UNEXPECTED_REQUEST_CREDENTIAL",
          message: initialTrustchainId,
        };
        send({ version, publisher, message: "Failure", payload });
        throw new TrustchainAlreadyInitialized(initialTrustchainId);
      }
      const payload = await cipher.encryptMessagePayload({
        id: memberCredentials.pubkey,
        name: memberName,
      });
      send({ version, publisher, message: "TrustchainShareCredential", payload });
      break;
    }
    case "TrustchainAddedMember": {
      setFinished(true);
      const { trustchain } = await cipher.decryptMessage(data);
      resolve(trustchain);
      ws.close();
      break;
    }
    case "Failure": {
      setFinished(true);
      log("trustchain/qrcode", "Failure", { data });
      const error = fromErrorMessage(data.payload);
      reject(error);
      ws.close();
      break;
    }
    case "HandshakeChallenge":
    case "HandshakeCompletionSucceeded":
    case "InitiateHandshake":
    case "CompleteHandshakeChallenge":
      break;
    default:
      throw new Error("unexpected message");
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
  const ephemeralKey = await crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  const url = `${trustchainApiBaseUrl.replace("http", "ws")}/v1/qr?host=${publisher}`;
  const ws = new WebSocket(url);
  function send(message: Message) {
    ws.send(JSON.stringify(message));
  }

  let sessionEncryptionKey: Uint8Array | undefined;
  let cipher: ReturnType<typeof makeMessageCipher> | undefined;
  let expectedDigits: string | undefined;
  let finished = false;
  const setFinished = newValue => (finished = newValue);

  onDisplayQRCode(url);
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    ws.addEventListener("error", reject);
    ws.addEventListener("close", () => {
      if (finished) return;
      // this error would reflect a protocol error. because otherwise, we would get the "error" event.
      const time = Date.now() - startedAt;
      reject(new QRCodeWSClosed("qrcode websocket prematurely closed", { time }));
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
        }
        await commonSwitch({
          data,
          cipher,
          addMember,
          send,
          publisher,
          resolve,
          memberCredentials,
          memberName,
          reject,
          ws,
          setFinished,
          initialTrustchainId,
        });
      } catch (e) {
        console.error("socket error", e);
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
    if (isFromOldAccountsImport(scannedUrl)) throw new ScannedOldImportQrCode();
    throw new ScannedInvalidQrCode();
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
  const setFinished = newValue => (finished = newValue);

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
            if (initialTrustchainId) {
              const payload = await cipher.encryptMessagePayload({});
              send({ version, publisher, message: "TrustchainRequestCredential", payload });
            } else {
              const payload = await cipher.encryptMessagePayload({
                id: memberCredentials.pubkey,
                name: memberName,
              });
              send({ version, publisher, message: "TrustchainShareCredential", payload });
            }
            break;
          }
        }
        await commonSwitch({
          data,
          cipher,
          addMember,
          send,
          publisher,
          resolve,
          memberCredentials,
          memberName,
          reject,
          ws,
          setFinished,
          initialTrustchainId,
        });
      } catch (e) {
        console.error("socket error", e);
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
  if (payload.type === "UNEXPECTED_SHARE_CREDENTIAL") {
    throw new NoTrustchainInitialized(payload.message);
  }
  if (payload.type === "UNEXPECTED_REQUEST_CREDENTIAL") {
    throw new TrustchainAlreadyInitialized(payload.message);
  }
  const error = new Error(payload.message);
  error.name = "TrustchainQRCode-" + payload.type;
  return error;
}

function isFromOldAccountsImport(scannedUrl: string): boolean {
  return !!scannedUrl.match(/^[A-Za-z0-9+/=]*$/);
}
