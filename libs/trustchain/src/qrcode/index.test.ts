import { createQRCodeHostInstance, createQRCodeCandidateInstance } from ".";
import WebSocket from "ws";
import { convertKeyPairToLiveCredentials } from "../sdk";
import { crypto } from "@ledgerhq/hw-trustchain";

describe("Trustchain QR Code", () => {
  let server;
  let a;
  let b;

  beforeAll(() => {
    server = new WebSocket.Server({ port: 1234 });
    server.on("connection", ws => {
      if (!a) {
        a = ws;
      } else if (!b) {
        b = ws;
      }
      ws.on("message", message => {
        if (ws === a && b) {
          b.send(message);
        } else if (ws === b && a) {
          a.send(message);
        }
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  test("digits matching scenario", async () => {
    const onDisplayDigits = jest.fn();
    const trustchain = {
      rootId: "test-root-id",
      walletSyncEncryptionKey: "test-wallet-sync-encryption-key",
      applicationPath: "m/0'/16'/0'",
    };
    const addMember = jest.fn(() => Promise.resolve(trustchain));
    const memberCredentials = convertKeyPairToLiveCredentials(await crypto.randomKeypair());
    const memberName = "foo";

    let scannedUrlResolve: (url: string) => void;
    const scannedUrlPromise = new Promise<string>(resolve => {
      scannedUrlResolve = resolve;
    });
    const onDisplayQRCode = (url: string) => {
      scannedUrlResolve(url);
    };
    const onRequestQRCodeInput = jest.fn((config, callback) =>
      callback(onDisplayDigits.mock.calls[0][0]),
    );

    const hostP = createQRCodeHostInstance({
      trustchainApiBaseUrl: "ws://localhost:1234",
      onDisplayQRCode,
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
      initialTrustchainId: trustchain.rootId,
    });

    const scannedUrl = await scannedUrlPromise;

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
    expect(res).toEqual(trustchain);
  });
});
