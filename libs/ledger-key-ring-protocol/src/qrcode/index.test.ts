import type { AddressInfo } from "net";
import { createQRCodeHostInstance, createQRCodeCandidateInstance } from ".";
import WebSocket from "ws";
import { convertKeyPairToLiveCredentials } from "../utils";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { MessageCipher, makeCipher, makeMessageCipher } from "./cipher";
import {
  InvalidDigitsError,
  QRCodeProtocolError,
  ScannedInvalidQrCode,
  ScannedOldImportQrCode,
} from "../errors";

// Test data constants
const MOCK_TRUSTCHAIN = {
  rootId: "test-root-id",
  walletSyncEncryptionKey: "11".repeat(32),
  applicationPath: "m/0'/16'/0'",
} as const;

const LEGACY_IMPORT_QR_CODE =
  "ZAADAAIAAAAEd2JXMpuoYdzvkNzFTlmQLPcGf2LSjDOgqaB3nQoZqlimcCX6HNkescWKyT1DCGuwO7IesD7oYg+fdZPkiIfFL3V9swfZRePkaNN09IjXsWLsim9hK/qi/RC1/ofX3hYNKUxUAgYVVG82WKXIk47siWfUlRZsCYSAARQ6ASpUgidPjMHaOMK6w53wTZplwo7Zjv1HrIyKwr3Ci8OmrFye5g==";

const CRYPTO_ADDRESSES = {
  ethereum: "0x6fC39c0C6D379d8D168e9EFD90C4B55Fc1Bb1fF2",
  solana: "5eMHnPQa4vHP6oFbydZx6RjzGvZR2qZtCQ7E8yrFw93n",
  ripple: "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1",
  cardano:
    "addr1q9dduxx8zhp4vq4rkfsl8gk0wnwhkyd4shzdc3u9jxuw8c3af2cqpjnhx8yqz3sjdf8ttf5htp2v07ah3ts2mtfzw46qqj7kzw",
  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  cosmos: "cosmos1h9w6z0sgp2k4z6qzwk0jhp5a5rz87vt4l25fsl",
} as const;

const createRelay = async () => {
  const server = new WebSocket.Server({ port: 0 });
  await new Promise<void>(resolve => server.on("listening", () => resolve()));
  const sockets: WebSocket[] = [];
  server.on("connection", ws => {
    sockets.push(ws);
    ws.on("message", message => {
      for (const peer of sockets) {
        if (peer !== ws && peer.readyState === WebSocket.OPEN) peer.send(message);
      }
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `ws://localhost:${port}`,
    close: () =>
      new Promise<void>(resolve => {
        sockets.forEach(ws => ws.terminate());
        server.close(() => resolve());
      }),
  };
};

const createPeer = async (url: string, sessionPublicKey: Uint8Array) => {
  const ephemeralKey = crypto.randomKeypair();
  const publisher = crypto.to_hex(ephemeralKey.publicKey);
  const cipher = makeMessageCipher(makeCipher(crypto.ecdh(ephemeralKey, sessionPublicKey)));
  const ws = new WebSocket(url);
  await new Promise<void>(resolve => ws.on("open", () => resolve()));
  return {
    publisher,
    cipher,
    onMessage: (listener: (message: { message: string; payload: unknown }) => void) =>
      ws.on("message", raw => listener(JSON.parse(raw.toString()))),
    send: (message: Record<string, unknown>) =>
      ws.send(JSON.stringify({ version: 1, publisher, ...message })),
    sendRaw: (frame: string) => ws.send(frame),
    close: () => ws.close(),
  };
};

const NOT_A_POINT = "02".padEnd(66, "f");

const createScriptedHost = async (
  baseUrl: string,
  overrides: { HandshakeChallenge?: object; TrustchainAddedMember?: object } = {},
) => {
  const hostKey = crypto.randomKeypair();
  const publisher = crypto.to_hex(hostKey.publicKey);
  const scannedUrl = `${baseUrl}/v1/qr?host=${publisher}`;
  const peer = await createPeer(scannedUrl, hostKey.publicKey);
  let cipher: MessageCipher | undefined;

  const reply = (message: string, payload: object) =>
    peer.send({
      publisher,
      message,
      payload: cipher?.encryptMessagePayload(payload as Record<string, never>),
    });

  peer.onMessage(message => {
    switch (message.message) {
      case "InitiateHandshake": {
        const { ephemeral_public_key } = message.payload as { ephemeral_public_key: string };
        cipher = makeMessageCipher(
          makeCipher(crypto.ecdh(hostKey, crypto.from_hex(ephemeral_public_key))),
        );
        reply(
          "HandshakeChallenge",
          overrides.HandshakeChallenge ?? { digits: 3, connected: false },
        );
        break;
      }
      case "CompleteHandshakeChallenge":
        reply("HandshakeCompletionSucceeded", {});
        break;
      case "TrustchainShareCredential":
        reply(
          "TrustchainAddedMember",
          overrides.TrustchainAddedMember ?? { trustchain: MOCK_TRUSTCHAIN },
        );
        break;
    }
  });

  return { scannedUrl, close: peer.close };
};

const FORGED_PAYLOAD = { encrypted: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA" };

const authenticateAsCandidate = async (
  peer: Awaited<ReturnType<typeof createPeer>>,
  onDisplayDigits: jest.Mock,
) => {
  const received: string[] = [];
  const authenticated = new Promise<void>(resolve => {
    peer.onMessage(message => {
      received.push(message.message);
      if (message.message === "HandshakeChallenge") {
        peer.send({
          message: "CompleteHandshakeChallenge",
          payload: peer.cipher.encryptMessagePayload({ digits: onDisplayDigits.mock.calls[0][0] }),
        });
      }
      if (message.message === "HandshakeCompletionSucceeded") resolve();
    });
  });
  peer.send({
    message: "InitiateHandshake",
    payload: { ephemeral_public_key: peer.publisher },
  });
  await authenticated;
  return received;
};

const hostPublicKeyOf = (url: string) => {
  const match = url.match(/host=([0-9A-Fa-f]+)/);
  if (!match) throw new Error("no host public key in " + url);
  return crypto.from_hex(match[1]);
};

describe("Trustchain QR Code", () => {
  let relay: Awaited<ReturnType<typeof createRelay>> | undefined;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleError.mockRestore();
    if (relay) {
      await relay.close();
      relay = undefined;
    }
  });

  /**
   * Helper function to create common test setup
   */
  const createTestSetup = async () => {
    const memberCredentials = convertKeyPairToLiveCredentials(await crypto.randomKeypair());
    const addMember = jest.fn(() => Promise.resolve(MOCK_TRUSTCHAIN));
    const onRequestQRCodeInput = jest.fn();
    return {
      memberCredentials,
      addMember,
      onRequestQRCodeInput,
      memberName: "foo",
    };
  };

  const startHost = async ({
    initialTrustchainId,
    onDisplayDigits = jest.fn(),
    addMember,
    memberCredentials,
    memberName,
  }: {
    initialTrustchainId?: string;
    onDisplayDigits?: jest.Mock;
    addMember: jest.Mock;
    memberCredentials: Awaited<ReturnType<typeof createTestSetup>>["memberCredentials"];
    memberName: string;
  }) => {
    let resolveUrl: (url: string) => void;
    const urlPromise = new Promise<string>(resolve => {
      resolveUrl = resolve;
    });
    const promise = createQRCodeHostInstance({
      trustchainApiBaseUrl: relay?.baseUrl ?? "",
      onDisplayQRCode: url => resolveUrl(url),
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
      initialTrustchainId,
    });
    promise.catch(() => {});
    return { promise, url: await urlPromise, onDisplayDigits };
  };

  test("digits matching scenario", async () => {
    relay = await createRelay();
    const { memberCredentials, addMember, memberName } = await createTestSetup();
    const onDisplayDigits = jest.fn();

    const onRequestQRCodeInput = jest.fn((config, callback) =>
      callback(onDisplayDigits.mock.calls[0][0]),
    );

    const { promise: hostP, url: scannedUrl } = await startHost({
      initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
    });

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    const [_, res] = await Promise.all([hostP, candidateP]);

    expect(onDisplayDigits).toHaveBeenCalledWith(expect.any(String));
    expect(addMember).toHaveBeenCalled();
    expect(onRequestQRCodeInput).toHaveBeenCalledWith(
      { digits: 3, connected: false },
      expect.any(Function),
    );
    expect(res).toEqual(MOCK_TRUSTCHAIN);
  });

  test("the candidate owning the trustchain adds the host", async () => {
    relay = await createRelay();
    const { memberCredentials, addMember, memberName } = await createTestSetup();
    const hostAddMember = jest.fn(() => Promise.resolve(MOCK_TRUSTCHAIN));
    const onDisplayDigits = jest.fn();

    const onRequestQRCodeInput = jest.fn((config, callback) =>
      callback(onDisplayDigits.mock.calls[0][0]),
    );

    const { promise: hostP, url: scannedUrl } = await startHost({
      initialTrustchainId: undefined,
      onDisplayDigits,
      addMember: hostAddMember,
      memberCredentials,
      memberName,
    });

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    const [hostRes] = await Promise.all([hostP, candidateP]);

    expect(addMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: memberCredentials.pubkey, name: memberName }),
    );
    expect(hostAddMember).not.toHaveBeenCalled();
    expect(hostRes).toEqual(MOCK_TRUSTCHAIN);
  });

  test("invalid digits are rejected", async () => {
    relay = await createRelay();
    const { memberCredentials, addMember, memberName } = await createTestSetup();
    const onDisplayDigits = jest.fn();

    const onRequestQRCodeInput = jest.fn((config, callback) => callback("---"));

    const { promise: hostP, url: scannedUrl } = await startHost({
      initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
    });

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    await expect(hostP).rejects.toThrow(InvalidDigitsError);
    await expect(candidateP).rejects.toThrow(InvalidDigitsError);
    expect(addMember).not.toHaveBeenCalled();
  });

  test("ignores the digits being submitted a second time", async () => {
    relay = await createRelay();
    const { memberCredentials, addMember, memberName } = await createTestSetup();
    const onDisplayDigits = jest.fn();

    const onRequestQRCodeInput = jest.fn((config, callback) => {
      callback(onDisplayDigits.mock.calls[0][0]);
      callback("0000");
    });

    const { promise: hostP, url: scannedUrl } = await startHost({
      initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
    });

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    const [, res] = await Promise.all([hostP, candidateP]);

    expect(res).toEqual(MOCK_TRUSTCHAIN);
    expect(addMember).toHaveBeenCalledTimes(1);
  });

  describe("protocol enforcement", () => {
    test("the host rejects credentials shared before the digits are verified", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      peer.send({
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: peer.publisher },
      });
      peer.send({
        message: "TrustchainShareCredential",
        payload: peer.cipher.encryptMessagePayload({ id: "peer", name: "peer" }),
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    it.each([
      ["a non-json frame", "not json"],
      ["an unknown version", JSON.stringify({ version: 2, publisher: "aa", message: "x" })],
      ["a non-hex publisher", JSON.stringify({ version: 1, publisher: "zz", message: "x" })],
      ["a null payload", JSON.stringify({ version: 1, publisher: "aa", message: "x" })],
      [
        "a malformed InitiateHandshake",
        JSON.stringify({
          version: 1,
          publisher: "aa",
          message: "InitiateHandshake",
          payload: { ephemeral_public_key: 42 },
        }),
      ],
    ])("the host rejects %s", async (_, frame) => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      peer.sendRaw(frame);

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    test("the host rejects an ephemeral public key that is not a point", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      peer.send({
        publisher: NOT_A_POINT,
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: NOT_A_POINT },
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      peer.close();
    });

    test("the host rejects a frame it cannot decrypt", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      peer.send({
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: peer.publisher },
      });
      peer.send({
        message: "CompleteHandshakeChallenge",
        payload: { encrypted: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      peer.close();
    });

    test("the candidate rejects a TrustchainAddedMember carrying no trustchain", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();
      const onRequestQRCodeInput = jest.fn((config, callback) => callback("123"));

      const remoteHost = await createScriptedHost(relay.baseUrl, { TrustchainAddedMember: {} });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl: remoteHost.scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      remoteHost.close();
    });

    test("the candidate rejects an out of range digits count", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const remoteHost = await createScriptedHost(relay.baseUrl, {
        HandshakeChallenge: { digits: 1e9, connected: false },
      });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl: remoteHost.scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      expect(onRequestQRCodeInput).not.toHaveBeenCalled();
      remoteHost.close();
    });

    test("a scanned host key that is not a point is an invalid qr code", async () => {
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl: `ws://localhost:1/v1/qr?host=${NOT_A_POINT}`,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(ScannedInvalidQrCode);
    });

    test("the host does not answer a TrustchainRequestCredential it cannot open", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const {
        promise: hostP,
        url,
        onDisplayDigits,
      } = await startHost({
        initialTrustchainId: undefined,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      const received = await authenticateAsCandidate(peer, onDisplayDigits);

      peer.send({ message: "TrustchainRequestCredential", payload: FORGED_PAYLOAD });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(received).not.toContain("TrustchainShareCredential");
      peer.close();
    });

    test("the candidate does not share its credential on a HandshakeCompletionSucceeded it cannot open", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();
      const onRequestQRCodeInput = jest.fn((config, callback) => callback("123"));

      const hostKey = crypto.randomKeypair();
      const hostPublisher = crypto.to_hex(hostKey.publicKey);
      const scannedUrl = `${relay.baseUrl}/v1/qr?host=${hostPublisher}`;
      const remoteHost = await createPeer(scannedUrl, hostKey.publicKey);

      const received: string[] = [];
      remoteHost.onMessage(message => {
        received.push(message.message);
        if (message.message !== "InitiateHandshake") return;
        const { ephemeral_public_key } = message.payload as { ephemeral_public_key: string };
        const cipher = makeMessageCipher(
          makeCipher(crypto.ecdh(hostKey, crypto.from_hex(ephemeral_public_key))),
        );
        remoteHost.send({
          publisher: hostPublisher,
          message: "HandshakeChallenge",
          payload: cipher.encryptMessagePayload({ digits: 3, connected: false }),
        });
        remoteHost.send({
          publisher: hostPublisher,
          message: "HandshakeCompletionSucceeded",
          payload: FORGED_PAYLOAD,
        });
      });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      expect(received).not.toContain("TrustchainShareCredential");
      remoteHost.close();
    });

    test("the host does not answer a TrustchainShareCredential it cannot open", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const {
        promise: hostP,
        url,
        onDisplayDigits,
      } = await startHost({
        initialTrustchainId: undefined,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      const received = await authenticateAsCandidate(peer, onDisplayDigits);

      peer.send({ message: "TrustchainShareCredential", payload: FORGED_PAYLOAD });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(received).not.toContain("Failure");
      peer.close();
    });

    test("the host rejects a member id that is not a public key", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const {
        promise: hostP,
        url,
        onDisplayDigits,
      } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      await authenticateAsCandidate(peer, onDisplayDigits);

      peer.send({
        message: "TrustchainShareCredential",
        payload: peer.cipher.encryptMessagePayload({ id: "not-a-key", name: "peer" }),
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    test("the host rejects a frame whose decrypted body is not an object", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const {
        promise: hostP,
        url,
        onDisplayDigits,
      } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      await authenticateAsCandidate(peer, onDisplayDigits);

      peer.send({
        message: "TrustchainShareCredential",
        payload: { encrypted: peer.cipher.encryptMessagePayload(null as never).encrypted },
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    test("the host stops handling frames once the session failed", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const {
        promise: hostP,
        url,
        onDisplayDigits,
      } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      await authenticateAsCandidate(peer, onDisplayDigits);

      // an out-of-order frame, then one that would have been valid before it
      peer.send({
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: peer.publisher },
      });
      peer.send({
        message: "TrustchainShareCredential",
        payload: peer.cipher.encryptMessagePayload({ id: memberCredentials.pubkey, name: "peer" }),
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    test("the host rejects a second InitiateHandshake", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      const initiate = {
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: peer.publisher },
      };
      peer.send(initiate);
      peer.send(initiate);

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      peer.close();
    });

    test("the host rejects an InitiateHandshake not published by its ephemeral key", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const peer = await createPeer(url, hostPublicKeyOf(url));
      peer.send({
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: crypto.to_hex(crypto.randomKeypair().publicKey) },
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      peer.close();
    });

    test("the host rejects a message coming from another peer", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, memberName } = await createTestSetup();

      const { promise: hostP, url } = await startHost({
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        memberCredentials,
        memberName,
      });

      const hostPublicKey = hostPublicKeyOf(url);
      const candidate = await createPeer(url, hostPublicKey);
      const otherPeer = await createPeer(url, hostPublicKey);

      candidate.send({
        message: "InitiateHandshake",
        payload: { ephemeral_public_key: candidate.publisher },
      });
      otherPeer.send({
        message: "CompleteHandshakeChallenge",
        payload: otherPeer.cipher.encryptMessagePayload({ digits: "000" }),
      });

      await expect(hostP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      candidate.close();
      otherPeer.close();
    });

    test("the candidate rejects credentials shared before the digits are verified", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const hostKey = crypto.randomKeypair();
      const hostPublisher = crypto.to_hex(hostKey.publicKey);
      const scannedUrl = `${relay.baseUrl}/v1/qr?host=${hostPublisher}`;
      const remoteHost = await createPeer(scannedUrl, hostKey.publicKey);

      remoteHost.onMessage(message => {
        if (message.message !== "InitiateHandshake") return;
        const { ephemeral_public_key } = message.payload as { ephemeral_public_key: string };
        const cipher = makeMessageCipher(
          makeCipher(crypto.ecdh(hostKey, crypto.from_hex(ephemeral_public_key))),
        );
        remoteHost.send({
          publisher: hostPublisher,
          message: "TrustchainShareCredential",
          payload: cipher.encryptMessagePayload({ id: "peer", name: "peer" }),
        });
      });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
        addMember,
        scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      expect(addMember).not.toHaveBeenCalled();
      expect(onRequestQRCodeInput).not.toHaveBeenCalled();
      remoteHost.close();
    });

    test("the candidate rejects a trustchain sent before the digits are verified", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const hostKey = crypto.randomKeypair();
      const hostPublisher = crypto.to_hex(hostKey.publicKey);
      const scannedUrl = `${relay.baseUrl}/v1/qr?host=${hostPublisher}`;
      const remoteHost = await createPeer(scannedUrl, hostKey.publicKey);

      remoteHost.onMessage(message => {
        if (message.message !== "InitiateHandshake") return;
        const { ephemeral_public_key } = message.payload as { ephemeral_public_key: string };
        const cipher = makeMessageCipher(
          makeCipher(crypto.ecdh(hostKey, crypto.from_hex(ephemeral_public_key))),
        );
        remoteHost.send({
          publisher: hostPublisher,
          message: "TrustchainAddedMember",
          payload: cipher.encryptMessagePayload({ trustchain: MOCK_TRUSTCHAIN }),
        });
      });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      remoteHost.close();
    });

    test("the candidate rejects a message not published by the scanned host", async () => {
      relay = await createRelay();
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const hostKey = crypto.randomKeypair();
      const scannedUrl = `${relay.baseUrl}/v1/qr?host=${crypto.to_hex(hostKey.publicKey)}`;
      const otherPeer = await createPeer(scannedUrl, hostKey.publicKey);

      otherPeer.onMessage(message => {
        if (message.message !== "InitiateHandshake") return;
        otherPeer.send({
          message: "HandshakeChallenge",
          payload: otherPeer.cipher.encryptMessagePayload({ digits: 3, connected: false }),
        });
      });

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(QRCodeProtocolError);
      expect(onRequestQRCodeInput).not.toHaveBeenCalled();
      otherPeer.close();
    });
  });

  test("invalid qr code scanned", async () => {
    const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
      await createTestSetup();
    const scannedUrl = "https://example.com";

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    await expect(candidateP).rejects.toThrow(new ScannedInvalidQrCode());
  });

  test("old accounts export qr code scanned", async () => {
    const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
      await createTestSetup();

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl: LEGACY_IMPORT_QR_CODE,
      onRequestQRCodeInput,
    });

    await expect(candidateP).rejects.toThrow(new ScannedOldImportQrCode());
  });

  it.each(Object.entries(CRYPTO_ADDRESSES))(
    "should reject cryptocurrency address (%s) as invalid QR code",
    async (_, address) => {
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl: address,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(new ScannedInvalidQrCode());
    },
  );
});
